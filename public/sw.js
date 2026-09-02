// Service Worker — GD Shop Chat
const CACHE_NAME = 'gd-chat-v1';
const STATIC_ASSETS = ['/', '/chat', '/auth', '/manifest.json'];

// Installation : mise en cache des ressources statiques initiales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches et contrôle immédiat
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch : stratégie network-first avec secours sur le cache local
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mise en cache des réponses réseau valides
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas de perte de connexion, tentative de récupération depuis le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback de navigation si la page demandée n'est pas en cache
          if (event.request.mode === 'navigate') {
            return caches.match('/chat');
          }
        });
      })
  );
});

// Push : réception des notifications push et affichage
self.addEventListener('push', (event) => {
  let data = {
    title: 'Nouveau message',
    body: 'Vous avez reçu un nouveau message.',
    url: '/chat',
    icon: '/icons/icon-192.png',
  };

  if (event.data) {
    try {
      const parsedData = event.data.json();
      data = { ...data, ...parsedData };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: data.url || '/chat',
    },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Si l'app est ouverte et visible, ne pas afficher la notification push
      // (la notification navigateur via Realtime s'en charge)
      const isVisible = clients.some((client) => client.visibilityState === 'visible');
      if (isVisible) return;

      return self.registration.showNotification(data.title, options);
    })
  );
});

// Clic sur notification : ouverture de l'URL ou focus sur l'onglet actif
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
