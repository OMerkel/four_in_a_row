// Service Worker for Connect 4 PWA
const CACHE_NAME = 'connect4-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/index.css',
  '/js/hmi.js',
  '/js/board.js',
  '/js/common.js',
  '/js/controller.js',
  '/js/renderer.js',
  '/js/store.js',
  '/js/uct/uct.js',
  '/img/icons/favicon.ico',
  '/img/icons/connect4128.png',
  '/img/icons/icon-bars.svg',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn('Cache addAll error:', error);
          // Continue even if some assets fail to cache
          return Promise.resolve();
        });
      })
      .catch((error) => {
        console.warn('Service Worker install error:', error);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Cache first, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback - try to return index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return null;
      })
  );
});
