// AxTrader — GWP Signal App
// Service Worker v1.1 — Network-first for HTML so deploys auto-update

const CACHE_NAME = 'axtrader-v1.1';

const SHELL_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
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

  // Always network-first (no cache) for these:
  const alwaysNetwork = [
    'gist.githubusercontent.com',
    'api.coingecko.com',
    'min-api.cryptocompare.com',
    'api.alternative.me',
    'open.er-api.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'index.html',
  ];

  if (alwaysNetwork.some(s => url.includes(s)) || event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // Navigation (page loads): network-first so new deploys show immediately
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Update cache with fresh version
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => new Response('', { status: 503 }));
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
