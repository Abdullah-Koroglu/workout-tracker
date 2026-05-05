const STATIC_CACHE = "fitcoach-static-v6";
const PAGE_CACHE = "fitcoach-pages-v6";
const API_CACHE = "fitcoach-api-v6";
const CACHE_ALLOWLIST = [STATIC_CACHE, PAGE_CACHE, API_CACHE];

const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/manifest-icon-192.maskable.png",
  "/manifest-icon-512.maskable.png",
  "/apple-icon-180.png",
  "/favicon-196.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CACHE_ALLOWLIST.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) =>
          clients.forEach((client) => client.postMessage({ type: "SW_ACTIVATED" }))
        )
      )
  );
});

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.status === 200) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

async function networkFirstStatic(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

async function networkFirstPage(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const fallback = await caches.match("/offline.html");
    if (fallback) {
      return fallback;
    }

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

async function staleWhileRevalidateApi(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response(JSON.stringify({ error: "Offline and no cached data" }), {
    status: 503,
    headers: { "Content-Type": "application/json" }
  });
}

function isRealtimeApiPath(pathname) {
  return pathname === "/api/messages" || pathname.startsWith("/api/messages/");
}

async function networkOnlyApi(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirstPage(event.request));
    return;
  }

  if (isRealtimeApiPath(requestUrl.pathname)) {
    event.respondWith(networkOnlyApi(event.request));
    return;
  }

  if (requestUrl.pathname.startsWith("/api/") && !requestUrl.pathname.startsWith("/api/auth")) {
    event.respondWith(staleWhileRevalidateApi(event.request));
    return;
  }

  const staticDestination = event.request.destination;
  if (["script", "style", "worker"].includes(staticDestination)) {
    event.respondWith(networkFirstStatic(event.request));
    return;
  }

  if (["image", "font", "manifest"].includes(staticDestination)) {
    event.respondWith(cacheFirstStatic(event.request));
  }
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

  if (data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

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
