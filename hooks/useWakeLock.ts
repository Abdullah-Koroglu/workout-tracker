"use client";

import { useEffect, useRef } from "react";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

export function useWakeLock(enabled: boolean) {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      const nav = navigator as NavigatorWithWakeLock;
      if (!enabled || !nav.wakeLock) return;
      sentinelRef.current = await nav.wakeLock.request("screen");
    };

    requestWakeLock();

    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release();
        sentinelRef.current = null;
      }
    };
  }, [enabled]);
}
