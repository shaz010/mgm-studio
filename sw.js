// CommissionPro service worker — network-first so the app always updates.
const CACHE = 'commissionpro-v67';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png'];

// Install: pre-cache the shell, take over immediately.
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {}))
  );
});

// Activate: delete every old cache, then control all open pages.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch:
//  - Page/HTML loads -> NETWORK FIRST (always newest app); fall back to cache only when offline.
//  - Everything else  -> cache first (fast), fall back to network.
// We ONLY ever cache successful (res.ok) responses, so a 404 or error
// can never get "stuck" in the cache and serve a broken/old app.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const accept = req.headers.get('accept') || '';
  const isPage = req.mode === 'navigate' || accept.includes('text/html');

  if (isPage) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((res) => {
      if (res && res.ok && new URL(req.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => r))
  );
});
