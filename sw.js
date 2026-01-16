// Service Worker für PDF Studio PWA
const CACHE_NAME = 'pdf-studio-v1';
const urlsToCache = [
  './pdf-tool.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache-Fehler:', error);
      })
  );
  self.skipWaiting();
});

// Aktivierung
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Alter Cache gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network First, dann Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Gültige Antwort klonen und cachen
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Bei Netzwerkfehler aus Cache laden
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Fallback für navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./pdf-tool.html');
            }
          });
      })
  );
});
