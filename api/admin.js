// /api/admin.js — Vercel Serverless Function
// Admin endpoints for managing premium users:
//   GET  ?action=list       — list all premium users
//   POST ?action=grant      — manually grant premium to an email (sends Telegram notification)
//   POST ?action=revoke     — remove a user from premium
//   GET  ?action=payments   — list recent NOWPayments orders
//   GET  ?action=status     — check admin auth
//   POST ?action=auth       — authenticate with admin password

const https = require('https');
const crypto = require('crypto');

// ── helpers ──────────────────────────────────────────────────────────────────

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function verifyAdmin(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function isAdmin(token) {
  return token === process.env.ADMIN_API_KEY;
}

// ── Telegram send (reuses your existing bot token) ───────────────────────────

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT;
  if (!token || !chatId) {
    console.warn('Telegram env vars not set — notification skipped');
    return { ok: false, detail: 'Telegram not configured' };
  }
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
    const req = https.request(
      { hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST', headers },
      (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve({ ok: true, body: JSON.parse(data) }); }
          catch (e) { resolve({ ok: false, body: data }); }
        });
      }
    );
    req.on('error', () => resolve({ ok: false, body: 'network error' }));
    req.write(body);
    req.end();
  });
}

// ── GitHub Gist helpers ──────────────────────────────────────────────────────

const GIST_ID   = process.env.GIST_ID   || 'a4caaf2993eea50322f31478391743b0';
const GIST_FILE = 'premium_users.json';

async function readPremiumGist() {
  return new Promise((resolve) => {
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
          } catch { resolve([]); }
        });
      }
    );
    req.on('error', () => resolve([]));
    req.end();
  });
}

async function writePremiumGist(list) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      files: { [GIST_FILE]: { content: JSON.stringify(list, null, 2) } }
    });
    const headers = {
      'Authorization' : `token ${process.env.GH_PAT}`,
      'Content-Type'  : 'application/json',
      'User-Agent'    : 'AxTrader-Server',
      'Accept'        : 'application/vnd.github.v3+json',
      'Content-Length': Buffer.byteLength(body),
    };
    const githubReq = https.request(
      { hostname: 'api.github.com', path: `/gists/${GIST_ID}`, method: 'PATCH', headers },
      (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    githubReq.on('error', (e) => resolve({ status: 0, body: e.message }));
    githubReq.write(body);
    githubReq.end();
  });
}

// ── NOWPayments helper ───────────────────────────────────────────────────────

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

// ── route handler ────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action');

  // Auth endpoint — no token required
  if (action === 'auth') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    const { password } = req.body || {};
    if (password === process.env.ADMIN_PASSWORD) {
      return res.status(200).json({ token: process.env.ADMIN_API_KEY });
    }
    return res.status(401).json({ error: 'Invalid password' });
  }

  // All other actions require admin token
  const token = verifyAdmin(req);
  if (!token || !isAdmin(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── List premium users ─────────────────────────────────────
  if (action === 'list') {
    const users = await readPremiumGist();
    return res.status(200).json({ success: true, users });
  }

  // ── Grant premium (auto-notifies Telegram) ─────────────────
  if (action === 'grant') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    const { email, paymentId = 'manual', plan = 'manual' } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const emailLower = email.toLowerCase().trim();
    const hash = crypto.createHash('sha256').update(emailLower).digest('hex');
    const expiresAt = plan === 'demo'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    const list = await readPremiumGist();
    if (list.some(u => u.hash === hash)) {
      return res.status(409).json({ error: 'User already has premium', hash });
    }
    const entry = { hash, paymentId, activatedAt: new Date().toISOString(), plan };
    if (expiresAt) entry.expiresAt = expiresAt;
    list.push(entry);
    await writePremiumGist(list);

    // Notify admin via Telegram
    const msg =
      `🎉 <b>Premium Granted</b>\n` +
      `User: ${emailLower}\n` +
      `Plan: ${plan}\n` +
      `Ref: ${paymentId}\n` +
      (expiresAt ? `Expires: ${new Date(expiresAt).toLocaleString()}\n` : '') +
      `[AxTrader Admin]`;
    await sendTelegram(msg);

    return res.status(200).json({ success: true, email: emailLower, hash, expiresAt });
  }

  // ── Revoke premium ─────────────────────────────────────────
  if (action === 'revoke') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const hash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
    const list = await readPremiumGist();
    const filtered = list.filter(u => u.hash !== hash);
    if (filtered.length === list.length) {
      return res.status(404).json({ error: 'User not found', hash });
    }
    await writePremiumGist(filtered);
    return res.status(200).json({ success: true, removed: list.length - filtered.length });
  }

  // ── List recent NOWPayments ────────────────────────────────
  if (action === 'payments') {
    try {
      const result = await nowFetch('/payment', {
        query: { limit: 50, sortBy: 'created_at', sortOrder: 'DESC' }
      });
      const payments = Array.isArray(result.body) ? result.body : [];
      return res.status(200).json({ success: true, payments });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch payments', detail: e.message });
    }
  }

  // ── Admin status ───────────────────────────────────────────
  if (action === 'status') {
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action', action });
};
