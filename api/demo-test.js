// /api/demo-test.js — Vercel Serverless Function
// Test/Demo mode — grants 24h premium without real payment
// Used for users to freely test premium features

const https = require('https');
const crypto = require('crypto');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

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

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });

  const emailLower = email.toLowerCase().trim();
  const hash = crypto.createHash('sha256').update(emailLower).digest('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const list = await readPremiumGist();

  // Check if already active (not expired)
  const existing = list.find(u => u.hash === hash);
  if (existing && existing.plan === 'demo' && existing.expiresAt && new Date(existing.expiresAt) > now) {
    return res.status(200).json({
      success: true,
      message: 'Demo already active',
      email: emailLower,
      expiresAt: existing.expiresAt
    });
  }

  // Remove old demo entry if exists
  const filtered = list.filter(u => !(u.hash === hash && u.plan === 'demo'));

  filtered.push({
    hash,
    paymentId: 'demo-' + now.getTime(),
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    plan: 'demo'
  });

  await writePremiumGist(filtered);

  return res.status(200).json({
    success: true,
    email: emailLower,
    expiresAt: expiresAt.toISOString(),
    message: 'Demo premium activated — 24 hours'
  });
};
