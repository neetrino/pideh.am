/* Admin new-order Web Push service worker. Payload shape: { title, body, url, tag }. */

const FALLBACK_URL = '/admin/orders';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function parsePayload(event) {
  try {
    return event.data ? event.data.json() : {};
  } catch {
    return {};
  }
}

async function hasVisibleClient() {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return windows.some((client) => client.visibilityState === 'visible');
}

self.addEventListener('push', (event) => {
  const payload = parsePayload(event);
  const title = typeof payload.title === 'string' ? payload.title : 'New order';

  event.waitUntil(
    hasVisibleClient().then((visible) =>
      self.registration.showNotification(title, {
        body: typeof payload.body === 'string' ? payload.body : '',
        tag: typeof payload.tag === 'string' ? payload.tag : 'admin-new-order',
        icon: '/icon.png',
        requireInteraction: true,
        // The open admin tab already plays its own looping alert.
        silent: visible,
        data: { url: typeof payload.url === 'string' ? payload.url : FALLBACK_URL },
      }),
    ),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || FALLBACK_URL, self.location.origin);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const adminWindow = windows.find((client) => new URL(client.url).pathname.includes('/admin'));
      if (adminWindow) {
        return adminWindow.focus().then((client) => client.navigate(targetUrl.href));
      }
      return self.clients.openWindow(targetUrl.href);
    }),
  );
});
