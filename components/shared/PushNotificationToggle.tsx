"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function PushNotificationToggle() {
  const { success, warning, error } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);

  const vapidPublicKey = useMemo(() => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "", []);

  useEffect(() => {
    const check = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setPermission("unsupported");
        return;
      }

      setPermission(Notification.permission);
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      setSubscribed(Boolean(subscription));
    };

    void check();
  }, []);

  const enablePush = async () => {
    if (!vapidPublicKey) {
      warning("NEXT_PUBLIC_VAPID_PUBLIC_KEY ayarlı değil.");
      return;
    }

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!window.isSecureContext && !isLocalhost) {
      warning("Push bildirimleri için HTTPS gerekiyor.");
      return;
    }

    setLoading(true);
    try {
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      const registration =
        existingRegistration || (await navigator.serviceWorker.register("/sw.js"));

      await navigator.serviceWorker.ready;

      const asked = await Notification.requestPermission();
      setPermission(asked);

      if (asked !== "granted") {
        warning("Bildirim izni verilmedi.");
        setLoading(false);
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        }));

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription })
      });

      if (!response.ok) {
        throw new Error("Subscription store failed");
      }

      setSubscribed(true);
      success("Push bildirimleri aktif edildi.");
    } catch (err) {
      error("Push bildirimleri aktif edilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const disablePush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      await subscription?.unsubscribe();

      await fetch("/api/notifications/subscribe", { method: "DELETE" });

      setSubscribed(false);
      success("Push bildirimleri kapatıldı.");
    } catch (err) {
      error("Push bildirimleri kapatılamadı.");
    } finally {
      setLoading(false);
    }
  };

  if (permission === "unsupported") {
    return null;
  }

  return subscribed ? (
    <Button type="button" variant="outline" onClick={disablePush} disabled={loading} className="gap-2">
      <BellOff className="h-4 w-4" />
      {/* Bildirimleri Kapat */}
    </Button>
  ) : (
    <Button type="button" onClick={enablePush} disabled={loading} className="gap-2">
      <Bell className="h-4 w-4" />
      {/* Bildirimleri Ac */}
    </Button>
  );
}
