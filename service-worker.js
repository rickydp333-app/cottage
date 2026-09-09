const CACHE_NAME = 'cottage-info-v36';
const APP_SHELL = ['/', '/index.html', '/styles.css?v=33', '/app.js?v=33', '/data.js?v=33', '/kiosk.js?v=2', '/kiosk.css?v=2', '/manifest.webmanifest', '/assets/logo.jpg', '/assets/icon-192.png', '/assets/icon-512.png', '/offline.html'];
const SHELL_URLS = new Set(APP_SHELL.map(path => new URL(path, self.location.origin).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('cottage-info-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Cache only the public main app shell, never private configuration or APIs.
  if (!SHELL_URLS.has(url.href)) {
    if (event.request.mode === 'navigate') event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => caches.match('/offline.html')));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type === 'basic' && !response.redirected) await cache.put(event.request, response.clone());
      return response;
    } catch {
      return await cache.match(event.request) || new Response('Offline', { status: 503 });
    }
  })());
});
