"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { ExerciseItem, SavedSet } from "./useWorkoutFlow";

export type ExerciseOverride = {
  plannedSetCount: number;
  manuallyCompleted: boolean;
};

export type ExerciseState = {
  exercise: ExerciseItem;
  exerciseSets: SavedSet[];
  completedCount: number;
  nextSetNumber: number;
  isCompleted: boolean;
  plannedSetCount: number;
  suggestedValues: {
    weightKg: number | undefined;
    reps: number | undefined;
    rir: number | undefined;
  };
};

type UseExerciseManagerReturn = {
  exerciseState: ExerciseState[];
  activeExerciseId: string | null;
  completedExercises: number;
  progressPercent: number;
  activeExercise: ExerciseState | null;
  setActiveExerciseId: (id: string | null) => void;
  addExtraSet: (exerciseId: string) => void;
  finishExerciseEarly: (exerciseId: string) => void;
  getCardioState: (exerciseId: string) => { reachedEnd: boolean; seconds: number } | null;
  setCardioSeconds: (exerciseId: string, seconds: number) => void;
  setCardioReachedEnd: (exerciseId: string, reached: boolean) => void;
};

export function useExerciseManager(
  exercises: ExerciseItem[],
  savedSets: SavedSet[]
): UseExerciseManagerReturn {
  const [exerciseOverrides, setExerciseOverrides] = useState<Record<string, ExerciseOverride>>({});
  const [cardioState, setCardioStateMap] = useState<Record<string, { seconds: number; reachedEnd: boolean }>>({});
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  // Initialize/merge overrides when exercises change.
  useEffect(() => {
    if (!exercises.length) {
      setActiveExerciseId(null);
      return;
    }

    setExerciseOverrides((prev) => {
      const next: Record<string, ExerciseOverride> = {};

      for (const exercise of exercises) {
        next[exercise.exerciseId] = prev[exercise.exerciseId] ?? {
          plannedSetCount: Math.max(exercise.targetSets || 1, 1),
          manuallyCompleted: false
        };
      }

      const sameKeys = Object.keys(prev).length === Object.keys(next).length;
      if (sameKeys) {
        let changed = false;
        for (const key of Object.keys(next)) {
          if (
            !prev[key] ||
            prev[key].plannedSetCount !== next[key].plannedSetCount ||
            prev[key].manuallyCompleted !== next[key].manuallyCompleted
          ) {
            changed = true;
            break;
          }
        }
        if (!changed) return prev;
      }

      return next;
    });

    setActiveExerciseId((current) => {
      if (current && exercises.some((exercise) => exercise.exerciseId === current)) {
        return current;
      }
      return exercises[0].exerciseId;
    });
  }, [exercises]);

  const exerciseState: ExerciseState[] = useMemo(() => {
    return exercises.map((exercise) => {
      const exerciseSets = savedSets.filter(
        (setItem) => setItem.exerciseId === exercise.exerciseId && setItem.completed
      );
      const completedCount = exerciseSets.length;
      const override = exerciseOverrides[exercise.exerciseId];
      const plannedSetCount = exercise.exercise.type === "WEIGHT"
        ? override?.plannedSetCount ?? Math.max(exercise.targetSets || 1, 1)
        : 1;
      const isCompleted = Boolean(override?.manuallyCompleted) || completedCount >= plannedSetCount;
      const nextSetNumber = completedCount + 1;
      const latestSet = exerciseSets[exerciseSets.length - 1];

      return {
        exercise,
        exerciseSets,
        completedCount,
        nextSetNumber,
        isCompleted,
        plannedSetCount,
        suggestedValues: {
          weightKg: latestSet?.weightKg ?? exercise.suggestedWeightKg ?? undefined,
          reps: exercise.suggestedReps ?? exercise.targetReps ?? undefined,
          rir: exercise.suggestedRir ?? exercise.targetRir ?? undefined
        }
      };
    });
  }, [exercises, exerciseOverrides, savedSets]);

  const completedExercises = exerciseState.filter((item) => item.isCompleted).length;
  const progressPercent = exerciseState.length
    ? Math.round((completedExercises / exerciseState.length) * 100)
    : 0;

  const activeExercise = exerciseState.find((item) => item.exercise.exerciseId === activeExerciseId) || null;

  const addExtraSet = useCallback((exerciseId: string) => {
    setExerciseOverrides((prev) => {
      const current = prev[exerciseId] || { plannedSetCount: 1, manuallyCompleted: false };
      return {
        ...prev,
        [exerciseId]: {
          ...current,
          plannedSetCount: current.plannedSetCount + 1
        }
      };
    });
  }, []);

  const finishExerciseEarly = useCallback((exerciseId: string) => {
    setExerciseOverrides((prev) => {
      const current = prev[exerciseId] || { plannedSetCount: 1, manuallyCompleted: false };
      return {
        ...prev,
        [exerciseId]: {
          ...current,
          manuallyCompleted: true
        }
      };
    });
  }, []);

  const getCardioState = useCallback((exerciseId: string) => {
    return cardioState[exerciseId] || null;
  }, [cardioState]);

  const setCardioSeconds = useCallback((exerciseId: string, seconds: number) => {
    setCardioStateMap((prev) => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] || { reachedEnd: false }),
        seconds
      }
    }));
  }, []);

  const setCardioReachedEnd = useCallback((exerciseId: string, reached: boolean) => {
    setCardioStateMap((prev) => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] || { seconds: 0 }),
        reachedEnd: reached
      }
    }));
  }, []);

  return {
    exerciseState,
    activeExerciseId,
    completedExercises,
    progressPercent,
    activeExercise,
    setActiveExerciseId,
    addExtraSet,
    finishExerciseEarly,
    getCardioState,
    setCardioSeconds,
    setCardioReachedEnd
  };
}
