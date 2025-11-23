// Service Worker for BASURAYT PWA
const CACHE_NAME = 'basurayt-cache-v1';

// List of core files to precache
const urlsToCache = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',

  // BASURAYT icons
  'icons/basurayt-192.png',
  'icons/basurayt-512.png',
  'icons/maskable-basurayt.png',

  // Optional external assets
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// --- 1. Installation: Precaching ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching:', urlsToCache);
      return cache.addAll(urlsToCache).catch((err) => {
        console.error('[Service Worker] Cache error:', err);
      });
    })
  );
});

// --- 2. Activation: Cleanup old caches ---
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// --- 3. Fetch: Cache-first with network fallback ---
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const clonedResponse = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[Service Worker] Fetch failed:', err);
        });
    })
  );
});
