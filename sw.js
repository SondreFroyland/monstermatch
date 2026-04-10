const CACHE_NAME = 'monstermatch-v3';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './js/license.js',
  './js/qrcode.js',
  './js/game-codes.js',
  './js/themes.js',
  './js/math-generator.js',
  './js/images.js',
  './js/state.js',
  './js/ui-helpers.js',
  './js/menu.js',
  './js/game.js',
  './icon-192.png',
  './icon-512.png',
];

// Install: precache alle filer og ta over umiddelbart
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: slett gamle cacher og ta kontroll
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML, stale-while-revalidate for resten
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHTML = event.request.destination === 'document'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('/');

  if (isHTML) {
    // Network-first for HTML: alltid hent nyeste versjon, bypass HTTP-cache
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Stale-while-revalidate for andre ressurser (JS, CSS, ikoner, jsQR)
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
  }
});
