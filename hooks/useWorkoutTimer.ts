"use client";

import { useEffect, useState } from "react";

type TimerSnapshot = {
  seconds: number;
  isRunning: boolean;
  lastUpdatedAtMs?: number | null;
};

export function useWorkoutTimer(storageKey: string, enabled = true, maxSeconds?: number, stepSeconds = 1) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdatedAtMs, setLastUpdatedAtMs] = useState<number | null>(null);

  const increment = Math.max(1, Math.floor(stepSeconds));

  const clampSeconds = (value: number) => {
    const normalized = Math.max(0, value);
    return typeof maxSeconds === "number" ? Math.min(normalized, maxSeconds) : normalized;
  };

  const reconcileElapsed = () => {
    if (!enabled || !isRunning) {
      return;
    }

    const lastTick = lastUpdatedAtMs;
    if (!lastTick) {
      setLastUpdatedAtMs(Date.now());
      return;
    }

    const now = Date.now();
    const elapsedWholeSeconds = Math.floor((now - lastTick) / 1000);
    if (elapsedWholeSeconds <= 0) {
      return;
    }

    setSeconds((prev) => clampSeconds(prev + elapsedWholeSeconds * increment));
    setLastUpdatedAtMs(lastTick + elapsedWholeSeconds * 1000);
  };

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      setSeconds(0);
      setIsRunning(false);
      setLastUpdatedAtMs(null);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as TimerSnapshot;
      setSeconds(Number.isFinite(parsed.seconds) ? parsed.seconds : 0);
      setIsRunning(Boolean(parsed.isRunning));
      setLastUpdatedAtMs(
        Number.isFinite(parsed.lastUpdatedAtMs)
          ? Number(parsed.lastUpdatedAtMs)
          : parsed.isRunning
          ? Date.now()
          : null
      );
    } catch {
      const legacyValue = Number(saved);
      setSeconds(Number.isFinite(legacyValue) ? legacyValue : 0);
      setIsRunning(false);
      setLastUpdatedAtMs(null);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ seconds, isRunning, lastUpdatedAtMs }));
  }, [isRunning, lastUpdatedAtMs, seconds, storageKey]);

  useEffect(() => {
    reconcileElapsed();
    // Keep timer accurate after tab/background throttling and after app restore.
    const onForeground = () => reconcileElapsed();
    document.addEventListener("visibilitychange", onForeground);
    window.addEventListener("focus", onForeground);
    window.addEventListener("pageshow", onForeground);

    return () => {
      document.removeEventListener("visibilitychange", onForeground);
      window.removeEventListener("focus", onForeground);
      window.removeEventListener("pageshow", onForeground);
    };
  }, [enabled, isRunning, lastUpdatedAtMs, stepSeconds, maxSeconds]);

  useEffect(() => {
    if (!enabled || !isRunning) {
      return;
    }

    const interval = setInterval(() => {
      reconcileElapsed();
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, isRunning, lastUpdatedAtMs, stepSeconds, maxSeconds]);

  useEffect(() => {
    if (typeof maxSeconds === "number" && seconds >= maxSeconds && isRunning) {
      setIsRunning(false);
      setLastUpdatedAtMs(null);
    }
  }, [isRunning, maxSeconds, seconds]);

  const start = () => {
    setLastUpdatedAtMs(Date.now());
    setIsRunning(true);
  };
  const pause = () => {
    reconcileElapsed();
    setIsRunning(false);
    setLastUpdatedAtMs(null);
  };
  const resume = () => {
    setLastUpdatedAtMs(Date.now());
    setIsRunning(true);
  };
  const finish = () => {
    reconcileElapsed();
    setSeconds(typeof maxSeconds === "number" ? maxSeconds : seconds);
    setIsRunning(false);
    setLastUpdatedAtMs(null);
  };
  const reset = () => {
    setSeconds(0);
    setIsRunning(false);
    setLastUpdatedAtMs(null);
    localStorage.removeItem(storageKey);
  };

  return { seconds, isRunning, setSeconds, start, pause, resume, finish, reset };
}
