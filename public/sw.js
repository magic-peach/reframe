const CACHE_NAME = 'reframe-ffmpeg-v1';
const CORE_ORIGIN = 'https://cdn.jsdelivr.net';
const CORE_PATH_SEGMENT = '/npm/@ffmpeg/core@';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Cache-first strategy for ffmpeg core assets and network-first for others
self.addEventListener('fetch', (event) => {
  try {
    const { request } = event;
    const url = new URL(request.url);

    // Only cache GET requests
    if (request.method !== 'GET') return;

    // If this request targets the ffmpeg core package on jsdelivr, use cache-first
    if (request.url.startsWith(CORE_ORIGIN) && request.url.includes(CORE_PATH_SEGMENT)) {
      event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const resp = await fetch(request);
          if (resp && resp.ok) {
            cache.put(request, resp.clone());
          }
          return resp;
        } catch (err) {
          // network failed, return cached if available or fallback to network error
          return cached || Response.error();
        }
      })());
      return;
    }

    // For other requests, default to network-first to keep pages fresh
    event.respondWith((async () => {
      try {
        const resp = await fetch(request);
        return resp;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        return cached || Response.error();
      }
    })());
  } catch (e) {
    // ignore
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
