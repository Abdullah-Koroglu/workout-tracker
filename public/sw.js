self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || "Fit Coach";
  const options = {
    body: data.body || "Yeni bir bildirimin var.",
    icon: "/manifest-icon-192.maskable.png",
    badge: "/favicon-196.png",
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;

  if (!data || data.type !== "CARDIO_BLOCK_TRANSITION") {
    return;
  }

  const title = data.title || "Kardiyo Blok Geçişi";
  const body = data.body || "Yeni blok başladı.";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/manifest-icon-192.maskable.png",
      badge: "/favicon-196.png",
      tag: "cardio-block-transition",
      renotify: true,
      vibrate: [120, 80, 120],
      data: {
        url: "/client/workouts"
      }
    })
  );
});
