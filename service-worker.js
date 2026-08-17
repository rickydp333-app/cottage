const CACHE_NAME = "cottage-info-v32";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=31",
  "./app.js?v=32",
  "./data.js?v=31",
  "./manifest.webmanifest",
  "./assets/logo.jpg"
];
const APP_SHELL_SUFFIXES = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/data.js",
  "/manifest.webmanifest",
  "/assets/logo.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  const path = requestUrl.pathname.toLowerCase();
  const isAppShellRequest = APP_SHELL_SUFFIXES.some((suffix) => path === suffix || path.endsWith(suffix));

  if (path.endsWith("/data.private.js")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (!isAppShellRequest) {
    event.respondWith(
      fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return new Response("", { status: 504, statusText: "Gateway Timeout" });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (event.request.method === "GET" && event.request.url.startsWith(self.location.origin)) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
