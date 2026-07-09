const CACHE_NAME = 'studysync-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/main.css',
  './css/components.css',
  './css/pages.css',
  './js/app.js',
  './js/firebase/config.js',
  './js/firebase/auth.js',
  './js/firebase/db.js',
  './js/components/Sidebar.js',
  './js/components/Timer.js',
  './js/components/NoteEditor.js',
  './js/components/Charts.js',
  './js/pages/dashboard.js',
  './js/pages/youtube.js',
  './js/pages/syllabus.js',
  './js/pages/notes.js',
  './js/pages/planner.js',
  './js/pages/mocktests.js',
  './js/pages/pyqs.js',
  './js/pages/analytics.js',
  './js/pages/ai.js',
  './js/pages/settings.js',
  './js/pages/admin.js',
  './js/utils/gemini.js',
  './js/utils/youtube-api.js',
  './js/utils/helpers.js'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching files...');
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[Service Worker] Error caching files: ', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache...', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (e) => {
  // Only cache GET requests
  if (e.request.method !== 'GET') return;
  
  // Skip Firebase requests, Gemini requests, and external APIs from caching directly
  const url = new URL(e.request.url);
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('firebaseinstallations.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.origin.includes('securetoken.googleapis.com') ||
    url.origin.includes('generativelanguage.googleapis.com')
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to update cache (stale-while-revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network errors offline */});
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // If resource is an HTML page, return the index.html shell as fallback (SPA routing)
        if (e.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Push Notification Event
self.addEventListener('push', (e) => {
  let data = { title: 'StudySync', body: 'New update from your partner!' };
  if (e.data) {
    try {
      data = e.data.json();
    } catch (err) {
      data.body = e.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: './assets/images/icon-192.png',
    badge: './assets/images/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || './#dashboard' }
  };
  
  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      const urlToOpen = e.notification.data.url;
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
