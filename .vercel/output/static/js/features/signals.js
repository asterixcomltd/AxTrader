// AxTrader Signals Feature Module
// Fetches signals from GitHub Gist, renders cards, handles filtering

import { store } from '../store.js';
import { apiFetch } from '../utils/api.js';
import { setHTML, showToast } from '../utils/dom.js';
import { relativeTime, expiryTime, calcExpiry } from '../utils/formatDate.js';
import { icon, ICONS } from '../utils/icons.js';
import { GIST_USER, GIST_ID, SIGNAL_BOTS } from '../config.js';

const SIGNALS_LIST = 'signals-list';
const HOME_PREVIEW = 'home-signals-preview';
const ARCHIVE_LIST = 'archive-list';
const ARCHIVE_WIN_RATE = 'arch-win-rate';
const ARCHIVE_AVG_RR = 'arch-avg-rr';
const ARCHIVE_TOTAL = 'arch-total';

export function initSignals() {
  attachSignalsListeners();
  // Initial fetch
  fetchSignals();
}

export async function fetchSignals() {
  store.setPartial({ loading: { ...store.get('loading'), signals: true } });
  try {
    const t = Date.now();
    const base = `https://gist.githubusercontent.com/${GIST_USER}/${GIST_ID}/raw`;

    const [cryptoRes, forexRes, stocksRes] = await Promise.allSettled([
      fetch(`${base}/crypto_signals.json?t=${t}`),
      fetch(`${base}/forex_signals.json?t=${t}`),
      fetch(`${base}/stocks_signals.json?t=${t}`),
    ]);

    const parseRes = (res) => {
      if (res.status === 'fulfilled' && res.value.ok) {
        try { return JSON.parse(res.value.text ? res.value : ''); } catch { return []; }
      }
      return [];
    };

    // Since we have the full Response objects, we need to parse text then JSON
    const crypto = await parseJsonResponse(cryptoRes);
    const forex = await parseJsonResponse(forexRes);
    const stocks = await parseJsonResponse(stocksRes);

    [crypto, forex, stocks].forEach((arr, i) => {
      const bot = SIGNAL_BOTS[i].bot_key;
      arr.forEach(s => { if (!s.bot) s.bot = bot; });
    });

    const merged = [...crypto, ...forex, ...stocks]
      .filter(s => s && (s.pair || s.symbol))
      .map(s => { if (!s.pair && s.symbol) s.pair = s.symbol; return s; })
      .filter(s => {
        const base = s.ts || s.timestamp;
        if (!base) return true;
        const tf = (s.tf || s.timeframe || '4H').toUpperCase();
        const addMs = tf === '1H' ? 4 * 3600000 : tf === '1D' ? 78 * 3600000 : 16 * 3600000;
        return Date.now() < (s.expiresAt || base + addMs);
      })
      .sort((a, b) => (b.ts || b.timestamp || 0) - (a.ts || a.timestamp || 0))
      .slice(0, 30);

    if (!merged.length) {
      renderFallback();
      return;
    }

    signalsData = buildSignalsArray(merged);

    // Archive
    signalsData.filter(s => s.ts).forEach(s => store.addSignalToArchive(s));

    // Update last update time
    const el = document.getElementById('signal-last-update');
    if (el) {
      const now = new Date();
      el.textContent = 'Updated ' + now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }

    setSignalSourceBadge(true, signalsData.length);
    renderSignals();
    renderHomePreview();
  } catch {
    renderFallback();
  }
  store.setPartial({ loading: { ...store.get('loading'), signals: false } });
}

async function parseJsonResponse(result) {
  if (result.status === 'fulfilled' && result.value.ok) {
    try { return await result.value.json(); } catch { return []; }
  }
  return [];
}

