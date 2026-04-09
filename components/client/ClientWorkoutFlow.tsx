"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, Clock, Dumbbell, Flame, Plus, Sparkles, Target, X } from "lucide-react";

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
  const { saveWeightSet: saveWeightSetApi, saveCardio: saveCardioApi } = useSaveSet(workoutState.workoutId);
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
  const activeExerciseId = activeExercise.exercise.exerciseId;

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
    <div className="space-y-6 pb-28">
      {/* Header with progress stats */}
      <div className="overflow-hidden rounded-[32px] border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <Link href="/client/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900">
              <ChevronLeft className="h-4 w-4" />
              Dashboard'a dön
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Workout Flow</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Bugünkü antrenman hazır</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Hedef değerler senin için dolduruldu. İstersen aynı plandan sapabilir, ekstra set ekleyebilir veya bugünkü hareketi erken bitirebilirsin.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Geçen Süre</p>
              <p className="mt-2 font-mono text-2xl font-black text-slate-900">{formatTime(elapsedSeconds)}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">İlerleme</p>
              <p className="mt-2 text-3xl font-black text-slate-900">%{exerciseManager.progressPercent}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tamamlanan</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{exerciseManager.completedExercises}/{exerciseManager.exerciseState.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Aktif mod</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{activeExercise.exercise.exercise.type === "CARDIO" ? "Cardio" : "Weight"}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-all duration-500" style={{ width: `${exerciseManager.progressPercent}%` }} />
        </div>
      </div>

      {/* Main layout: Sidebar + Content */}
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        
        {/* Left Sidebar: Exercise list */}
        <aside className="space-y-3 xl:sticky xl:top-24 xl:self-start">
          {exerciseManager.exerciseState.map((item, index) => (
            <button
              key={item.exercise.id}
              type="button"
              onClick={() => exerciseManager.setActiveExerciseId(item.exercise.exerciseId)}
              className={`w-full rounded-3xl border p-4 text-left transition ${
                item.exercise.exerciseId === activeExercise.exercise.exerciseId
                  ? "border-emerald-500 bg-emerald-50 shadow-sm"
                  : "border-border bg-card hover:border-emerald-300 hover:bg-emerald-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Egzersiz {index + 1}</p>
                  <p className="mt-1 font-semibold text-foreground">{item.exercise.exercise.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.exercise.exercise.type === "CARDIO" ? `${item.exercise.durationMinutes || 1} dk protokol` : `${item.completedCount}/${item.plannedSetCount} set`}
                  </p>
                </div>
                {item.isCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : item.exercise.exercise.type === "CARDIO" ? <Flame className="h-5 w-5 text-orange-500" /> : <Dumbbell className="h-5 w-5 text-slate-500" />}
              </div>
            </button>
          ))}
        </aside>

        {/* Right Content: Exercise details and form */}
        <section className="space-y-5">
          {/* Exercise header and stats */}
          <div className="rounded-[32px] border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {activeExercise.exercise.exercise.type === "CARDIO" ? "Cardio Drill" : "Weight Block"}
                </div>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">{activeExercise.exercise.exercise.name}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {activeExercise.exercise.exercise.type === "CARDIO"
                    ? "Canlı tempo kartını takip et. Başlat, duraklat, erkenden durdur veya sıfırlayıp yeniden başlayabilirsin."
                    : "Hedef tekrar ve RIR alanları otomatik dolu geliyor. İstersen ekstra set açabilir veya bugünkü hareketi daha erken kapatabilirsin."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {activeExercise.exercise.exercise.type === "WEIGHT" ? (
                  <>
                    <div className="rounded-2xl bg-muted/40 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Hedef</p>
                      <p className="mt-2 text-2xl font-black">{activeExercise.exercise.targetSets || activeExercise.plannedSetCount}x{activeExercise.exercise.targetReps || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Önerilen Kg</p>
                      <p className="mt-2 text-2xl font-black">{activeExercise.suggestedValues.weightKg ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">RIR</p>
                      <p className="mt-2 text-2xl font-black">{activeExercise.suggestedValues.rir ?? activeExercise.exercise.targetRir ?? "-"}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl bg-muted/40 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Süre</p>
                      <p className="mt-2 text-2xl font-black">{activeExercise.exercise.durationMinutes || 1} dk</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Blok Sayısı</p>
                      <p className="mt-2 text-2xl font-black">{activeExercise.exercise.protocol?.length || 1}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Durum</p>
                      <p className="mt-2 text-lg font-bold">{activeExercise.isCompleted ? "Hazır" : "Devam ediyor"}</p>
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

      {/* Bottom bar: Completion options */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Antrenman özeti</p>
            <p className="text-sm text-muted-foreground">
              {exerciseManager.completedExercises} hareket tamamlandı, {exerciseManager.exerciseState.length - exerciseManager.completedExercises} hareket açık.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={cancelling}
              onClick={handleCancelWorkout}
              variant="outline"
              className="min-w-48 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <X className="mr-2 h-4 w-4" />
              {cancelling ? "İptal ediliyor..." : "Antrenmanı İptal Et"}
            </Button>
            <Button type="button" disabled={finishing} onClick={() => handleCompleteWorkout("ABANDONED")} variant="outline" className="min-w-52">
              {finishing ? "Kaydediliyor..." : "Yarıda Bırak ve Çık"}
            </Button>
            <Button type="button" disabled={finishing} onClick={() => handleCompleteWorkout("COMPLETED")} className="min-w-52">
              {finishing ? "Tamamlanıyor..." : "Tamamla ve Çık"}
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
    <div className="space-y-4 rounded-[32px] border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Set planı</p>
          <p className="text-sm text-muted-foreground">
            Planlanan {exercise.plannedSetCount} set. İstediğin kadar artırabilir veya bugünü erken kapatabilirsin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onAddExtraSet}>
            <Plus className="mr-2 h-4 w-4" />
            1 ekstra set
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={exercise.completedCount === 0 || exercise.isCompleted}
            onClick={onFinishEarly}
          >
            Bugün burada bitir
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {exercise.exerciseSets.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
            İlk seti gir. Geçmiş performansın varsa önerilen kilo ve tekrar otomatik getirildi.
          </div>
        ) : (
          exercise.exerciseSets.map((setItem) => (
            <div key={setItem.id} className="rounded-2xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Set {setItem.setNumber}</p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span><strong>{setItem.weightKg ?? 0}</strong> kg</span>
                <span><strong>{setItem.reps ?? 0}</strong> tekrar</span>
                <span>RIR <strong>{setItem.rir ?? 0}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {!exercise.isCompleted && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="h-4 w-4 text-emerald-600" />
            Sıradaki set: {exercise.nextSetNumber} / {exercise.plannedSetCount}
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
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          Bu hareket tamamlandı. İstersen soldan başka bir harekete geçebilir ya da aşağıdan antrenmanı kapatabilirsin.
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
  return (
    <div className="space-y-4 rounded-[32px] border border-border/60 bg-card p-6 shadow-sm">
      <CardioTimer
        storageKey={`cardio-${workoutId}-${exercise.exercise.id}`}
        durationMinutes={exercise.exercise.durationMinutes || 1}
        protocol={exercise.exercise.protocol || [{ minute: 1, speed: 0, incline: 0 }]}
        enabled={!exercise.isCompleted}
        onReachedEnd={onReachedEnd}
        onAbandon={onAbandon}
        onSecondChange={onSecondChange}
      />
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={exercise.isCompleted || savingKey === exercise.exercise.exerciseId}
          onClick={() => onSaveCardio(exercise.exercise.exerciseId, exercise.exercise.durationMinutes || 1)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {cardioReachedEnd[exercise.exercise.exerciseId] ? "Kardiyoyu kaydet" : "Kardiyoyu şimdiye kadar kaydet"}
        </Button>
      </div>
      {exercise.isCompleted && <p className="text-sm font-medium text-emerald-600">Kardiyo kaydedildi.</p>}
    </div>
  );
}
