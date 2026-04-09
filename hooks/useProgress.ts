"use client";

export function useProgress(current: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}
