// sw.js — Service Worker
// Gestiona: PWA cache + notificaciones del temporizador de series

const CACHE_NAME = 'miapp-v1';

// ── Instalación / activación básica PWA ──
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// ── Cache básico (fetch) ──
self.addEventListener('fetch', e => {
  // Solo cacheamos requests GET de la misma origen
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── Temporizador de series ──
let timerTimeout = null;

self.addEventListener('message', e => {
  const data = e.data;
  if (!data) return;

  if (data.type === 'TIMER_START') {
    // Cancelar cualquier timer previo
    if (timerTimeout) { clearTimeout(timerTimeout); timerTimeout = null; }

    const delay = data.endAt - Date.now();
    if (delay <= 0) {
      fireTimerNotification();
      return;
    }

    timerTimeout = setTimeout(() => {
      timerTimeout = null;
      fireTimerNotification();
      // Avisar a la página si está abierta
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'TIMER_DONE' }));
      });
    }, delay);
  }

  if (data.type === 'TIMER_CANCEL') {
    if (timerTimeout) { clearTimeout(timerTimeout); timerTimeout = null; }
  }
});

function fireTimerNotification() {
  // Necesita permiso de notificaciones concedido previamente
  self.registration.showNotification('⏱ ¡Descanso terminado!', {
    body: 'A por la siguiente serie 💪',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'timer',          // reemplaza notificaciones anteriores del mismo tag
    renotify: true,
    requireInteraction: false,
    silent: false
  });
}

// ── Click en la notificación → abrir/enfocar la app ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url && c.visibilityState !== undefined);
      if (existing) return existing.focus();
      return self.clients.openWindow('./');
    })
  );
});
