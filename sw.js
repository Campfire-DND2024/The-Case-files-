/* The Case File: offline cache for the web version (not used inside the Android app).
   Bump VERSION whenever you upload new files so phones pick up the update. */
const VERSION = 'tcf-1.1.1';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'firebase.js', 'firebase-config.js', 'manifest.webmanifest', 'packs/index.json',
  'icon-192.png', 'icon-512.png', 'maskable-512.png', 'apple-touch-icon.png',
  'fonts/alegreya-sans-latin-400-normal.woff2', 'fonts/alegreya-sans-latin-500-normal.woff2',
  'fonts/alegreya-sans-latin-700-normal.woff2', 'fonts/special-elite-latin-400-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  /* network first, so updates arrive straight away; the cache covers you when offline */
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html'))));
});
