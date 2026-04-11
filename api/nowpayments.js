// /api/nowpayments.js — Vercel Serverless Function
// Handles all NOWPayments interactions:
//   POST ?action=create       — create a new crypto payment
//   GET  ?action=check&id=X   — poll payment status
//   POST ?action=webhook      — IPN callback from NOWPayments (auto-upgrades user)
//   GET  ?action=is-premium&email=X — check if email is in the premium gist

const crypto = require('crypto');
const https  = require('https');

// ── helpers ──────────────────────────────────────────────────────────────────

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-nowpayments-sig');
}

// NOWPayments requires payload sorted recursively by key before HMAC
function sortObject(obj) {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc, k) => {
      acc[k] = sortObject(obj[k]);
      return acc;
    }, {});
  }
  return obj;
}

function nowFetch(path, options = {}) {
  return new Promise((resolve, reject) => {
    const { method = 'GET', body, headers = {} } = options;
    const reqHeaders = {
      'x-api-key'   : process.env.NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json',
      ...headers,
    };
    const bodyStr = body ? JSON.stringify(body) : undefined;
    if (bodyStr) reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = https.request(
      { hostname: 'api.nowpayments.io', path: `/v1${path}`, method, headers: reqHeaders },
      (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch (e) { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── GitHub Gist helpers (premium users store) ────────────────────────────────
const GIST_ID   = process.env.GIST_ID   || 'a4caaf2993eea50322f31478391743b0';
const GIST_FILE = 'premium_users.json';

async function readPremiumGist() {
  return new Promise((resolve, reject) => {
    const headers = {
      'Authorization': `token ${process.env.GH_PAT}`,
      'User-Agent'   : 'AxTrader-Server',
      'Accept'       : 'application/vnd.github.v3+json',
    };
    const req = https.request(
      { hostname: 'api.github.com', path: `/gists/${GIST_ID}`, method: 'GET', headers },
      (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const gist = JSON.parse(data);
            const content = gist.files?.[GIST_FILE]?.content || '[]';
            resolve(JSON.parse(content));
          } catch (e) { resolve([]); }
        });
      }
    );
    req.on('error', () => resolve([]));
    req.end();
  });
}

async function writePremiumGist(list) {
  const body = JSON.stringify({
    files: { [GIST_FILE]: { content: JSON.stringify(list, null, 2) } }
  });
  return new Promise((resolve) => {
    const headers = {
      'Authorization' : `token ${process.env.GH_PAT}`,
      'User-Agent'    : 'AxTrader-Server',
      'Accept'        : 'application/vnd.github.v3+json',
      'Content-Type'  : 'application/json',
      'Content-Length': Buffer.byteLength(body),
    };
    const req = https.request(
      { hostname: 'api.github.com', path: `/gists/${GIST_ID}`, method: 'PATCH', headers },
      (res) => { res.resume(); res.on('end', resolve); }
    );
    req.on('error', resolve);
    req.write(body);
    req.end();
  });
}

async function addPremiumUser(email, paymentId) {
  const hash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
  const list = await readPremiumGist();
  // Idempotent — skip if already present
  if (list.some(u => u.hash === hash)) return;
  list.push({ hash, paymentId, activatedAt: new Date().toISOString() });
  await writePremiumGist(list);
}

async function isPremiumUser(email) {
  const hash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
  const list = await readPremiumGist();
  return list.some(u => u.hash === hash);
}

// ── Telegram admin notification ───────────────────────────────────────────────
async function notifyAdmin(message) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT;
  if (!token || !chatId) return;
  const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' });
  return new Promise((resolve) => {
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
    const req = https.request(
      { hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST', headers },
      (res) => { res.resume(); res.on('end', resolve); }
    );
    req.on('error', resolve);
    req.write(body);
    req.end();
  });
}

// ── Main handler ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  // ── 1. CREATE PAYMENT ─────────────────────────────────────────────────────
  if (action === 'create' && req.method === 'POST') {
    const { email, currency = 'usdttrc20' } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    const payload = {
      price_amount         : parseFloat(process.env.PREMIUM_PRICE || '12.99'),
      price_currency       : 'usd',
      pay_currency         : currency,
      order_id             : crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex'),
      order_description    : 'AxTrader Premium — monthly subscription',
      ipn_callback_url     : 'https://axtrader.vercel.app/api/nowpayments?action=webhook',
      success_url          : 'https://axtrader.vercel.app/?promo=NOWPAY-AUTO',
      cancel_url           : 'https://axtrader.vercel.app/',
      is_fixed_rate        : false,
      is_fee_paid_by_user  : true,
    };

    const result = await nowFetch('/payment', { method: 'POST', body: payload });
    if (result.status !== 201) {
      return res.status(result.status).json({ error: result.body?.message || 'NOWPayments error' });
    }
    return res.status(200).json(result.body);
  }

  // ── 2. CHECK PAYMENT STATUS ───────────────────────────────────────────────
  if (action === 'check' && req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    const result = await nowFetch(`/payment/${id}`);
    return res.status(200).json(result.body);
  }

  // ── 3. IPN WEBHOOK ────────────────────────────────────────────────────────
  if (action === 'webhook' && req.method === 'POST') {
    const sig    = req.headers['x-nowpayments-sig'];
    const secret = process.env.NOWPAYMENTS_IPN_SECRET;

    if (secret && sig) {
      const sorted  = sortObject(req.body);
      const hmac    = crypto.createHmac('sha512', secret)
                            .update(JSON.stringify(sorted))
                            .digest('hex');
      if (hmac !== sig) {
        console.warn('IPN signature mismatch — ignoring');
        return res.status(400).json({ error: 'invalid signature' });
      }
    }

    const { payment_status, order_id: emailHash, payment_id, pay_amount, pay_currency } = req.body || {};
    const finished = ['finished', 'confirmed', 'complete'].includes(payment_status);

    if (finished && emailHash) {
      // Find the email by matching hashes in the gist (we stored hash as order_id)
      // We store the hash directly — no email lookup needed
      const list = await readPremiumGist();
      if (!list.some(u => u.hash === emailHash)) {
        list.push({ hash: emailHash, paymentId: payment_id, activatedAt: new Date().toISOString() });
        await writePremiumGist(list);
        await notifyAdmin(
          `✅ *NOWPayments — Auto Premium Activated*\n` +
          `Payment ID: \`${payment_id}\`\n` +
          `Amount: ${pay_amount} ${(pay_currency||'').toUpperCase()}\n` +
          `Status: ${payment_status}\n` +
          `Order hash: \`${emailHash?.slice(0,16)}…\``
        );
      }
    }

    return res.status(200).json({ ok: true });
  }

  // ── 4. IS-PREMIUM CHECK ───────────────────────────────────────────────────
  if (action === 'is-premium' && req.method === 'GET') {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    const premium = await isPremiumUser(email);
    return res.status(200).json({ premium });
  }

  return res.status(404).json({ error: 'unknown action' });
};
