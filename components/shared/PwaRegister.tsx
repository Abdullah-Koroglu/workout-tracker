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

    const LEGACY_CACHE_KEYS = ["fitcoach-static-v5", "fitcoach-pages-v5", "fitcoach-api-v5"];
    const HEAL_FLAG_KEY = "fitcoach-sw-heal-v1";

    const forceUpgradeIfLegacyCacheFound = async () => {
      if (!("caches" in window)) return false;
      if (sessionStorage.getItem(HEAL_FLAG_KEY) === "done") return false;

      const keys = await caches.keys();
      const hasLegacy = keys.some((key) => LEGACY_CACHE_KEYS.includes(key));
      if (!hasLegacy) return false;

      sessionStorage.setItem(HEAL_FLAG_KEY, "done");

      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      await Promise.all(keys.filter((key) => key.startsWith("fitcoach-")).map((key) => caches.delete(key)));

      location.reload();
      return true;
    };

    const promoteWaitingWorker = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    };

    const onControllerChange = () => {
      if (sessionStorage.getItem("fitcoach-sw-reloaded") === "1") return;
      sessionStorage.setItem("fitcoach-sw-reloaded", "1");
      location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    (async () => {
      try {
        const healed = await forceUpgradeIfLegacyCacheFound();
        if (healed) return;

        const registration = await navigator.serviceWorker.register("/sw.js");
        promoteWaitingWorker(registration);

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              promoteWaitingWorker(registration);
            }
          });
        });
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    })();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
