// /api/news.js — Vercel Serverless Function
// Server-side news proxy — avoids CORS issues with external APIs
// Fetches from CryptoCompare (free, no key) + NewsAPI (key required)

const https = require('https');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ ok: res.statusCode < 300, status: res.statusCode, json: JSON.parse(data) }); }
        catch (e) { resolve({ ok: false, status: res.statusCode, json: null }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function mapTag(categories = '') {
  const c = categories.toUpperCase();
  if (c.includes('BTC') || c.includes('BITCOIN'))    return 'BITCOIN';
  if (c.includes('ETH') || c.includes('ETHEREUM'))   return 'ETHEREUM';
  if (c.includes('FOREX') || c.includes('GOLD') || c.includes('XAU')) return 'FOREX';
  if (c.includes('MACRO') || c.includes('ECONOMY') || c.includes('FED') || c.includes('INFLATION')) return 'MACRO';
  if (c.includes('STOCKS') || c.includes('EQUIT'))   return 'STOCKS';
  if (c.includes('ALTCOIN') || c.includes('SOL') || c.includes('DEFI')) return 'ALTCOIN';
  return 'MACRO';
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const articles = [];

  // ── Source 1: CryptoCompare (free, no key needed) ─────────────────────────
  try {
    const cc = await httpsGet(
      'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest&limit=30'
    );
    if (cc.ok && cc.json && cc.json.Data) {
      cc.json.Data.forEach(a => {
        articles.push({
          tag:    mapTag(a.categories || ''),
          title:  a.title,
          body:   a.body ? a.body.substring(0, 220) + '…' : '',
          time:   new Date(a.published_on * 1000).toISOString(),
          ts:     a.published_on * 1000,
          source: a.source_info?.name || a.source || 'CryptoCompare',
          url:    a.url || '#',
          img:    a.imageurl || '',
        });
      });
    }
  } catch (e) {
    console.error('[News API] CryptoCompare error:', e.message);
  }

  // ── Source 2: NewsAPI (requires key — set NEWSAPI_KEY in Vercel env vars) ──
  const newsApiKey = process.env.NEWSAPI_KEY || 'baee18780bcf4fe4a1d9ba942aa66605';
  try {
    const na = await httpsGet(
      `https://newsapi.org/v2/everything?q=(BTC+OR+ETH+OR+forex+OR+gold+OR+economy+OR+inflation)&sortBy=publishedAt&pageSize=10&language=en&apiKey=${newsApiKey}`
    );
    if (na.ok && na.json && na.json.articles) {
      na.json.articles.forEach(a => {
        if (!a.title || a.title === '[Removed]') return;
        const combined = (a.title + ' ' + (a.description || '')).toUpperCase();
        let tag = 'MACRO';
        if (combined.includes('BITCOIN') || combined.includes(' BTC')) tag = 'BITCOIN';
        else if (combined.includes('ETHEREUM') || combined.includes(' ETH')) tag = 'ETHEREUM';
        else if (combined.includes('FOREX') || combined.includes('GOLD') || combined.includes('XAU')) tag = 'FOREX';
        else if (combined.includes('STOCK') || combined.includes('NVDA') || combined.includes('NASDAQ')) tag = 'STOCKS';
        const ts = new Date(a.publishedAt).getTime();
        articles.push({
          tag,
          title:  a.title,
          body:   a.description ? a.description.substring(0, 220) + '…' : '',
          time:   a.publishedAt,
          ts,
          source: a.source?.name || 'NewsAPI',
          url:    a.url || '#',
          img:    a.urlToImage || '',
        });
      });
    }
  } catch (e) {
    console.error('[News API] NewsAPI error:', e.message);
  }

  if (articles.length === 0) {
    return res.status(502).json({ error: 'All news sources unavailable' });
  }

  // Sort newest first, deduplicate by title prefix
  articles.sort((a, b) => b.ts - a.ts);
  const seen = new Set();
  const deduped = articles.filter(a => {
    const key = a.title.substring(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 40);

  res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=300');
  return res.status(200).json({ articles: deduped, count: deduped.length, fetchedAt: new Date().toISOString() });
};
