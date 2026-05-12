"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch((error) => {
            console.error("Service worker unregister failed:", error);
          });
        });
      });

      return;
    }

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

    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type !== "SW_ACTIVATED") return;
      if (sessionStorage.getItem("fitcoach-sw-reloaded") === "1") return;
      sessionStorage.setItem("fitcoach-sw-reloaded", "1");
      location.reload();
    };

    navigator.serviceWorker.addEventListener("message", onSwMessage);

    (async () => {
      try {
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
      navigator.serviceWorker.removeEventListener("message", onSwMessage);
    };
  }, []);

  return null;
}
