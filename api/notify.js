// /api/notify.js — Vercel Serverless Function
// Server-side Telegram notification proxy — keeps bot token off the client
//
// POST ?action=wire   — notify admin of bank wire transfer
// POST ?action=signal — forward signal phase notification (optional)
//
// Env vars required (Vercel dashboard):
//   TELEGRAM_BOT_TOKEN   — Telegram bot token
//   TELEGRAM_ADMIN_CHAT  — Admin chat ID

const https = require('https');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendTelegram(token, chatId, text) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
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

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT;

  if (!token || !chatId) {
    return res.status(500).json({ error: 'Telegram env vars not configured' });
  }

  const action = req.query.action;

  // ── Wire transfer notification ────────────────────────────────────────────
  if (action === 'wire' && req.method === 'POST') {
    const { name, email, ref, price } = req.body || {};
    if (!ref) return res.status(400).json({ error: 'ref required' });

    const msg =
      '*New Bank Transfer Request*\n' +
      'Amount: *' + (price || '$12.99 USD') + '*\n' +
      'Ref: `' + ref + '`\n' +
      'User: ' + (name || 'Unknown') + ' (' + (email || 'No email') + ')\n\n' +
      'Confirm only after you see the transfer in your Ecobank account.';

    const result = await sendTelegram(token, chatId, msg);
    if (result.ok && result.body?.ok) {
      return res.status(200).json({ ok: true });
    }
    return res.status(502).json({ error: 'Telegram send failed' });
  }

  // ── Status check (health endpoint for proxy) ─────────────────────────────
  if (action === 'status' && req.method === 'GET') {
    const result = await sendTelegram(token, chatId, 'AxTrader status check');
    return res.status(200).json({ ok: result.ok });
  }

  return res.status(404).json({ error: 'unknown action' });
};
