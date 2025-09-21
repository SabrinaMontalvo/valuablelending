// service-worker.js
// Bump this version any time you change HTML/JS/CSS/assets
const CACHE_NAME = 'valuable-cache-v13';

const ASSETS = [
  '/',                     // root
  '/index.html',           // main app
  '/terms.html',
  '/privacy.html',
  '/accessibility.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',   // keep if you have it; otherwise remove this line
  '/icons/logo-vc.png'
];

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - HTML navigations: network-first (so new code shows quickly), fallback to cache
// - Other requests: cache-first, then network, and cache the fresh copy
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Handle navigations (page loads)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('/index.html')))
    );
    return;
  }

  // Everything else (icons, JS, CSS, images)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
