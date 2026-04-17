// /api/news.js — Vercel Serverless Function
// Server-side news proxy — avoids CORS issues with external APIs
// v3.6: Replaced dead CryptoCompare + CoinGecko with RSS feeds (free, no key)

const https = require('https');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000 }, (r) => {
      let data = '';
      r.on('data', chunk => { data += chunk; });
      r.on('end', () => {
        try { resolve({ ok: r.statusCode < 300, status: r.statusCode, json: JSON.parse(data) }); }
        catch (e) { resolve({ ok: false, status: r.statusCode, json: null }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function mapTag(text = '') {
  const c = text.toUpperCase();
  if (c.includes('BTC') || c.includes('BITCOIN'))    return 'BITCOIN';
  if (c.includes('ETH') || c.includes('ETHEREUM'))   return 'ETHEREUM';
  if (c.includes('FOREX') || c.includes('GOLD') || c.includes('XAU') || c.includes('DOLLAR')) return 'FOREX';
  if (c.includes('MACRO') || c.includes('ECONOMY') || c.includes('FED') || c.includes('INFLATION') || c.includes('RATE') || c.includes('TREASURY')) return 'MACRO';
  if (c.includes('STOCK') || c.includes('EQUIT') || c.includes('NVDA') || c.includes('NASDAQ') || c.includes('S&P')) return 'STOCKS';
  if (c.includes('DEFI') || c.includes('DEX') || c.includes('SWAP') || c.includes('AAVE') || c.includes('UNI')) return 'DEFI';
  if (c.includes('SOL') || c.includes('ALTCOIN') || c.includes('DOGE') || c.includes('ADA') || c.includes('XRP')) return 'ALTCOIN';
  return 'MACRO';
}

// RSS feed via rss2json.com (free, no key, 10 items per feed)
const RSS_FEEDS = [
  { url: 'https://cointelegraph.com/rss', source: 'CoinTelegraph' },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
  { url: 'https://decrypt.co/feed', source: 'Decrypt' },
];

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const articles = [];

  // ── Source 1: RSS Feeds (free, no key, always works) ─────────────────────
  for (const feed of RSS_FEEDS) {
    try {
      const rss = await httpsGet(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`
      );
      if (rss.ok && rss.json && rss.json.items) {
        rss.json.items.forEach(a => {
          if (!a.title) return;
          const ts = new Date(a.pubDate).getTime();
          if (isNaN(ts)) return;
          // Strip HTML tags from description
          const body = (a.description || '').replace(/<[^>]*>/g, '').substring(0, 220);
          articles.push({
            tag:    mapTag(a.title + ' ' + (a.categories || []).join(' ')),
            title:  a.title,
            body:   body ? body + '…' : '',
            time:   new Date(ts).toISOString(),
            ts,
            source: feed.source,
            url:    a.link || '#',
            img:    a.thumbnail || a.enclosure?.link || '',
          });
        });
      }
    } catch (e) {
      console.error(`[News API] ${feed.source} RSS error:`, e.message);
    }
  }

  // ── Source 2: NewsAPI (bonus — only if key is set in env) ─────────────────
  const newsApiKey = process.env.NEWSAPI_KEY || '';
  if (newsApiKey) {
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
