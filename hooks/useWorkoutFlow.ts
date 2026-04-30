"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotificationContext } from "@/contexts/NotificationContext";

export type WorkoutData = {
  workoutId: string;
  exercises: ExerciseItem[];
  existingSets: SavedSet[];
  assignment: {
    id: string;
    scheduledFor: string;
    isOneTime: boolean;
  };
};

export type SavedSet = {
  id: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  durationMinutes: number | null;
  durationSeconds: number | null;
  completed: boolean;
  isPR?: boolean;
  previousMaxWeight?: number | null;
};

export type ExerciseItem = {
  id: string;
  exerciseId: string;
  targetSets: number | null;
  targetReps: number | null;
  targetRir: number | null;
  prescribedRestSeconds: number | null;
  suggestedWeightKg: number | null;
  suggestedReps: number | null;
  suggestedRir: number | null;
  durationMinutes: number | null;
  protocol: Array<{ minute: number; speed: number; incline: number }> | null;
  exercise: { name: string; type: "WEIGHT" | "CARDIO" };
};

type UseWorkoutFlowState = {
  workoutId: string;
  exercises: ExerciseItem[];
  savedSets: SavedSet[];
  isLoading: boolean;
  error: string | null;
};

type UseWorkoutFlowActions = {
  addSet: (set: SavedSet) => void;
  removeSet: (setId: string) => void;
  clearError: () => void;
};

export function useWorkoutFlow(assignmentId: string): [UseWorkoutFlowState, UseWorkoutFlowActions] {
  const router = useRouter();
  const { error: notifyError, warning } = useNotificationContext();
  const initializedForAssignmentRef = useRef<string | null>(null);
  const [state, setState] = useState<UseWorkoutFlowState>({
    workoutId: "",
    exercises: [],
    savedSets: [],
    isLoading: true,
    error: null
  });

  const addSet = useCallback((set: SavedSet) => {
    setState((prev) => {
      const filtered = prev.savedSets.filter(
        (s) => !(s.exerciseId === set.exerciseId && s.setNumber === set.setNumber)
      );
      return { ...prev, savedSets: [...filtered, set] };
    });
  }, []);

  const removeSet = useCallback((setId: string) => {
    setState((prev) => ({
      ...prev,
      savedSets: prev.savedSets.filter((s) => s.id !== setId)
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (initializedForAssignmentRef.current === assignmentId) {
      return;
    }

    initializedForAssignmentRef.current = assignmentId;

    const initWorkout = async () => {
      try {
        const response = await fetch("/api/client/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentId })
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle already-completed one-time assignments
          if (response.status === 409 && data.workoutId) {
            warning("Bu atama zaten tamamlandı. Detay sayfasına yönlendiriliyorsun.");
            router.replace(`/client/workouts/${data.workoutId}`);
            return;
          }

          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: data.error || "Antrenman başlatılamadı."
          }));
          return;
        }

        setState({
          workoutId: data.workoutId,
          exercises: data.exercises || [],
          savedSets: data.existingSets || [],
          isLoading: false,
          error: null
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Bir hata oluştu."
        }));
      }
    };

    initWorkout();
  }, [assignmentId, router, warning]);

  return [state, { addSet, removeSet, clearError }];
}
