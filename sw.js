// CommissionPro service worker — network-first so the app always updates.
const CACHE = 'commissionpro-v72';
const ASSETS = ['./', './index.html', './app.html', './manifest.json', './icon-192.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pages -> network first (always newest). Other assets -> cache first.
// Only cache successful responses, so a 404/error can never get stuck.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const accept = req.headers.get('accept') || '';
  const isPage = req.mode === 'navigate' || accept.includes('text/html');

  if (isPage) {
    e.respondWith(
      fetch(req, {cache:'no-store'})
        .then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./app.html').then((a) => a || caches.match('./index.html'))))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((res) => {
      if (res && res.ok && new URL(req.url).origin === self.location.origin) {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => r))
  );
});
