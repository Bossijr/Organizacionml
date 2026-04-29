// ══════════════════════════════════════════════════════════════
//  firebase-messaging-sw.js
//  Coloca este archivo en la RAÍZ de tu servidor (mismo nivel que index.html)
// ══════════════════════════════════════════════════════════════

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

// ── Notificaciones en background (app cerrada o en segundo plano) ──
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Mensaje en background recibido:', payload);

  const title = (payload.notification && payload.notification.title) || '⏰ Recordatorio';
  const body  = (payload.notification && payload.notification.body)  || '';

  self.registration.showNotification(title, {
    body,
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    tag:   payload.data && payload.data.evId ? 'remind-' + payload.data.evId : 'remind',
    data:  payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false
  });
});

// ── Al pulsar la notificación, abre / enfoca la app ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
