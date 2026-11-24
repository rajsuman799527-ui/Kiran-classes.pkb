/* Firebase Cloud Messaging service worker. Keep this file in the ROOT of the site (next to index.html). */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

let cfg = {};
try { cfg = JSON.parse(atob(decodeURIComponent(new URL(self.location).searchParams.get('c') || ''))); } catch (e) {}

if (cfg.projectId) {
  firebase.initializeApp(cfg);
  const messaging = firebase.messaging();
  // The server sends data-only messages, so we show the notification ourselves.
  messaging.onBackgroundMessage((payload) => {
    const d = payload.data || {};
    return self.registration.showNotification(d.title || 'New notification', {
      body: d.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: d.tag || undefined,
      renotify: !!d.tag,
      data: { url: d.url || '/' },
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { if (c.navigate) c.navigate(url).catch(() => {}); return c.focus(); }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
