// Service Worker for Connect 4 PWA
const CACHE_NAME = 'connect4-v2';
const PRECACHE_ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'css/index.css',
  'js/hmi.js',
  'js/board.js',
  'js/common.js',
  'js/controller.js',
  'js/renderer.js',
  'js/store.js',
  'js/uct/uct.js',
  'img/icons/favicon.ico',
  'img/icons/connect4128.png',
  'img/icons/icon-bars.svg',
  'img/oliver_signal_colors_66.jpg'
];

const INDEX_URL = new URL('index.html', self.registration.scope).toString();

const isCacheableResponse = (response) => {
  return response && response.ok && response.type !== 'error';
};

const normalizeManifestAssetPath = (value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  const scoped = new URL(value, self.registration.scope);
  if (scoped.origin !== self.location.origin) {
    return null;
  }
  return `${scoped.pathname}${scoped.search}`;
};

const getManifestAssetRequests = async () => {
  try {
    const response = await fetch('manifest.json', { cache: 'no-store' });
    if (!isCacheableResponse(response)) {
      return [];
    }

    const manifest = await response.json();
    const iconSources = Array.isArray(manifest.icons)
      ? manifest.icons.map((icon) => icon?.src)
      : [];
    const screenshotSources = Array.isArray(manifest.screenshots)
      ? manifest.screenshots.map((shot) => shot?.src)
      : [];
    const shortcutIconSources = Array.isArray(manifest.shortcuts)
      ? manifest.shortcuts.flatMap((shortcut) => (shortcut?.icons ?? []).map((icon) => icon?.src))
      : [];

    const manifestAssets = [...iconSources, ...screenshotSources, ...shortcutIconSources]
      .map(normalizeManifestAssetPath)
      .filter((path) => Boolean(path));

    return [...new Set(manifestAssets)].map((asset) => new Request(asset, { cache: 'reload' }));
  } catch {
    return [];
  }
};

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const shellRequests = PRECACHE_ASSETS.map((asset) => new Request(asset, { cache: 'reload' }));
    await cache.addAll(shellRequests);

    // Manifest media is additive and should not block app-shell installation.
    const manifestRequests = await getManifestAssetRequests();
    if (manifestRequests.length > 0) {
      await Promise.allSettled(
        manifestRequests.map(async (request) => {
          const response = await fetch(request);
          if (isCacheableResponse(response)) {
            await cache.put(request, response);
          }
        })
      );
    }

    await self.skipWaiting();
  })());
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName))
    );
    await self.clients.claim();
  })());
});

// Fetch event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(event.request.url);
  const isSameOrigin = requestURL.origin === self.location.origin;

  // Use network-first for navigations to keep HTML fresh, fallback to cached shell offline.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(event.request);
        if (isCacheableResponse(networkResponse)) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch {
        const cachedPage = await caches.match(event.request);
        if (cachedPage) {
          return cachedPage;
        }
        return caches.match(INDEX_URL);
      }
    })());
    return;
  }

  // Cache-first strategy for same-origin assets.
  if (!isSameOrigin) {
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) {
      return cached;
    }

    const networkResponse = await fetch(event.request);
    if (isCacheableResponse(networkResponse)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, networkResponse.clone());
    }
    return networkResponse;
  })());
});