function buildSignalsArray(merged) {
  const normalize = (s, isPremium) => {
    let rawScore = s.score || s.conviction || 80;
    let normScore;
    if (rawScore <= 10) normScore = Math.round(rawScore * 12.5);
    else if (rawScore <= 105) normScore = Math.round(rawScore / 105 * 100);
    else normScore = Math.min(rawScore, 100);

    const base = s.ts || s.timestamp;
    let expiresAt = null;
    if (base) {
      const tf = (s.tf || s.timeframe || '4H').toUpperCase();
      expiresAt = calcExpiry(base, tf);
    }

    return {
      pair: s.pair || s.symbol || 'BTC/USDT',
      dir: (s.dir || s.direction || 'LONG').toUpperCase(),
      entry: s.entry || s.entryPrice || '0',
      sl: s.sl || s.stopLoss || '0',
      tp: s.tp2 || s.tp || s.tp1 || '0',
      tp1: s.tp1 || s.tp || '0',
      tp2: s.tp2 || s.tp || '0',
      tp3: s.tp3 || s.tp || '0',
      score: normScore,
      tf: s.tf || s.timeframe || '4H',
      grade: s.grade || '',
      conviction: s.conviction || '',
      rr: s.rr || '',
      bot: s.bot || '',
      time: s.time || '--:--',
      premium: isPremium,
      ts: base || null,
      expiresAt,
      structure: s.structure || '',
      event: s.event || '',
      reasons: s.reasons || [],
      hasOB: s.hasOB || false,
      hasFVG: s.hasFVG || false,
      hasSweep: s.hasSweep || false,
      htfBias: s.htfBias || 0,
      confirmations: s.confirmations || 0,
      inKillZone: s.inKillZone || false,
    };
  };

  const cryptoPool = merged.filter(s => s.bot === 'crypto');
  const forexPool = merged.filter(s => s.bot === 'forex');
  const stocksPool = merged.filter(s => s.bot === 'stocks');

  const pickBest = pool => {
    if (!pool.length) return null;
    return pool.slice(0, 5).reduce((b, s) => ((s.score || s.conviction || 0) > (b.score || b.conviction || 0) ? s : b), pool[0]);
  };
  const pickSecond = (pool, first) => {
    const rem = pool.filter(s => s !== first);
    return pickBest(rem);
  };

  const topC = pickBest(cryptoPool);
  const topF = pickBest(forexPool);
  const topS = pickBest(stocksPool);
  const top2C = pickSecond(cryptoPool, topC);
  const top2F = pickSecond(forexPool, topF);
  const top2S = pickSecond(stocksPool, topS);

  const ordered = [topC, topF, topS, top2C, top2F, top2S].filter(Boolean);
  return ordered.slice(0, 6).map((s, i) => normalize(s, i >= 3));
}

function renderFallback() {
  const signals = [];
  setSignalSourceBadge(false, 0);
  renderSignalCards(signals, SIGNALS_LIST);
  renderSignalCards(signals.slice(0, 2), HOME_PREVIEW);
  const el = document.getElementById('signal-last-update');
  if (el) el.textContent = 'Waiting for bot signal...';
}

function setSignalSourceBadge(isLive, count) {
  const badge = document.getElementById('sig-live-badge');
  if (!badge) return;
  if (isLive) {
    badge.className = 'live-source-badge live';
    badge.innerHTML = `<span class="live-pulse"></span>Active — ${count} signal${count !== 1 ? 's' : ''}`;
  } else {
    badge.className = 'live-source-badge demo';
    badge.innerHTML = `Waiting for bot signal...`;
  }
  const nb = document.getElementById('signals-nav-badge');
  if (nb && isLive && count > 0) { nb.textContent = count; nb.classList.add('show'); }
  else if (nb) nb.classList.remove('show');
}

export function renderSignals() {
  const filtered = store.get('signals').filter(s => !s.expiresAt || Date.now() < s.expiresAt);
  renderSignalCards(filtered, SIGNALS_LIST);
}

export function renderHomePreview() {
  const signals = store.get('signals').filter(s => !s.premium);
  renderSignalCards(signals.slice(0, 2), HOME_PREVIEW);
}

