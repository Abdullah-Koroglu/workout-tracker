"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      // Service workers in dev can cache stale Next.js chunks and cause white screens.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch((error) => {
            console.error("Service worker unregister failed:", error);
          });
        });
      });

      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys
            .filter((key) => key.startsWith("fitcoach-"))
            .forEach((key) => {
              caches.delete(key).catch((error) => {
                console.error("Cache cleanup failed:", error);
              });
            });
        });
      }

      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
