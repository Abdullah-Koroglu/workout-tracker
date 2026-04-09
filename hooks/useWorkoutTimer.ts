"use client";

import { useEffect, useState } from "react";

type TimerSnapshot = {
  seconds: number;
  isRunning: boolean;
};

export function useWorkoutTimer(storageKey: string, enabled = true, maxSeconds?: number) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      setSeconds(0);
      setIsRunning(false);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as TimerSnapshot;
      setSeconds(Number.isFinite(parsed.seconds) ? parsed.seconds : 0);
      setIsRunning(Boolean(parsed.isRunning));
    } catch {
      const legacyValue = Number(saved);
      setSeconds(Number.isFinite(legacyValue) ? legacyValue : 0);
      setIsRunning(false);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ seconds, isRunning }));
  }, [isRunning, seconds, storageKey]);

  useEffect(() => {
    if (!enabled || !isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = typeof maxSeconds === "number" ? Math.min(prev + 1, maxSeconds) : prev + 1;
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, isRunning, maxSeconds]);

  useEffect(() => {
    if (typeof maxSeconds === "number" && seconds >= maxSeconds && isRunning) {
      setIsRunning(false);
    }
  }, [isRunning, maxSeconds, seconds]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const resume = () => setIsRunning(true);
  const finish = () => {
    setSeconds(typeof maxSeconds === "number" ? maxSeconds : seconds);
    setIsRunning(false);
  };
  const reset = () => {
    setSeconds(0);
    setIsRunning(false);
    localStorage.removeItem(storageKey);
  };

  return { seconds, isRunning, setSeconds, start, pause, resume, finish, reset };
}