function renderSignalCards(signals, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!signals.length) {
    container.innerHTML = `
      <div class="skeleton-card">
        <div class="skeleton-row">
          <div class="skeleton rounded-full skeleton-line"></div>
          <div class="skeleton-line rounded-full" style="width:70px;height:24px;margin-left:auto"></div>
        </div>
        <div class="skeleton-line thick w-60"></div>
        <div class="skeleton-grid-3">
          <div class="skeleton-line" style="height:40px;"></div>
          <div class="skeleton-line" style="height:40px;"></div>
          <div class="skeleton-line" style="height:40px;"></div>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = signals.map((s, i) => buildSignalCard(s, i)).join('');
}

function buildSignalCard(s, index) {
  const cat = getCatInfo(s.bot);
  const grade = getGrade(s.score, s.grade);
  const age = s.ts ? relativeTime(s.ts) : s.time || '--:--';
  const expiry = s.expiresAt ? expiryTime(s.expiresAt) : '';

  const isPremium = s.premium;
  const isLocked = isPremium && !store.get('isPremium');

  if (isLocked) {
    return `
      <div class="signal-card premium-locked">
        <div class="prem-lock-overlay">
          <div class="prem-lock-icon">${ICONS.lock}</div>
          <div class="prem-lock-label">Premium Signal</div>
          <div class="prem-lock-sub">Unlock to view entry, SL & TP levels</div>
          <button class="prem-lock-btn" onclick="window.openUpgrade && openUpgrade()">Unlock Premium</button>
        </div>
        <div class="sig-status-row">
          <span class="cat-pill ${cat.cls}">${cat.emoji} ${cat.label}</span>
        </div>
        <div class="sig-pair">${s.pair} <span class="grade-badge ${grade.cls}">${grade.g}</span></div>
      </div>`;
  }

  return `
    <div class="signal-card" data-signal-id="${s.ts || s.pair}">
      <div class="sig-status-row">
        <div style="display:flex;align-items:center;gap:6px">
          <span class="cat-pill ${cat.cls}">${cat.emoji} ${cat.label}</span>
          <span class="sig-badge ${s.dir === 'LONG' ? 'badge-long' : 'badge-short'}">${s.dir}</span>
        </div>
        ${s.expiresAt ? `<span class="sig-expiry ${Date.now() > s.expiresAt ? 'expired' : s.expiresAt - Date.now() < 3600000 ? 'expiring-soon' : ''}">${expiry}</span>` : ''}
      </div>
      <div class="sig-top" style="margin-bottom:8px">
        <div>
          <div class="sig-pair">${s.pair} <span class="grade-badge ${grade.cls}">${grade.g}</span></div>
          <span style="font-size:.72rem;color:var(--text3)">${s.tf}${s.rr ? ' · R:R ' + s.rr : ''}</span>
          <div class="sig-time-row">
            <span class="sig-fired-time" style="display:inline-flex;align-items:center;gap:4px">
              ${ICONS.clock} ${s.time && s.time !== '--:--' ? s.time + ' · ' : ''}${age}
            </span>
          </div>
        </div>
      </div>
      <div class="sig-row">
        <div class="sig-cell"><div class="sig-cell-label">Entry</div><div class="sig-cell-val">${s.entry}</div></div>
        <div class="sig-cell"><div class="sig-cell-label">Stop Loss</div><div class="sig-cell-val" style="color:var(--red)">${s.sl}</div></div>
        <div class="sig-cell"><div class="sig-cell-label">TP1</div><div class="sig-cell-val" style="color:var(--green)">${s.tp1 || s.tp}</div></div>
      </div>
      ${s.tp3 && s.tp3 !== s.tp ? `
      <div class="sig-row" style="margin-top:6px">
        <div class="sig-cell"><div class="sig-cell-label">TP2</div><div class="sig-cell-val" style="color:var(--green)">${s.tp2 || s.tp}</div></div>
        <div class="sig-cell"><div class="sig-cell-label">TP3</div><div class="sig-cell-val" style="color:var(--green)">${s.tp3}</div></div>
        <div class="sig-cell"><div class="sig-cell-label">Conviction</div><div class="sig-cell-val">${s.score}%</div></div>
      </div>` : ''}
      <div class="score-bar-wrap">
        <div class="score-bar-label">
          <span>Conviction</span><span>${s.score}%</span>
        </div>
        <div class="score-bar">
          <div class="score-fill" style="width:${s.score}%"></div>
        </div>
      </div>
      <div class="sig-bots">
        <a href="${cat.url}" target="_blank" class="bot-link" style="text-decoration:none">
          ${ICONS.externalLink} ${cat.handle}
        </a>
      </div>
      ${s.event ? `
      <div class="signal-why" style="margin-top:8px">
        <div class="why-header" style="font-weight:600;margin-bottom:4px">${s.event}</div>
        ${s.reasons && s.reasons.length ? s.reasons.map(r => `<div class="why-item" style="font-size:.75rem;color:var(--text2)">${r}</div>`).join('') : ''}
      </div>` : ''}
    </div>`;
}

function getCatInfo(bot) {
  if (bot === 'forex') return { label: 'Forex', cls: 'cat-forex', emoji: '', handle: 'gwp_forex_bot', url: 'https://t.me/gwp_forex_bot' };
  if (bot === 'stocks') return { label: 'Stocks', cls: 'cat-stocks', emoji: '', handle: 'gwp_stocks_bot', url: 'https://t.me/gwp_stocks_bot' };
  return { label: 'Crypto', cls: 'cat-crypto', emoji: '', handle: 'gwp_crypto_bot', url: 'https://t.me/gwp_crypto_bot' };
}

function getGrade(score, grade) {
  if (grade) {
    if (grade.includes('SUPREME') || grade.includes('ELITE')) return { g: 'A+', cls: 'grade-astar' };
    if (grade.startsWith('A+')) return { g: grade.split(' ')[0], cls: 'grade-aplus' };
    if (grade.startsWith('A')) return { g: grade.split(' ')[0], cls: 'grade-a' };
    return { g: grade.split(' ')[0], cls: 'grade-b' };
  }
  if (score >= 90) return { g: 'A+', cls: 'grade-astar' };
  if (score >= 80) return { g: 'A+', cls: 'grade-aplus' };
  if (score >= 70) return { g: 'A', cls: 'grade-a' };
  return { g: 'B+', cls: 'grade-b' };
}

async function renderArchiveSection() {
  const archived = store.get('archive');
  const list = document.getElementById(ARCHIVE_LIST);
  if (!list) return;

  if (!archived.length) {
    list.innerHTML = '<p style="text-align:center;color:var(--text3);padding:16px;font-size:.85rem">No archived signals yet. Check back after the next fetch.</p>';
    return;
  }

  list.innerHTML = archived.map(s => {
    const cat = getCatInfo(s.bot);
    const fired = s.ts ? new Date(s.ts).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    return `
      <div class="signal-card" style="margin-bottom:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span class="cat-pill ${cat.cls}">${cat.emoji} ${cat.label}</span>
          <span class="arch-outcome-${s.outcome.toLowerCase()}" style="font-size:.7rem;padding:2px 8px;border-radius:10px;font-weight:700">${s.outcome}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
          <div class="sig-pair">${s.pair}</div>
          <span class="sig-badge ${s.dir === 'LONG' ? 'badge-long' : 'badge-short'}" style="font-size:.68rem">${s.dir}</span>
          <span style="font-size:.7rem;color:var(--text3)">${s.tf}${s.rr ? ' · R:R ' + s.rr : ''}</span>
        </div>
        <div class="sig-row" style="margin-bottom:6px">
          <div class="sig-cell"><div class="sig-cell-label">Entry</div><div class="sig-cell-val">${s.entry}</div></div>
          <div class="sig-cell"><div class="sig-cell-label">SL</div><div class="sig-cell-val" style="color:var(--red)">${s.sl}</div></div>
          <div class="sig-cell"><div class="sig-cell-label">TP1</div><div class="sig-cell-val" style="color:var(--green)">${s.tp1}</div></div>
        </div>
        <div style="font-size:.7rem;color:var(--text3)">Fired: ${fired}</div>
      </div>`;
  }).join('');
}

function updateArchiveStats() {
  const archived = store.get('archive');
  const closed = archived.filter(s => s.outcome !== 'Active' && s.outcome !== 'Expired');
  const wins = closed.filter(s => s.outcome === 'TP1' || s.outcome === 'TP2' || s.outcome === 'TP3');
  const winRate = closed.length ? Math.round(wins.length / closed.length * 100) : null;
  const avgRR = archived.filter(s => s.rr).reduce((a, s) => a + parseFloat(s.rr || 0), 0) / (archived.filter(s => s.rr).length || 1);

  const wrEl = document.getElementById(ARCHIVE_WIN_RATE);
  const rrEl = document.getElementById(ARCHIVE_AVG_RR);
  const totEl = document.getElementById(ARCHIVE_TOTAL);
  if (wrEl) wrEl.textContent = winRate !== null ? winRate + '%' : '—';
  if (rrEl) rrEl.textContent = archived.length ? avgRR.toFixed(1) : '—';
  if (totEl) totEl.textContent = archived.length;
}

function attachSignalsListeners() {
  // Manual refresh button
  document.addEventListener('click', (e) => {
    if (e.target.closest('#refresh-btn') || e.target.closest('[data-action="refresh-signals"]')) {
      e.preventDefault();
      fetchSignals();
    }
    if (e.target.closest('#archive-toggle-btn')) {
      const list = document.getElementById(ARCHIVE_LIST);
      const btn = document.getElementById('archive-toggle-btn');
      if (list && btn) {
        const isHidden = list.style.display === 'none';
        list.style.display = isHidden ? 'block' : 'none';
        btn.textContent = isHidden ? 'Hide' : 'Show';
        if (isHidden) { renderArchiveSection(); updateArchiveStats(); }
      }
    }
  });
}

// Expose for onclick handlers
window.manualRefresh = () => fetchSignals();
window.toggleArchive = () => {
  const list = document.getElementById(ARCHIVE_LIST);
  const btn = document.getElementById('archive-toggle-btn');
  if (list && btn) {
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'block' : 'none';
    btn.textContent = isHidden ? 'Hide' : 'Show';
    if (isHidden) { renderArchiveSection(); updateArchiveStats(); }
  }
};
