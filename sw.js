// Your Salon service worker — network-first, self-healing.
// Bumping CACHE forces old caches to be wiped on activate, so a stale worker can't get stuck.
const CACHE = 'yoursalon-v75';
const ASSETS = ['./', './salon.html', './app.html', './appt.html', './index.html',
  './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

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

// Let the app tell a waiting worker to take over immediately.
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Never touch cross-origin requests (Firebase, Firestore, gstatic, CDNs) — let them go straight to network.
  // This keeps cloud sync / auth reliable and out of the cache.
  if (url.origin !== self.location.origin) return;

  const accept = req.headers.get('accept') || '';
  const isPage = req.mode === 'navigate' || accept.includes('text/html');

  if (isPage) {
    // Pages: network-first (always newest). Cache only clean, non-redirected 200s.
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) =>
            (r && !r.redirected) ? r
              : caches.match('./salon.html').then((s) => s || caches.match('./app.html'))
          )
        )
    );
    return;
  }

  // Other same-origin assets: cache-first, fall back to network (and cache clean 200s).
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((res) => {
      if (res && res.ok && !res.redirected) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => r))
  );
});
