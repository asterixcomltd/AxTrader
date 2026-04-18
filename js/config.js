// AxTrader Application Configuration
import { ICONS } from './utils/icons.js';

// ── API Endpoints ───────────────────────────────────────────────────
export const API = {
  // Primary signal source (GitHub Gist)
  gist_user: 'asterixcomltd',
  gist_id: 'a4caaf2993eea50322f31478391743b0',
  
  // Vercel serverless API (preferred when deployed)
  signals: '/api/signals',
  prices: '/api/prices',
  
  // External data sources
  coingecko: 'https://api.coingecko.com/api/v3',
  cryptocompare: 'https://min-api.cryptocompare.com/data/v2',
  fear_greed: 'https://api.alternative.me/fng',
  btc_dominance: 'https://api.coinstats.app/public/v1/coins/bitcoin?skip=0',
  
  // Real-time price websocket stubs
  binance_ws: 'wss://stream.binance.com:9443/stream',
};

// ── Payment Configuration ───────────────────────────────────────────
export const PAYMENT = {
  telegram_contact: 'https://t.me/asterix_support1',
  crypto_address: 'TMHx2jrrKpoHiGtZmMogM9N1sqK2XJg7Wa',
  premium_price: 12.99,
  premium_currency: 'USD',
  bank: null,  // Fetched live from /api/bank-details
};

// ── Auth ────────────────────────────────────────────────────────────
export const AUTH = {
  google_client_id: '688135725461-su1l15k9biemu8ki48apbth1gd6vhh9m.apps.googleusercontent.com',
  // Supabase (placeholder — wire up when Supabase project is created)
  supabase_url: '',
  supabase_anon_key: '',
};

// ── Partner Exchanges ───────────────────────────────────────────────
export const PARTNERS = [
  {
    key: 'bybit',
    name: 'ByBit',
    desc: 'Up to $30,000 welcome bonus for new users',
    cta: 'Join ByBit →',
    url: 'https://www.bybit.com/invite?ref=VPGWE1P',
    logo: 'assets/logos/bybit.png',
  },
  {
    key: 'kucoin',
    name: 'KuCoin',
    desc: '10% lifetime fee discount via our link',
    cta: 'Join KuCoin →',
    url: 'https://www.kucoin.com/r/rf/CXEJAXK2',
    logo: 'assets/logos/kucoin.png',
  },
  {
    key: 'exness',
    name: 'Exness',
    desc: '$10,000 virtual funds to learn trading',
    cta: 'Join Exness →',
    url: 'https://one.exnessonelink.com/a/j1fsvi6ixw?source=app&platform=mobile&pid=mobile_share',
    logo: 'assets/logos/exness.svg',
  },
  {
    key: 'binance',
    name: 'Binance',
    desc: 'World\'s largest crypto exchange',
    cta: 'Trade on Binance →',
    url: 'https://www.binance.com/en/register?ref=H4GJ4NKG',
    logo: 'assets/logos/binance.svg',
  },
];

// ── Signal Bots ─────────────────────────────────────────────────────
export const SIGNAL_BOTS = [
  { name: 'Crypto Signals Bot', handle: '@gwp_crypto_bot', url: 'https://t.me/gwp_crypto_bot', bg: '#fef3c7', emoji: '\u{1F7E1}', pairs: 'BTC · SOL · UNI · COMP · LINK · DEXE', bot_key: 'crypto' },
  { name: 'Forex Signals Bot', handle: '@gwp_forex_bot', url: 'https://t.me/gwp_forex_bot', bg: '#fdf0ee', emoji: '\u{1F534}', pairs: 'XAU/USD · EUR/USD · GBP/USD · OIL', bot_key: 'forex' },
  { name: 'Stocks Signals Bot', handle: '@gwp_stocks_bot', url: 'https://t.me/gwp_stocks_bot', bg: '#eff6ff', emoji: '\u{1F535}', pairs: 'TSLA · NVDA · MSTR · PLTR · AMD', bot_key: 'stocks' },
];

// ── CoinGecko IDs ────────────────────────────────────────────────────
export const COINGECKO_IDS = 'bitcoin,ethereum,solana,avalanche-2,uniswap,decentralized-social,chainlink,near,aave,arbitrum,injective-protocol,polkadot,filecoin,sui,cosmos,tether';

export const TICKER_LABELS = {
  bitcoin:'BTC',ethereum:'ETH',solana:'SOL','avalanche-2':'AVAX',
  uniswap:'UNI','decentralized-social':'DEXE',chainlink:'LINK',
  near:'NEAR',aave:'AAVE',arbitrum:'ARB','injective-protocol':'INJ',
  polkadot:'DOT',filecoin:'FIL',sui:'SUI',cosmos:'ATOM',
};

// ── Intervals ───────────────────────────────────────────────────────
export const INTERVALS = {
  signal_fetch: 60_000,      // refetch signals every 60s
  ticker_fetch: 60_000,      // refetch prices every 60s
  fundamentals: 300_000,    // refetch fear & greed every 5 min
  news_fetch: 300_000,      // refetch news every 5 min
  sw_check: 3_600_000,      // check SW update every hour
};

// ── Pages ────────────────────────────────────────────────────────────
export const MAIN_PAGES = ['home', 'signals', 'news', 'academy', 'more'];
export const SUB_PAGES = ['analytics', 'notifications', 'referral', 'performance', 'about', 'privacy'];

// ── Icons ────────────────────────────────────────────────────────────
export { ICONS };

// ── Misc ─────────────────────────────────────────────────────────────
export const APP_VERSION = '4.0.0';
export const APP_NAME = 'AxTrader';
export const APP_TAGLINE = 'Ghost Wick Protocol\u{2122} · Institutional Precision Trading Signals';
export const SUPPORT_EMAIL = 'asterixcomltd@gmail.com';
export const TELEGRAM_SUPPORT = 'https://t.me/asterix_support1';
export const TELEGRAM_COMMUNITY = 'https://t.me/asterix_trading_signal_hub';
export const TWITTER = 'https://twitter.com/Asterix_Abdin';
