const CACHE_NAME = "reframe-pwa-cache-v1";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
  "/sounds/export-complete.mp3",
  "/screenshots/desktop.png",
  "/screenshots/mobile.png"
];

// Install Event: cache static shell assets resiliently
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Fetch each asset individually to prevent any 404 error (e.g. dev-mode missing files)
      // from blocking the entire service worker installation.
      const cachePromises = PRECACHE_ASSETS.map((asset) => {
        return fetch(asset)
          .then((response) => {
            if (response.ok) {
              return cache.put(asset, response);
            }
          })
          .catch((err) => {
            console.warn(`[SW Install] Skip precaching ${asset} due to:`, err);
          });
      });
      return Promise.all(cachePromises);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: apply custom caching strategies
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isHtml = request.mode === "navigate" || url.pathname.endsWith(".html") || !url.pathname.includes(".");

  if (isHtml) {
    // Network-First strategy for HTML navigations
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Safer static fallback supporting both / and /index.html structures
            return caches.match("/").then((res1) => res1 || caches.match("/index.html"));
          });
        })
    );
  } else {
    // Cache-First strategy for assets (WASM, JS, CSS, Media)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          const isCacheable = response.status === 200 || response.status === 0;
          
          // Explicitly check for Next.js chunks, CDN resources, and static assets
          const isNextAsset = url.pathname.startsWith("/_next/") || 
                              url.pathname.endsWith(".js") || 
                              url.pathname.endsWith(".mjs") || 
                              url.pathname.endsWith(".css");
                              
          const shouldCache = isCacheable && (
            url.origin === self.location.origin ||
            isNextAsset ||
            url.hostname.includes("jsdelivr.net")
          );

          if (shouldCache) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});
