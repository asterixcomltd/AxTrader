// AxTrader App Bootstrap
// Entry point for the modular application — initializes all subsystems

import { store } from './store.js';
import { initRouter, navigate } from './router.js';
import { initLang, setLang, t, translatePage, onLangChange } from './i18n.js';
import {
  initAuth, attachAuthListeners, attachProfileListeners,
  attachModalListeners, loginUser, doLogout
} from './auth/auth-flow.js';
import { initSignals, renderSignals, renderHomePreview, fetchSignals } from './features/signals.js';
import { initTicker, fetchPrices } from './features/market.js';
import { initAcademy, renderCourses } from './features/academy.js';
import { initPayments, attachPaymentListeners } from './features/payment.js';
import { initReferral } from './features/referral.js';
import { initWebSocket } from './features/websocket.js';
import { showToast } from './utils/dom.js';
import { APP_VERSION, APP_NAME, INTERVALS } from './config.js';

// ── Boot sequence ─────────────────────────────────────────────────────

export function boot() {
  console.log(`[${APP_NAME} v${APP_VERSION}] Booting...`);

  // 1. Initialize language (reads localStorage)
  initLang();

  // 2. Restore session from localStorage (if user was already logged in)
  restoreSession();

  // 3. Initialize router (reads hash, shows correct page)
  initRouter();

  // 4. Initialize feature modules (they set up their own DOM bindings)
  initSignals();
  initTicker();
  initAcademy();
  initPayments();
  initReferral();

  // 5. Attach global event listeners
  attachAuthListeners();
  attachProfileListeners();
  attachModalListeners();

  // 6. Attach nav delegation (bottom nav buttons)
  attachNavDelegation();

  // 7. Initialize WebSocket stub
  initWebSocket();

  // 8. Set up periodic data fetching
  setupIntervals();

  // 9. Language change observers
  onLangChange(() => {
    translatePage();
    // Re-render dynamic content after language switch
    renderSignals();
    renderCourses();
    renderHomePreview();
  });

  // 10. Apply initial translations
  translatePage();

  // 11. Show app, hide auth screen (if logged in)
  if (store.get('user')) {
    showApp();
  }

  console.log(`[${APP_NAME} v${APP_VERSION}] Ready.`);
}

// ── Session restore ───────────────────────────────────────────────────

function restoreSession() {
  try {
    const saved = localStorage.getItem('ax_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user?.name) {
        loginUser(user);
      }
    }
  } catch {
    localStorage.removeItem('ax_user');
  }
}

// ── Intervals ─────────────────────────────────────────────────────────

function setupIntervals() {
  // Signals auto-refresh
  setInterval(async () => {
    if (!document.hidden) {
      await fetchSignals();
    }
  }, INTERVALS.signal_fetch);

  // Prices auto-refresh
  setInterval(async () => {
    if (!document.hidden) {
      await fetchPrices();
    }
  }, INTERVALS.ticker_fetch);
}

// ── Nav delegation ────────────────────────────────────────────────────

function attachNavDelegation() {
  document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (!navItem) return;

    const id = navItem.id;
    if (!id) return;

    // Extract page from nav-* id
    const page = id.replace('nav-', '');
    if (page) {
      e.preventDefault();
      navigate(page);
    }
  });
}

// ── Show/Hide app ─────────────────────────────────────────────────────

export function showApp() {
  const authScreen = document.getElementById('auth-screen');
  const app = document.getElementById('app');
  if (authScreen) authScreen.style.display = 'none';
  if (app) app.style.display = 'flex';
}

export function showAuth() {
  const authScreen = document.getElementById('auth-screen');
  const app = document.getElementById('app');
  if (authScreen) authScreen.style.display = 'flex';
  if (app) app.style.display = 'none';
}

// ── Global API (for inline onclick handlers in HTML) ──────────────────

// Expose commonly needed functions to window for compatibility
// with existing onclick handlers in the HTML shell
window.navTo = navigate;
window.doLogout = doLogout;
window.setLang = setLang;
window.t = t;
window.showToast = showToast;
window.store = store;
window.showApp = showApp;
window.boot = boot;
