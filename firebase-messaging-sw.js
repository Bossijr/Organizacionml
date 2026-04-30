// firebase-messaging-sw.js
// Service Worker unificado: FCM (recordatorios) + Temporizador de series
// Debe estar en la RAÍZ del proyecto (mismo nivel que index.html)

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDGqvYebc6HfZbtdMyXC1EIycRInrRcr8A",
  authDomain: "organizacionml.firebaseapp.com",
  projectId: "organizacionml",
  storageBucket: "organizacionml.firebasestorage.app",
  messagingSenderId: "217963164755",
  appId: "1:217963164755:web:6504fc815010b7110242a6"
});

const messaging = firebase.messaging();

// ── FCM: notificaciones en background / app cerrada ──
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Mensaje FCM en background:', payload);
  const title = payload.notification?.title || '⏰ Recordatorio';
  const body  = payload.notification?.body  || '';
  self.registration.showNotification(title, {
    body,
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    tag:   payload.data?.eventId ? 'remind-' + payload.data.eventId : 'remind',
    data:  payload.data || {}
  });
});

// ── Temporizador de series ──
let timerTimeout = null;

self.addEventListener('message', e => {
  const data = e.data;
  if (!data) return;

  if (data.type === 'TIMER_START') {
    if (timerTimeout) { clearTimeout(timerTimeout); timerTimeout = null; }
    const delay = data.endAt - Date.now();
    if (delay <= 0) {
      fireTimerNotification();
      notifyClients();
      return;
    }
    timerTimeout = setTimeout(() => {
      timerTimeout = null;
      fireTimerNotification();
      notifyClients();
    }, delay);
    console.log('[SW] Timer programado en', Math.round(delay / 1000), 'segundos');
  }

  if (data.type === 'TIMER_CANCEL') {
    if (timerTimeout) { clearTimeout(timerTimeout); timerTimeout = null; }
    console.log('[SW] Timer cancelado');
  }
});

function fireTimerNotification() {
  self.registration.showNotification('⏱ ¡Descanso terminado!', {
    body: 'A por la siguiente serie 💪',
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'timer',
    renotify: true,
    requireInteraction: false,
    silent: false
  });
}

function notifyClients() {
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(c => c.postMessage({ type: 'TIMER_DONE' }));
  });
}

// ── Click en cualquier notificación → abrir / enfocar la app ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
