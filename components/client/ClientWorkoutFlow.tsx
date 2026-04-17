"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, Clock, Dumbbell, Flame, Plus, Sparkles, Target, X } from "lucide-react";
import confetti from "canvas-confetti";

import { CardioTimer } from "@/components/client/CardioTimer";
import { WorkoutSetForm } from "@/components/client/WorkoutSetForm";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";

import { useWorkoutFlow } from "@/hooks/useWorkoutFlow";
import { useExerciseManager, ExerciseState } from "@/hooks/useExerciseManager";
import { useSaveSet, useCompleteWorkout } from "@/hooks/useWorkoutActions";

export function ClientWorkoutFlow({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const { info, warning, success } = useNotificationContext();
  const { confirm } = useConfirmation();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [cardioSeconds, setCardioSeconds] = useState<Record<string, number>>({});
  const [cardioReachedEnd, setCardioReachedEnd] = useState<Record<string, boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  // Load workout data and initialize state
  const [workoutState, workoutActions] = useWorkoutFlow(assignmentId);
  
  // Manage exercise state and active exercise tracking
  const exerciseManager = useExerciseManager(workoutState.exercises, workoutState.savedSets);
  
  // API call handlers
  const {
    saveWeightSet: saveWeightSetApi,
    saveCardio: saveCardioApi,
    pendingSyncCount,
    isSyncing,
    syncPendingSets
  } = useSaveSet(workoutState.workoutId);
  const { completeWorkout } = useCompleteWorkout();

  // Track elapsed time
  useEffect(() => {
    if (!workoutState.workoutId || workoutState.isLoading) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutState.workoutId, workoutState.isLoading]);

  // Format elapsed time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs].map((v) => String(v).padStart(2, "0")).join(":");
  };

  // Derive activeExerciseId before any conditional returns (Rules of Hooks)
  const activeExerciseId = exerciseManager.activeExercise?.exercise.exerciseId ?? "";

  const handleCardioSecondChange = useCallback((seconds: number) => {
    setCardioSeconds((prev) => {
      if (prev[activeExerciseId] === seconds) return prev;
      return { ...prev, [activeExerciseId]: seconds };
    });
  }, [activeExerciseId]);

  const handleCardioReachedEnd = useCallback(() => {
    setCardioReachedEnd((prev) => {
      if (prev[activeExerciseId]) return prev;
      return { ...prev, [activeExerciseId]: true };
    });
  }, [activeExerciseId]);

  const handleCardioAbandon = useCallback(() => {
    setCardioReachedEnd((prev) => {
      if (!prev[activeExerciseId]) return prev;
      return { ...prev, [activeExerciseId]: false };
    });
    setCardioSeconds((prev) => {
      if ((prev[activeExerciseId] || 0) === 0) return prev;
      return { ...prev, [activeExerciseId]: 0 };
    });
    warning("Kardiyo akışı sıfırlandı. Yeniden başlatabilirsin.");
  }, [activeExerciseId, warning]);

  // Show loading state while initializing
  if (workoutState.isLoading) {
    return (
      <div className="rounded-3xl border p-8 text-sm text-muted-foreground">
        Antrenman hazırlanıyor, öneriler toplanıyor...
      </div>
    );
  }

  // Show error if initialization failed
  if (workoutState.error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
        {workoutState.error}
      </div>
    );
  }

  // Ensure we have an active exercise
  if (!exerciseManager.activeExercise) {
    return (
      <div className="rounded-3xl border p-8 text-sm text-muted-foreground">
        Bu atama için egzersiz bulunamadı.
      </div>
    );
  }

  const activeExercise = exerciseManager.activeExercise;

  // Wrapper handlers for API calls with UI state management
  const handleSaveWeightSet = async (
    exerciseId: string,
    setNumber: number,
    payload: { weightKg: number; reps: number; rir: number }
  ) => {
    const saveKey = `${exerciseId}-${setNumber}`;
    setSavingKey(saveKey);
    const newSet = await saveWeightSetApi(exerciseId, setNumber, payload);
    setSavingKey(null);
    
    if (newSet) {
      workoutActions.addSet(newSet);

      if (newSet.isPR) {
        void confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.7 }
        });

        info(
          newSet.previousMaxWeight !== null && newSet.previousMaxWeight !== undefined
            ? `PR! Onceki max ${newSet.previousMaxWeight} kg idi.`
            : "PR! Bu harekette ilk kaydin en iyi kaydin oldu."
        );
      }
    }
  };

  const handleSaveCardio = async (exerciseId: string, plannedDurationMinutes: number) => {
    setSavingKey(exerciseId);
    const elapsedCardioSeconds = cardioSeconds[exerciseId] || 0;
    const newSet = await saveCardioApi(exerciseId, plannedDurationMinutes, elapsedCardioSeconds);
    setSavingKey(null);
    
    if (newSet) {
      workoutActions.addSet(newSet);
    }
  };

  const handleCompleteWorkout = async (mode: "COMPLETED" | "ABANDONED") => {
    const message = mode === "COMPLETED"
      ? "Antrenmanı kaydedip bitirmek istediğine emin misin?"
      : "Antrenmanı yarıda bırakıp kaydetmek istediğine emin misin?";

    const approved = await confirm({
      title: mode === "COMPLETED" ? "Antrenmani bitir" : "Antrenmani yarida birak",
      description: message,
      confirmText: mode === "COMPLETED" ? "Kaydet ve Bitir" : "Yarida Birak",
      cancelText: "Vazgec",
      danger: mode === "ABANDONED"
    });

    if (!approved) {
      return;
    }

    setFinishing(true);
    await completeWorkout(workoutState.workoutId, mode);
    setFinishing(false);
  };

  const handleManualSync = async () => {
    await syncPendingSets(true);
  };

  const handleCancelWorkout = async () => {
    const approved = await confirm({
      title: "Antrenmani sil",
      description: "Antrenmani iptal edip veritabanindan silmek istediginize emin misiniz?",
      confirmText: "Sil",
      cancelText: "Vazgec",
      danger: true
    });

    if (!approved) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch(`/api/client/workouts/${workoutState.workoutId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        warning("Antrenman iptal edilemedi.");
        setCancelling(false);
        return;
      }

      success("Antrenman iptal edildi ve kaydedildi.");
      router.push("/client/dashboard");
      router.refresh();
    } catch (err) {
      warning("Antrenman iptal edilirken bir hata oluştu.");
      setCancelling(false);
    }
  };


  return (
    <div className="space-y-3 md:space-y-6 pb-32 md:pb-28">
      {/* Workout Header */}
      <div className="overflow-hidden rounded-xl md:rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50/95 via-white/95 to-lime-50/95 shadow-sm backdrop-blur">
        <div className="p-3 md:p-4">
            <div className="flex items-center justify-between gap-2">
              <Link href="/client/dashboard" className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-emerald-700 hover:text-emerald-900">
                <ChevronLeft className="h-3 w-3" />
                Dashboard
              </Link>
              <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] md:text-xs font-semibold text-slate-700">
                <Clock className="h-3 w-3 text-emerald-600" />
                {formatTime(elapsedSeconds)}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Antrenman Akisi</p>
                <h1 className="truncate text-sm md:text-xl font-black text-slate-900">{activeExercise.exercise.exercise.name}</h1>
              </div>
              <div className="text-right">
                <p className="text-[10px] md:text-xs text-slate-500">Ilerleme</p>
                <p className="text-sm md:text-lg font-black text-slate-900">%{exerciseManager.progressPercent}</p>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] md:text-xs">
              <div className="rounded-lg bg-white px-2 py-1.5">
                <p className="text-slate-500">Tamamlanan</p>
                <p className="font-bold text-slate-900">{exerciseManager.completedExercises}/{exerciseManager.exerciseState.length}</p>
              </div>
              <div className="rounded-lg bg-white px-2 py-1.5">
                <p className="text-slate-500">Mod</p>
                <p className="font-bold text-slate-900">{activeExercise.exercise.exercise.type === "CARDIO" ? "Cardio" : "Weight"}</p>
              </div>
              <div className="rounded-lg bg-white px-2 py-1.5">
                <p className="text-slate-500">Sıradaki</p>
                <p className="font-bold text-slate-900">Set {activeExercise.nextSetNumber}</p>
              </div>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-all duration-500" style={{ width: `${exerciseManager.progressPercent}%` }} />
            </div>
        </div>
      </div>

      {/* Main Layout: Mobile Tabs + Desktop Sidebar */}
      <div className="space-y-3 md:space-y-6 md:grid md:gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
        
        {/* Mobile: Exercise Tabs */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Egzersizler</p>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">
              {exerciseManager.completedExercises}/{exerciseManager.exerciseState.length}
            </span>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4">
            {exerciseManager.exerciseState.map((item) => (
              <button
                key={item.exercise.id}
                type="button"
                onClick={() => exerciseManager.setActiveExerciseId(item.exercise.exerciseId)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-xs whitespace-nowrap transition border ${
                  item.exercise.exerciseId === activeExercise.exercise.exerciseId
                    ? "border-emerald-500 bg-emerald-100 text-emerald-900"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.isCompleted ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {item.exercise.exercise.type === "CARDIO" ? "🔥" : "💪"}
                  </span>
                ) : (
                  item.exercise.exercise.type === "CARDIO" ? "🔥" : "💪"
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Sidebar */}
        <aside className="hidden md:block md:sticky md:top-36 md:self-start space-y-3">
          {exerciseManager.exerciseState.map((item, index) => (
            <button
              key={item.exercise.id}
              type="button"
              onClick={() => exerciseManager.setActiveExerciseId(item.exercise.exerciseId)}
              className={`w-full rounded-2xl border p-3 md:p-4 text-left transition ${
                item.exercise.exerciseId === activeExercise.exercise.exerciseId
                  ? "border-emerald-500 bg-emerald-50 shadow-sm"
                  : "border-border bg-card hover:border-emerald-300 hover:bg-emerald-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Egzersiz {index + 1}</p>
                  <p className="mt-1 font-semibold text-foreground text-sm truncate">{item.exercise.exercise.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.exercise.exercise.type === "CARDIO" ? `${item.exercise.durationMinutes || 1} dk` : `${item.completedCount}/${item.plannedSetCount} set`}
                  </p>
                </div>
                {item.isCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" /> : item.exercise.exercise.type === "CARDIO" ? <Flame className="h-5 w-5 text-orange-500 flex-shrink-0" /> : <Dumbbell className="h-5 w-5 text-slate-500 flex-shrink-0" />}
              </div>
            </button>
          ))}
        </aside>

        {/* Right Content: Exercise details and form */}
        <section className="space-y-3 md:space-y-5">
          {/* Exercise header and stats - Mobile Optimized */}
          <div className="rounded-xl md:rounded-[32px] border border-border/60 bg-card p-3 md:p-6 shadow-sm">
            <div className="space-y-3 md:space-y-4">
              <div>
                <div className="inline-flex rounded-full bg-emerald-100 px-2 md:px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {activeExercise.exercise.exercise.type === "CARDIO" ? "Cardio" : "Ağırlık"}
                </div>
                <h2 className="mt-1 md:mt-3 text-base md:text-3xl font-black tracking-tight text-foreground">{activeExercise.exercise.exercise.name}</h2>
                <p className="mt-1 md:mt-2 max-w-2xl text-[11px] md:text-sm text-muted-foreground">
                  {activeExercise.exercise.exercise.type === "CARDIO"
                    ? "Protokolü takip et. Başlat, duraklat, durdur veya sıfırla."
                    : "Hedef tekrar ve RIR otomatik. İstersen ekstra set veya erken bitir."}
                </p>
              </div>

              {/* Stats Grid - Mobile First */}
              <div className="grid grid-cols-2 gap-2 md:gap-3 md:grid-cols-3">
                {activeExercise.exercise.exercise.type === "WEIGHT" ? (
                  <>
                    <div className="rounded-lg md:rounded-2xl bg-muted/40 px-3 md:px-4 py-2 md:py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Hedef</p>
                      <p className="mt-1 md:mt-2 text-lg md:text-2xl font-black">{activeExercise.exercise.targetSets || activeExercise.plannedSetCount}x{activeExercise.exercise.targetReps || "-"}</p>
                    </div>
                    <div className="rounded-lg md:rounded-2xl bg-muted/40 px-3 md:px-4 py-2 md:py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Kilo</p>
                      <p className="mt-1 md:mt-2 text-lg md:text-2xl font-black">{activeExercise.suggestedValues.weightKg ?? "-"}</p>
                    </div>
                    <div className="rounded-lg md:rounded-2xl bg-muted/40 px-3 md:px-4 py-2 md:py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">RIR</p>
                      <p className="mt-1 md:mt-2 text-lg md:text-2xl font-black">{activeExercise.suggestedValues.rir ?? activeExercise.exercise.targetRir ?? "-"}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg md:rounded-2xl bg-muted/40 px-3 md:px-4 py-2 md:py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Süre</p>
                      <p className="mt-1 md:mt-2 text-lg md:text-2xl font-black">{activeExercise.exercise.durationMinutes || 1} dk</p>
                    </div>
                    <div className="rounded-lg md:rounded-2xl bg-muted/40 px-3 md:px-4 py-2 md:py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Blok</p>
                      <p className="mt-1 md:mt-2 text-lg md:text-2xl font-black">{activeExercise.exercise.protocol?.length || 1}</p>
                    </div>
                    <div className="rounded-lg md:rounded-2xl bg-muted/40 px-3 md:px-4 py-2 md:py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Durum</p>
                      <p className="mt-1 md:mt-2 text-base md:text-lg font-bold">{activeExercise.isCompleted ? "✓" : "→"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Exercise-specific section: Weight or Cardio */}
          {activeExercise.exercise.exercise.type === "WEIGHT" ? (
            <WeightExerciseSection
              exercise={activeExercise}
              onAddExtraSet={() => exerciseManager.addExtraSet(activeExercise.exercise.exerciseId)}
              onFinishEarly={() => exerciseManager.finishExerciseEarly(activeExercise.exercise.exerciseId)}
              onSaveSet={handleSaveWeightSet}
              savingKey={savingKey}
            />
          ) : (
            <CardioExerciseSection
              exercise={activeExercise}
              workoutId={workoutState.workoutId}
              cardioSeconds={cardioSeconds}
              cardioReachedEnd={cardioReachedEnd}
              onSecondChange={handleCardioSecondChange}
              onReachedEnd={handleCardioReachedEnd}
              onAbandon={handleCardioAbandon}
              onSaveCardio={handleSaveCardio}
              savingKey={savingKey}
            />
          )}
        </section>
      </div>

      {/* Bottom bar: Completion options - Mobile Optimized */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl flex flex-col gap-2 px-3 py-3 md:px-4 md:py-4 md:flex-row md:items-center md:justify-between">
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground">Antrenman özeti</p>
            <p className="text-xs md:text-sm text-muted-foreground">
              {exerciseManager.completedExercises} / {exerciseManager.exerciseState.length} tamamlandı
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:gap-2">
            {pendingSyncCount > 0 ? (
              <Button
                type="button"
                disabled={isSyncing}
                onClick={handleManualSync}
                variant="outline"
                className="border-amber-300 text-amber-800 hover:bg-amber-50 text-xs md:text-sm py-2 md:py-6 flex-1 md:flex-initial"
              >
                {isSyncing ? "Senkronize ediliyor..." : `Sync (${pendingSyncCount})`}
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={cancelling}
              onClick={handleCancelWorkout}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 text-xs md:text-sm py-2 md:py-6 flex-1 md:flex-initial md:min-w-fit"
            >
              <X className="mr-2 h-3 md:h-4 w-3 md:w-4" />
              <span className="hidden sm:inline">{cancelling ? "İptal ediliyor..." : "İptal Et"}</span>
              <span className="sm:hidden">İptal</span>
            </Button>
            <Button 
              type="button" 
              disabled={finishing} 
              onClick={() => handleCompleteWorkout("ABANDONED")} 
              variant="outline" 
              className="text-xs md:text-sm py-2 md:py-6 flex-1"
            >
              {finishing ? "Kaydediliyor..." : "Yarıda Bırak"}
            </Button>
            <Button 
              type="button" 
              disabled={finishing} 
              onClick={() => handleCompleteWorkout("COMPLETED")}
              className="text-xs md:text-sm py-2 md:py-6 flex-1"
            >
              {finishing ? "Tamamlanıyor..." : "Tamamla"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Weight Exercise Section
 * Handles set input, extra set management, and early finish options
 */
function WeightExerciseSection({
  exercise,
  onAddExtraSet,
  onFinishEarly,
  onSaveSet,
  savingKey
}: {
  exercise: ExerciseState;
  onAddExtraSet: () => void;
  onFinishEarly: () => void;
  onSaveSet: (exerciseId: string, setNumber: number, payload: { weightKg: number; reps: number; rir: number }) => void;
  savingKey: string | null;
}) {
  return (
    <div className="space-y-3 md:space-y-4 rounded-xl md:rounded-[32px] border border-border/60 bg-card p-4 md:p-6 shadow-sm">
      <div className="space-y-3 md:space-y-0 md:flex md:flex-col md:gap-4 md:lg:flex-row md:lg:items-center md:lg:justify-between">
        <div>
          <p className="text-xs md:text-sm font-semibold text-foreground">Set Planı</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Planlanan {exercise.plannedSetCount} set. Artırabilir veya erken bitirebilirsin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onAddExtraSet} className="text-xs md:text-sm py-5 md:py-6 flex-1 md:flex-initial">
            <Plus className="mr-2 h-3 md:h-4 w-3 md:w-4" />
            <span className="hidden sm:inline">1 Ekstra Set</span>
            <span className="sm:hidden">+Set</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={exercise.completedCount === 0 || exercise.isCompleted}
            onClick={onFinishEarly}
            className="text-xs md:text-sm py-5 md:py-6 flex-1 md:flex-initial"
          >
            <span className="hidden sm:inline">Bugün Burada Bitir</span>
            <span className="sm:hidden">Bitir</span>
          </Button>
        </div>
      </div>

      {/* Completed Sets Display */}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {exercise.exerciseSets.length === 0 ? (
          <div className="col-span-2 md:col-span-3 rounded-lg border border-dashed p-3 md:p-4 text-xs md:text-sm text-muted-foreground bg-muted/30">
            İlk seti gir. Öneriler alındı.
          </div>
        ) : (
          exercise.exerciseSets.map((setItem) => (
            <div key={setItem.id} className="rounded-lg md:rounded-xl border bg-emerald-50 border-emerald-200 p-2 md:p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">Set {setItem.setNumber}</p>
              {setItem.isPR ? (
                <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-700">
                  PR
                </span>
              ) : null}
              <div className="mt-2 space-y-1 text-xs md:text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Kg:</span> <strong>{setItem.weightKg ?? 0}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rep:</span> <strong>{setItem.reps ?? 0}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">RIR:</span> <strong>{setItem.rir ?? 0}</strong></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Next Set Form */}
      {!exercise.isCompleted && (
        <div className="space-y-3 pt-2 md:pt-3 border-t">
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-foreground">
            <Target className="h-4 w-4 text-emerald-600" />
            <span>SET {exercise.nextSetNumber} / {exercise.plannedSetCount}</span>
          </div>
          <WorkoutSetForm
            key={`${exercise.exercise.exerciseId}-${exercise.nextSetNumber}`}
            setNumber={exercise.nextSetNumber}
            defaultValues={exercise.suggestedValues}
            disabled={savingKey === `${exercise.exercise.exerciseId}-${exercise.nextSetNumber}`}
            onSave={async (payload) => {
              await onSaveSet(exercise.exercise.exerciseId, exercise.nextSetNumber, payload);
            }}
          />
        </div>
      )}

      {exercise.isCompleted && (
        <div className="rounded-lg md:rounded-xl bg-emerald-50 p-3 md:p-4 text-xs md:text-sm font-medium text-emerald-700 border border-emerald-200">
          ✓ Bu hareket tamamlandı. Başka harekete geç veya antrenmanı sona erdir.
        </div>
      )}
    </div>
  );
}

/**
 * Cardio Exercise Section
 * Handles cardio timer, protocol display, and cardio completion
 */
function CardioExerciseSection({
  exercise,
  workoutId,
  cardioSeconds,
  cardioReachedEnd,
  onSecondChange,
  onReachedEnd,
  onAbandon,
  onSaveCardio,
  savingKey
}: {
  exercise: ExerciseState;
  workoutId: string;
  cardioSeconds: Record<string, number>;
  cardioReachedEnd: Record<string, boolean>;
  onSecondChange: (seconds: number) => void;
  onReachedEnd: () => void;
  onAbandon: () => void;
  onSaveCardio: (exerciseId: string, durationMinutes: number) => void;
  savingKey: string | null;
}) {
  const normalizedProtocol = (exercise.exercise.protocol || []).map((row) => {
    const value = row as unknown as Record<string, unknown>;
    const durationFromNew = typeof value.durationMinutes === "number" ? value.durationMinutes : null;
    const durationFromLegacy = typeof value.minute === "number" ? value.minute : null;

    return {
      durationMinutes: Math.max(1, Number(durationFromNew ?? durationFromLegacy ?? 1)),
      speed: Number(value.speed ?? 0),
      incline: Number(value.incline ?? 0)
    };
  });

  return (
    <div className="space-y-3 md:space-y-4 rounded-xl md:rounded-[32px] border border-border/60 bg-card p-4 md:p-6 shadow-sm">
      <CardioTimer
        storageKey={`cardio-${workoutId}-${exercise.exercise.id}`}
        durationMinutes={exercise.exercise.durationMinutes || 1}
        protocol={normalizedProtocol.length ? normalizedProtocol : [{ durationMinutes: 1, speed: 0, incline: 0 }]}
        enabled={!exercise.isCompleted}
        onReachedEnd={onReachedEnd}
        onAbandon={onAbandon}
        onSecondChange={onSecondChange}
      />
      <div className="flex flex-col gap-2 md:flex-row md:gap-3">
        <Button
          type="button"
          disabled={exercise.isCompleted || savingKey === exercise.exercise.exerciseId}
          onClick={() => onSaveCardio(exercise.exercise.exerciseId, exercise.exercise.durationMinutes || 1)}
          className="text-xs md:text-sm py-5 md:py-6 flex-1"
        >
          <Sparkles className="mr-2 h-3 md:h-4 w-3 md:w-4" />
          {cardioReachedEnd[exercise.exercise.exerciseId] ? "Kaydet" : "Kısmi Kaydet"}
        </Button>
      </div>
      {exercise.isCompleted && (
        <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-emerald-50 border border-emerald-200 text-xs md:text-sm font-medium text-emerald-700">
          ✓ Kardiyo tamamlandı.
        </div>
      )}
    </div>
  );
}
