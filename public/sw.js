const IS_DEV = new URL(self.location.href).searchParams.get("dev") === "1";
// Bump these names to throw away old caches on the next visit.
const STATIC_CACHE = "nnp-static-v2";
const PAGES_CACHE = "nnp-pages-v2";
const APP_SHELL = ["/", "/manifest.webmanifest"];

// Files whose URL changes whenever their content changes (hashed or versioned),
// so a cached copy is always correct: app code, the editor, the dictionary.
function isImmutableAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/monaco/") ||
    pathname.startsWith("/dictionaries/")
  );
}

self.addEventListener("install", (event) => {
  if (IS_DEV) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = [STATIC_CACHE, PAGES_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// The page sends the files it loaded before this worker took control (the
// first visit), so the editor is available offline from the second visit on.
self.addEventListener("message", (event) => {
  if (IS_DEV || event.data?.type !== "cache-assets" || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter((u) => {
    try {
      const url = new URL(u);
      return url.origin === self.location.origin && isImmutableAsset(url.pathname);
    } catch {
      return false;
    }
  });
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      for (const url of urls) {
        if (await cache.match(url)) continue;
        try {
          const response = await fetch(url);
          if (response.ok) await cache.put(url, response);
        } catch {
          // Offline or gone; it will be cached the next time it loads.
        }
      }
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (IS_DEV) return;

  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (isImmutableAsset(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/"))),
  );
});
