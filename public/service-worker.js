
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});


self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});


const firstSentence = (txt = "") => {
  const t = (txt || "").trim().replace(/\s+/g, " ");
  const m = t.match(/.*?[.!?](?=\s|$)/);
  return (m ? m[0] : t);
};

self.addEventListener('push', (event) => {
  let data = {};
  try { 
    data = event.data?.json() ?? {}; 
  } catch { 
    data = { message: event.data?.text() ?? "" }; 
  }

  const full = (data.message || "");
  const summary = firstSentence(full);

  const options = {
    body: full,
    icon: "/android-chrome-192x192.png",
    badge: "/android-chrome-192x192.png",
    image: data.image || undefined,
    requireInteraction: true,
    silent: false,
    vibrate: [80, 40, 80],
    timestamp: Date.now(),
    tag: "medingen-push",
    renotify: true,
    actions: [
      { action: "open", title: "View Details" },
      { action: "shop", title: "Shop Now" },
    ],
    data: {
      url: data.url || "/",
      summary,
      full
    }
  };

  // Display notification even if app is closed
  event.waitUntil(
    self.registration.showNotification(summary, options)
  );
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/notification";

  if (event.action === "open") {
    event.waitUntil(clients.openWindow(targetUrl));
    return;
  }
  if (event.action === "shop") {
    event.waitUntil(clients.openWindow("/"));
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if (c.url.includes(new URL(targetUrl, self.location.origin).pathname) && "focus" in c) {
          return c.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});