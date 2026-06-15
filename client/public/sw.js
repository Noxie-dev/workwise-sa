const VERSION = '2026-06-15-1';
const PRECACHE = `workwise-precache-${VERSION}`;
const RUNTIME = `workwise-runtime-${VERSION}`;
const IMAGES = `workwise-images-${VERSION}`;
const API = `workwise-api-${VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/site.webmanifest',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/images/header-logo.png',
];

const MAX_RUNTIME_ITEMS = 80;
const MAX_IMAGE_ITEMS = 60;
const MAX_API_ITEMS = 40;

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  await Promise.all(keys.slice(0, keys.length - maxItems).map(key => cache.delete(key)));
}

async function cachePut(cacheName, request, response, maxItems) {
  if (!response || response.status !== 200) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  await trimCache(cacheName, maxItems);
}

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isApiRequest(request) {
  return isSameOrigin(request) && new URL(request.url).pathname.startsWith('/api/');
}

function acceptsHtml(request) {
  return request.headers.get('accept')?.includes('text/html');
}

function offlineJson() {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        type: 'offline',
        message: 'You are offline. Reconnect to refresh this data.',
      },
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok && acceptsHtml(request)) {
      await cachePut(PRECACHE, '/', response.clone(), MAX_RUNTIME_ITEMS);
    }
    return response;
  } catch {
    const cachedPage = await caches.match(request);
    return cachedPage || (await caches.match('/')) || (await caches.match('/offline.html'));
  }
}

async function handleApi(request) {
  const hasAuth = request.headers.has('authorization');

  try {
    const response = await fetch(request);
    if (!hasAuth && response.ok) {
      await cachePut(API, request, response.clone(), MAX_API_ITEMS);
    }
    return response;
  } catch {
    if (!hasAuth) {
      const cached = await caches.match(request);
      if (cached) return cached;
    }
    return offlineJson();
  }
}

async function handleStatic(request) {
  const cached = await caches.match(request);
  const fetchAndCache = fetch(request).then(response => {
    const destination = request.destination;
    if (response.ok && isSameOrigin(request)) {
      if (
        destination === 'image' ||
        /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname)
      ) {
        void cachePut(IMAGES, request, response.clone(), MAX_IMAGE_ITEMS);
      } else {
        void cachePut(RUNTIME, request, response.clone(), MAX_RUNTIME_ITEMS);
      }
    }
    return response;
  });

  return cached || fetchAndCache.catch(() => Response.error());
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(
              key => key.startsWith('workwise-') && ![PRECACHE, RUNTIME, IMAGES, API].includes(key)
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_RUNTIME_CACHES') {
    event.waitUntil(Promise.all([RUNTIME, IMAGES, API].map(cache => caches.delete(cache))));
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET' || !isSameOrigin(request)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isApiRequest(request)) {
    event.respondWith(handleApi(request));
    return;
  }

  event.respondWith(handleStatic(request));
});
