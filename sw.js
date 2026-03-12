const CACHE = 'princesslia-v1';
const ASSETS = [
  '/princesslia/',
  '/princesslia/index.html',
  '/princesslia/app.js',
  '/princesslia/manifest.json',
  '/princesslia/icon-192.png',
  '/princesslia/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co')) return;
  if (e.request.url.includes('jsdelivr.net')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
