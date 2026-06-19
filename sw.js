// CommissionPro service worker — network-first, bypasses Safari's cache so the app always updates.
const CACHE = 'commissionpro-v36';
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
//  - Page/HTML loads -> NETWORK FIRST with cache:'no-store' so Safari can't serve a stale build.
//    Always pulls the freshest index.html when online; falls back to cache only when offline.
//  - Everything else -> cache first (fast), fall back to network.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const accept = req.headers.get('accept') || '';
  const isPage = req.mode === 'navigate' || accept.includes('text/html');

  if (isPage) {
    e.respondWith(
      // fetch by URL with no-store == go past Safari's hidden HTTP cache, hit the real network.
      fetch(req.url, { cache: 'no-store' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
