"use client";

import { useRouter } from "next/navigation";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { SavedSet } from "./useWorkoutFlow";

export function useSaveSet(workoutId: string) {
  const { error: notifyError, success } = useNotificationContext();

  const saveWeightSet = async (
    exerciseId: string,
    setNumber: number,
    payload: { weightKg: number; reps: number; rir: number }
  ): Promise<SavedSet | null> => {
    if (!workoutId) return null;

    try {
      const response = await fetch(`/api/client/workouts/${workoutId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          setNumber,
          ...payload,
          completed: true
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        notifyError(data.error || "Set kaydedilemedi.");
        return null;
      }

      success(`Set ${setNumber} kaydedildi.`);
      return data.set;
    } catch (err) {
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

      const response = await fetch(`/api/client/workouts/${workoutId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          setNumber: 1,
          durationMinutes: usedDurationMinutes,
          durationSeconds: elapsedSeconds,
          completed: true
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        notifyError(data.error || "Kardiyo kaydedilemedi.");
        return null;
      }

      success("Kardiyo tamamlandı.");
      return data.set;
    } catch (err) {
      notifyError("Kardiyo kaydedilirken bir hata oluştu.");
      return null;
    }
  };

  return { saveWeightSet, saveCardio };
}

export function useCompleteWorkout() {
  const router = useRouter();
  const { error: notifyError, success } = useNotificationContext();

  const completeWorkout = async (
    workoutId: string,
    mode: "COMPLETED" | "ABANDONED"
  ): Promise<boolean> => {
    if (!workoutId) return false;

    try {
      const response = await fetch(`/api/client/workouts/${workoutId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
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
