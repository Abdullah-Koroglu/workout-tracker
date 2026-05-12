"use client";

import { useRouter } from "next/navigation";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { SavedSet } from "./useWorkoutFlow";

type SaveSetPayload = {
  exerciseId: string;
  setNumber: number;
  groupInstanceId?: string;
  dropIndex?: number;
  weightKg?: number;
  reps?: number;
  rir?: number;
  durationMinutes?: number;
  durationSeconds?: number;
  completed: boolean;
  actualRestSeconds?: number;
};

export function useSaveSet(workoutId: string) {
  const { error: notifyError, success } = useNotificationContext();

  const saveWeightSet = async (
    exerciseId: string,
    setNumber: number,
    payload: { weightKg: number; reps: number; rir: number },
    actualRestSeconds?: number,
    grouping?: { groupInstanceId?: string; dropIndex?: number }
  ): Promise<SavedSet | null> => {
    if (!workoutId) return null;

    const requestPayload: SaveSetPayload = {
      exerciseId,
      setNumber,
      ...payload,
      completed: true,
      ...(actualRestSeconds !== undefined ? { actualRestSeconds } : {}),
      ...(grouping?.groupInstanceId ? { groupInstanceId: grouping.groupInstanceId } : {}),
      ...(grouping?.dropIndex !== undefined ? { dropIndex: grouping.dropIndex } : {}),
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
      return data.set;
    } catch {
      notifyError("Set kaydedilirken bir hata oluştu.");
      return null;
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
      return data.set;
    } catch {
      notifyError("Kardiyo kaydedilirken bir hata oluştu.");
      return null;
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
      return true;
    } catch {
      notifyError("Set silinirken bir hata oluştu.");
      return false;
    }
  };

  return {
    saveWeightSet,
    saveCardio,
    deleteSet
  };
}

export function useCompleteWorkout() {
  const router = useRouter();
  const { error: notifyError, success } = useNotificationContext();

  const completeWorkout = async (
    workoutId: string,
    mode: "COMPLETED" | "ABANDONED",
    intensityScore?: number,
    extras?: {
      notes?: string;
      energyLevel?: number;
      moodBefore?: number;
      moodAfter?: number;
      location?: string;
      durationSeconds?: number;
    }
  ): Promise<boolean> => {
    if (!workoutId) return false;

    try {
      const response = await fetch(`/api/client/workouts/${workoutId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ...(intensityScore ? { intensityScore } : {}),
          ...(extras ?? {}),
        })
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
