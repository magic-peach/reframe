// public/sw.js

const CACHE_NAME = 'ffmpeg-wasm-v1';

// The exact CDN URLs used by the app (match what's in your ffmpeg loader)
const FFMPEG_URLS = [
  'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/umd/ffmpeg-core.js',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/umd/ffmpeg-core.wasm',
];

// ── INSTALL: pre-cache the FFmpeg assets ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching FFmpeg WASM assets');
      return cache.addAll(FFMPEG_URLS);
    })
  );
  // Take over immediately without waiting for old SW to retire
  self.skipWaiting();
});

// ── ACTIVATE: delete old caches when version changes ─────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  // Claim all clients so the SW is active immediately
  self.clients.claim();
});

// ── FETCH: cache-first for FFmpeg URLs, network-first for everything else ─────
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  const isFFmpegAsset = FFMPEG_URLS.some((ffmpegUrl) => url.startsWith(ffmpegUrl));

  if (isFFmpegAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          console.log('[SW] Serving from cache:', url);
          return cached;
        }
        console.log('[SW] Fetching and caching:', url);
        const response = await fetch(event.request);
        // Only cache valid responses
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      })
    );
  }
  // All other requests: fall through to the network normally
});