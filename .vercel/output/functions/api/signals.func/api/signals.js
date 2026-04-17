"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.config = void 0;
exports.default = handler;
// Vercel Serverless API — Proxy for GitHub Gist signals
// Fetches crypto, forex, and stocks signals from the public gist
// and serves them as a combined response with CORS.

const config = exports.config = {
  runtime: 'edge'
};
const GIST_USER = 'asterixcomltd';
const GIST_ID = 'a4caaf2993eea50322f31478391743b0';
const BOT_MAP = [{
  file: 'crypto_signals.json',
  bot: 'crypto'
}, {
  file: 'forex_signals.json',
  bot: 'forex'
}, {
  file: 'stocks_signals.json',
  bot: 'stocks'
}];
async function handler(req) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405
    });
  }
  const origin = req.headers.get('origin') || '*';
  try {
    const results = await Promise.allSettled(BOT_MAP.map(({
      file,
      bot
    }) => fetch(`https://gist.githubusercontent.com/${GIST_USER}/${GIST_ID}/raw/${file}?t=${Date.now()}`).then(res => res.ok ? res.json() : []).then(arr => arr.map(s => ({
      ...s,
      bot
    })))));
    const signals = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value).filter(s => s?.pair || s?.symbol).sort((a, b) => (b.ts || b.timestamp || 0) - (a.ts || a.timestamp || 0));
    return new Response(JSON.stringify(signals), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin
      }
    });
  }
}
//# sourceMappingURL=signals.js.map