// AxTrader Market Feature Module
// CoinGecko price fetching, ticker rendering, fundamentals

import { store } from '../store.js';
import { COINGECKO_IDS, TICKER_LABELS, TICKER_FALLBACK, API } from '../config.js';

let tickerEl = null;
let livePriceMap = {};

export function initTicker() {
  tickerEl = document.getElementById('ticker');
  fetchPrices();
}

export async function fetchPrices() {
  try {
    const data = await _fetchCoinGecko();
    if (data) {
      livePriceMap = _buildPriceMap(data);
      store.setPrices(livePriceMap);
      _renderTicker(data);
    }
  } catch {
    _renderTickerFallback();
  }
}

async function _fetchCoinGecko() {
  // Try Vercel API first, fall back to direct CoinGecko
  try {
    const res = await fetch(`${API.prices}?t=${Date.now()}`);
    if (res.ok) return await res.json();
  } catch {}

  // Direct CoinGecko
  const ids = COINGECKO_IDS.split(',').join(',');
  const url = `${API.coingecko}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('CoinGecko fetch failed');
  return await res.json();
}

function _buildPriceMap(data) {
  const map = {};
  Object.entries(data).forEach(([id, info]) => {
    const label = TICKER_LABELS[id];
    if (label && info?.usd) {
      map[label] = info.usd;
    }
  });
  return map;
}

function _renderTicker(data) {
  if (!tickerEl) return;

  const items = [];
  Object.entries(data).forEach(([id, info]) => {
    const label = TICKER_LABELS[id] || id;
    const price = info?.usd;
    if (price == null) return;
    const change = info?.usd_24h_change;
    const changeClass = change >= 0 ? 'tick-up' : 'tick-down';
    const changeSymbol = change >= 0 ? '+' : '';
    items.push(
      `<span class="tick-item"><span class="ticker-live-dot"></span>${label} $${_fmt(price)} <span class="${changeClass}">${changeSymbol}${change?.toFixed(2)}%</span></span>`
    );
  });

  if (!items.length) {
    _renderTickerFallback();
    return;
  }

  // Duplicate for seamless infinite scroll
  tickerEl.innerHTML = items.join('') + items.join('');
}

function _renderTickerFallback() {
  if (!tickerEl) return;
  const items = TICKER_FALLBACK.map(t => {
    const changeClass = t.change >= 0 ? 'tick-up' : 'tick-down';
    const changeSymbol = t.change >= 0 ? '+' : '';
    return `<span class="tick-item">${t.label} $${_fmt(t.price)} <span class="${changeClass}">${changeSymbol}${t.change}%</span></span>`;
  }).join('');
  tickerEl.innerHTML = items + items;
}

function _fmt(n) {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(6);
}

// Fundamentals: Fear & Greed Index, BTC Dominance, DXY
export async function fetchFundamentals() {
  try {
    // Fear & Greed
    try {
      const fgRes = await fetch('https://api.alternative.me/fng/');
      if (fgRes.ok) {
        const fgData = await fgRes.json();
        const fg = fgData.data?.[0];
        if (fg?.value) {
          const val = fg.value;
          const el = document.getElementById('fg-val');
          if (el) el.textContent = `${val} — ${fg.value_classification}`;
        }
      }
    } catch {}

    // BTC Dominance
    try {
      const btcDomRes = await fetch('https://api.coinstats.app/public/v1/coins/bitcoin?skip=0');
      if (btcDomRes.ok) {
        const btcData = await btcDomRes.json();
        const el = document.getElementById('btc-dom-val');
        if (el && btcData?.coin?.marketCap) {
          el.textContent = btcData.coin.dominance?.toFixed(1) + '%';
        }
      }
    } catch {}

  } catch {}
}

export function updateSessionClock() {
  const el = document.getElementById('session-time');
  if (!el) return;
  const now = new Date();
  const utc = now.getUTCHours();
  let session = 'Sydney';
  if (utc >= 7 && utc < 16) session = 'London';
  else if (utc >= 12 && utc < 21) session = 'NY';
  else if (utc >= 22 || utc < 1) session = 'Tokyo';
  el.parentElement.innerHTML = `${session} Session<br><span id="session-time">${now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>`;
}

// Expose for inline handlers
window.updateSessionClock = updateSessionClock;
