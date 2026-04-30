"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { SavedSet } from "./useWorkoutFlow";

const OFFLINE_QUEUE_KEY = "fitcoach-offline-set-queue-v1";

type SaveSetPayload = {
  exerciseId: string;
  setNumber: number;
  weightKg?: number;
  reps?: number;
  rir?: number;
  durationMinutes?: number;
  durationSeconds?: number;
  completed: boolean;
  actualRestSeconds?: number;
};

type OfflineQueueItem = {
  id: string;
  workoutId: string;
  payload: SaveSetPayload;
  createdAt: string;
};

function readOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as OfflineQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOfflineQueue(items: OfflineQueueItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
}

function queueOfflineSet(item: OfflineQueueItem) {
  const queue = readOfflineQueue();
  queue.push(item);
  writeOfflineQueue(queue);
}

function buildOfflineSet(payload: SaveSetPayload): SavedSet {
  return {
    id: `offline-${Date.now()}-${payload.exerciseId}-${payload.setNumber}`,
    exerciseId: payload.exerciseId,
    setNumber: payload.setNumber,
    weightKg: payload.weightKg ?? null,
    reps: payload.reps ?? null,
    rir: payload.rir ?? null,
    durationMinutes: payload.durationMinutes ?? null,
    durationSeconds: payload.durationSeconds ?? null,
    completed: payload.completed,
    isPR: false,
    previousMaxWeight: null
  };
}

export function useSaveSet(workoutId: string) {
  const { error: notifyError, success, warning, info } = useNotificationContext();
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(() => {
    if (!workoutId) {
      setPendingSyncCount(0);
      return;
    }

    const queue = readOfflineQueue();
    const count = queue.filter((item) => item.workoutId === workoutId).length;
    setPendingSyncCount(count);
  }, [workoutId]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  const enqueueSet = useCallback(
    (payload: SaveSetPayload) => {
      if (!workoutId) return;

      queueOfflineSet({
        id: `${Date.now()}-${payload.exerciseId}-${payload.setNumber}`,
        workoutId,
        payload,
        createdAt: new Date().toISOString()
      });

      refreshPendingCount();
    },
    [refreshPendingCount, workoutId]
  );

  const syncPendingSets = useCallback(
    async (showToast = true) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (showToast) {
          warning("Baglanti yok. Senkronizasyon bekliyor.");
        }
        return false;
      }

      const queue = readOfflineQueue();
      if (queue.length === 0) {
        refreshPendingCount();
        if (showToast) {
          info("Bekleyen offline set yok.");
        }
        return true;
      }

      setIsSyncing(true);
      const remaining: OfflineQueueItem[] = [];
      let syncedCount = 0;

      for (const item of queue) {
        try {
          const response = await fetch(`/api/client/workouts/${item.workoutId}/sets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload)
          });

          if (!response.ok) {
            remaining.push(item);
            continue;
          }

          syncedCount += 1;
        } catch {
          remaining.push(item);
        }
      }

      writeOfflineQueue(remaining);
      refreshPendingCount();
      setIsSyncing(false);

      if (showToast && syncedCount > 0) {
        success(`${syncedCount} offline set senkronize edildi.`);
      }

      if (showToast && remaining.length > 0) {
        warning(`${remaining.length} set hala bekliyor.`);
      }

      return remaining.length === 0;
    },
    [info, refreshPendingCount, success, warning]
  );

  useEffect(() => {
    const onOnline = () => {
      void syncPendingSets(false);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", onOnline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", onOnline);
      }
    };
  }, [syncPendingSets]);

  const saveWeightSet = async (
    exerciseId: string,
    setNumber: number,
    payload: { weightKg: number; reps: number; rir: number },
    actualRestSeconds?: number
  ): Promise<SavedSet | null> => {
    if (!workoutId) return null;

    const requestPayload: SaveSetPayload = {
      exerciseId,
      setNumber,
      ...payload,
      completed: true,
      ...(actualRestSeconds !== undefined ? { actualRestSeconds } : {}),
    };

    try {
      const response = await fetch(`/api/client/workouts/${workoutId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        notifyError(data.error || "Set kaydedilemedi.");
        return null;
      }

      success(`Set ${setNumber} kaydedildi.`);
      refreshPendingCount();
      return data.set;
    } catch {
      enqueueSet(requestPayload);
      info("Internet yok. Set offline kuyruğa alındı.");
      return buildOfflineSet(requestPayload);
    }
  };

  const saveCardio = async (
    exerciseId: string,
    plannedDurationMinutes: number,
    elapsedSeconds: number
  ): Promise<SavedSet | null> => {
    if (!workoutId) return null;

    try {
      const elapsedMinutes = Math.max(Math.ceil(elapsedSeconds / 60), 1);
      const usedDurationMinutes = Math.min(elapsedMinutes, plannedDurationMinutes);

      const requestPayload: SaveSetPayload = {
        exerciseId,
        setNumber: 1,
        durationMinutes: usedDurationMinutes,
        durationSeconds: elapsedSeconds,
        completed: true
      };

      const response = await fetch(`/api/client/workouts/${workoutId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        notifyError(data.error || "Kardiyo kaydedilemedi.");
        return null;
      }

      success("Kardiyo tamamlandı.");
      refreshPendingCount();
      return data.set;
    } catch {
      const elapsedMinutes = Math.max(Math.ceil(elapsedSeconds / 60), 1);
      const usedDurationMinutes = Math.min(elapsedMinutes, plannedDurationMinutes);
      const requestPayload: SaveSetPayload = {
        exerciseId,
        setNumber: 1,
        durationMinutes: usedDurationMinutes,
        durationSeconds: elapsedSeconds,
        completed: true
      };

      enqueueSet(requestPayload);
      info("Internet yok. Kardiyo sonucu offline kuyruğa alındı.");
      return buildOfflineSet(requestPayload);
    }
  };

  const deleteSet = async (setId: string): Promise<boolean> => {
    if (!workoutId) return false;

    try {
      const response = await fetch(`/api/client/workouts/${workoutId}/sets`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        notifyError(data.error || "Set silinemedi.");
        return false;
      }

      success("Set silindi.");
      refreshPendingCount();
      return true;
    } catch {
      notifyError("Set silinirken bir hata oluştu.");
      return false;
    }
  };

  return {
    saveWeightSet,
    saveCardio,
    deleteSet,
    pendingSyncCount,
    isSyncing,
    syncPendingSets
  };
}

export function useCompleteWorkout() {
  const router = useRouter();
  const { error: notifyError, success } = useNotificationContext();

  const completeWorkout = async (
    workoutId: string,
    mode: "COMPLETED" | "ABANDONED",
    intensityScore?: number
  ): Promise<boolean> => {
    if (!workoutId) return false;

    try {
      const response = await fetch(`/api/client/workouts/${workoutId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...(intensityScore ? { intensityScore } : {}) })
      });

      if (!response.ok) {
        notifyError("Antrenman tamamlanamadı.");
        return false;
      }

      success(mode === "COMPLETED" ? "Antrenman tamamlandı." : "Antrenman yarıda bırakıldı ve kaydedildi.");
      router.push(`/client/workouts/${workoutId}`);
      router.refresh();
      return true;
    } catch (err) {
      notifyError("Antrenman tamamlanırken bir hata oluştu.");
      return false;
    }
  };

  return { completeWorkout };
}
