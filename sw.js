// AxTrader — GWP Signal App
// Service Worker v3.0 — Institutional cleanup

const CACHE_VERSION = '3.0';
const CACHE_NAME = `axtrader-v${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
  '/assets/logos/binance.svg',
  '/assets/logos/bybit.svg',
  '/assets/logos/kucoin.svg',
  '/assets/logos/exness.svg',
];

// Install: cache static assets only (NOT index.html — keep it network-first)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(SHELL_ASSETS).catch(err => {
        console.warn('[SW] Cache partial fail:', err);
      });
    })
  );
  // Take control immediately — no waiting
  self.skipWaiting();
});

// Activate: delete ALL old caches automatically
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // ALWAYS NETWORK-FIRST (bypass cache) for critical resources
  const alwaysNetwork = [
    'gist.githubusercontent.com',        // Signal data
    'api.coingecko.com',                 // Live prices
    'min-api.cryptocompare.com',        // Hot news
    'api.alternative.me',                // Fear & Greed
    'open.er-api.com',                   // Forex
    'cointelegraph.com',                 // News
    'newsapi.org',                       // General news
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'index.html',                        // Core app — ALWAYS FRESH
  ];

  if (alwaysNetwork.some(s => url.includes(s)) || event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(r => r)
        .catch(() => {
          // Fallback gracefully for offline
          if (event.request.mode === 'navigate') return caches.match('/index.html');
          return new Response('', { status: 503 });
        })
    );
    return;
  }

  // Navigation (page loads): NETWORK-FIRST with cache fallback
  // This ensures new deploys appear immediately
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache fresh version
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: return cached version
          return caches.match(event.request)
            .then(cached => cached || caches.match('/index.html'))
            .catch(() => new Response('Offline', { status: 503 }));
        })
    );
    return;
  }

  // Static assets (CSS, JS, images): cache-first for speed
  // But still check for updates in background
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
        }
        return response;
      });

      // Return cached immediately, but fetch fresh in background
      return cached || fetchPromise.catch(() => new Response('', { status: 503 }));
    })
  );
});

// ── Push notifications (for future VAPID backend integration) ────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let d = {};
  try { d = event.data.json(); } catch(e) {}
  event.waitUntil(
    self.registration.showNotification(d.title || 'AxTrader', {
      body   : d.body  || '',
      icon   : '/icon-192.png',
      badge  : '/favicon-32.png',
      tag    : d.tag   || 'axtrader-push',
      data   : d.data  || {}
    })
  );
});

// ── Notification click handler ──────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
