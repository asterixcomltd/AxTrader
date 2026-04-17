// AxTrader SPA Router — hash-based
// Pages: home, signals, news, academy, more (main nav)
//        analytics, notifications, referral, performance, about, privacy (sub-pages)

const MAIN_PAGES = ['home', 'signals', 'news', 'academy', 'more'];
const SUB_PAGES = ['analytics', 'notifications', 'referral', 'performance', 'about', 'privacy'];
const ALL_PAGES = [...MAIN_PAGES, ...SUB_PAGES];

let currentPage = 'home';
let historyStack = ['home'];
let listeners = [];

/**
 * Navigate to a page by hash.
 */
export function navigate(page, skipHistory = false) {
  if (!ALL_PAGES.includes(page)) page = 'home';
  if (currentPage === page && !skipHistory) return;

  const prevPage = currentPage;
  currentPage = page;

  if (!skipHistory) {
    historyStack.push(page);
    window.location.hash = page === 'home' ? '' : `#${page}`;
  }

  // Toggle page visibility
  _showPage(page);

  // Update nav active state
  _updateNav(page);

  // Notify listeners
  listeners.forEach(cb => {
    try { cb(page, prevPage); } catch {}
  });
}

/**
 * Initialize router on DOM ready.
 */
export function initRouter() {
  // Handle initial hash
  const hash = window.location.hash.replace('#', '');
  const page = hash && ALL_PAGES.includes(hash) ? hash : 'home';
  currentPage = page;
  _showPage(page);
  _updateNav(page);

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.replace('#', '');
    const newPage = newHash && ALL_PAGES.includes(newHash) ? newHash : 'home';
    if (newPage !== currentPage) {
      const prev = currentPage;
      currentPage = newPage;

      // Check if going back
      if (historyStack.length > 1 && historyStack[historyStack.length - 2] === newPage) {
        historyStack.pop();
      } else {
        historyStack.push(newPage);
      }

      _showPage(newPage);
      _updateNav(newPage);
      listeners.forEach(cb => { try { cb(newPage, prev); } catch {} });
    }
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '');
    const page = hash && ALL_PAGES.includes(hash) ? hash : 'home';
    if (page !== currentPage) {
      const prev = currentPage;
      currentPage = page;
      _showPage(page);
      _updateNav(page);
      listeners.forEach(cb => { try { cb(page, prev); } catch {} });
    }
  });
}

/**
 * Go back to previous page.
 */
export function goBack() {
  if (historyStack.length > 1) {
    historyStack.pop();
    const prevPage = historyStack[historyStack.length - 1];
    navigate(prevPage, true);
    history.go(-1);
  } else {
    navigate('home');
  }
}

/**
 * Subscribe to route changes.
 */
export function onNavigate(cb) {
  listeners.push(cb);
}

export function getCurrentPage() {
  return currentPage;
}

// ── Internal helpers ──────────────────────────────────────────────────

function _showPage(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(el => {
    el.classList.remove('active');
  });

  // Show target page
  let targetId;
  if (MAIN_PAGES.includes(page)) {
    targetId = `page-${page}`;
  } else {
    targetId = `${page}-page`;
  }

  const target = document.getElementById(targetId);
  if (target) {
    target.classList.add('active');
  }
}

function _updateNav(page) {
  // Determine the main nav item to highlight
  let navKey = page;
  if (!MAIN_PAGES.includes(page)) {
    // Sub-pages — find parent
    if (page === 'analytics' || page === 'notifications') navKey = 'more';
    else if (page === 'referral') navKey = 'more';
    else if (page === 'performance' || page === 'about' || page === 'privacy') navKey = 'more';
    else navKey = 'more';
  }

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
  });

  const navEl = document.getElementById(`nav-${navKey}`);
  if (navEl) navEl.classList.add('active');
}
