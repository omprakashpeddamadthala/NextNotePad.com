// App-shell caching only — deliberately never touches /api/* requests. This app's cloud mode
// (signed in) needs live, correct server data; pretending that works offline without a real
// sync/conflict-resolution layer (not built yet) would risk silently editing stale content.
// Guest mode already stores everything in localStorage/IndexedDB and needs no network at all,
// so caching just the shell (HTML/JS/CSS/icons) is enough to make guest mode fully offline-capable.
//
// `?dev=1` (see ServiceWorkerRegistration.tsx) marks a dev-server registration: Chrome requires
// an active service worker with a fetch handler before it'll ever fire `beforeinstallprompt`
// (which is what the "Install App" button needs), but actually caching anything here would fight
// Next.js's own Fast Refresh and serve stale code after edits. So in dev we still register and
// activate — satisfying the installability check — but every fetch is a deliberate no-op.
const IS_DEV = new URL(self.location.href).searchParams.get("dev") === "1";
const CACHE_NAME = "notepad-web-shell-v1";
const APP_SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  if (IS_DEV) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (IS_DEV) return; // let the browser handle every request exactly as if no SW existed

  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Next.js's hashed build assets never change content under the same URL — cache-first is safe
  // and skips the network entirely on repeat visits.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Navigations and everything else in the shell: prefer the network (freshest), fall back to
  // the cache when offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/"))),
  );
});
