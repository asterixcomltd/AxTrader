// Vercel Serverless API — Proxy for CoinGecko prices
// Fetches crypto prices via CoinGecko with CORS and caching.

import { COINGECKO_IDS } from '../js/config.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // CoinGecko free API rate limit is ~10-30 req/min — cache for 60s
  const now = Date.now();
  const cacheKey = 'cg_prices';

  const origin = req.headers.get('origin') || '*';

  try {
    const ids = COINGECKO_IDS || 'bitcoin,ethereum,solana,avalanche-2,uniswap,decentralized-social,chainlink,near,aave,arbitrum,injective-protocol,polkadot,filecoin,sui,cosmos';
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.split(',').join(',')}&vs_currencies=usd&include_24hr_change=true`;

    let priceData;
    try {
      const res = await fetch(url);
      if (res.ok) {
        priceData = await res.json();
      }
    } catch (cacheErr) {
      console.warn('CoinGecko fetch failed:', cacheErr);
    }

    if (priceData) {
      return new Response(JSON.stringify(priceData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Cache-Control': 'public, max-age=55',
        },
      });
    }

    // Fallback: return empty object
    return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin } });
  }
}
