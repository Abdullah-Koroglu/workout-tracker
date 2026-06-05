"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ChevronLeft, Clock, Dumbbell, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";

type TemplateExercise = {
  id: string;
  name: string;
  type: "WEIGHT" | "CARDIO";
  targetSets?: number | null;
  targetReps?: number | null;
  targetRir?: number | null;
  durationMinutes?: number | null;
  protocol?: Array<{
    durationMinutes: number;
    speed: number;
    incline: number;
  }> | null;
};

type AssignmentSummary = {
  id: string;
  templateName: string;
  templateDescription?: string;
  blockingWorkout?: {
    id: string;
    status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
    startedAt: string;
    finishedAt: string | null;
  } | null;
  exercises: TemplateExercise[];
  isOneTime: boolean;
};

async function fetchAssignmentSummary(assignmentId: string): Promise<AssignmentSummary | null> {
  if (!assignmentId) return null;

  try {
    const response = await fetch(`/api/assignments/${assignmentId}/summary`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export function StartConfirmationPage({
  assignmentId,
  onConfirm,
}: {
  assignmentId: string;
  onConfirm: () => void;
}) {
  const router = useRouter();
  const { warning } = useNotificationContext();
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAssignmentSummary(assignmentId);
      setSummary(data);
      setLoading(false);
    };

    void load();
  }, [assignmentId]);

  const handleConfirm = () => {
    if (summary?.blockingWorkout && summary.blockingWorkout.status !== "IN_PROGRESS") {
      router.push(`/client/workouts/${summary.blockingWorkout.id}`);
      return;
    }

    onConfirm();
  };

  const handleCancel = () => {
    warning("Antrenman baslatilmadi.");
    router.back();
  };

  if (loading) {
    return <div className="rounded-3xl border p-8 text-sm text-muted-foreground">Antrenman bilgileri yukleniyor...</div>;
  }

  if (!summary) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
        Antrenman bilgileri yuklenemedi.
      </div>
    );
  }

  const weightExercises = summary.exercises.filter((exercise) => exercise.type === "WEIGHT");
  const cardioExercises = summary.exercises.filter((exercise) => exercise.type === "CARDIO");

  return (
    <div className="space-y-5 pb-[calc(var(--app-mobile-nav-height)+2rem)] md:space-y-6 md:pb-12">
      <div className="overflow-hidden rounded-[28px] border border-black/10 bg-gradient-to-br from-surface via-white to-primary/10 p-4 shadow-sm md:p-6">
        <Link href="/client/dashboard" className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 md:text-sm">
          <ChevronLeft className="h-4 w-4" />
          Geri
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Workout Briefing</p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900 md:text-4xl">
              Antrenmana hazirsin
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Asagidaki plan baslamak uzere. Egzersiz dagilimini kontrol et, ardindan oturumu baslat.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-[320px]">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 backdrop-blur">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Toplam</div>
              <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">{summary.exercises.length}</div>
              <div className="mt-1 text-xs text-slate-500">egzersiz</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 backdrop-blur">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Tip</div>
              <div className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-900">
                {weightExercises.length > 0 && cardioExercises.length > 0
                  ? "Karma"
                  : weightExercises.length > 0
                    ? "Agirlik"
                    : "Kardiyo"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 md:space-y-5">
        <div className="rounded-[28px] border border-border/60 bg-card p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Antrenman adi</p>
              <h2 className="mt-2 text-xl font-black text-foreground md:text-2xl">{summary.templateName}</h2>
              {summary.templateDescription ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary.templateDescription}</p>
              ) : null}
            </div>

            {summary.isOneTime ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                <AlertCircle className="h-3.5 w-3.5" />
                Tek kullanimlik
              </div>
            ) : null}
          </div>
        </div>

        {weightExercises.length > 0 ? (
          <div className="rounded-[28px] border border-border/60 bg-card p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-secondary" />
              <p className="font-semibold text-foreground">Agirlik egzersizleri</p>
              <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                {weightExercises.length}
              </span>
            </div>

            <div className="space-y-3">
              {weightExercises.map((exercise, index) => (
                <div key={exercise.id} className="rounded-2xl border border-slate-200/60 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {index + 1}. {exercise.name}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                      <p className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">Set</p>
                      <p className="mt-1 text-lg font-black text-foreground">{exercise.targetSets || "-"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                      <p className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">Tekrar</p>
                      <p className="mt-1 text-lg font-black text-foreground">{exercise.targetReps || "-"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                      <p className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">RIR</p>
                      <p className="mt-1 text-lg font-black text-foreground">{exercise.targetRir || "-"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {cardioExercises.length > 0 ? (
          <div className="rounded-[28px] border border-border/60 bg-card p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">Kardiyo egzersizleri</p>
              <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {cardioExercises.length}
              </span>
            </div>

            <div className="space-y-3">
              {cardioExercises.map((exercise, index) => (
                <div key={exercise.id} className="rounded-2xl border border-primary/25 bg-primary/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {index + 1}. {exercise.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      {exercise.durationMinutes || 1} dk
                    </div>
                  </div>

                  {exercise.protocol && exercise.protocol.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Protokol bloklari</p>
                      <div className="space-y-2">
                        {exercise.protocol.map((block, blockIndex) => (
                          <div key={blockIndex} className="rounded-xl border border-primary/20 bg-white p-2.5 text-xs">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <span className="font-semibold text-slate-600">Blok {blockIndex + 1}</span>
                              <div className="flex flex-wrap items-center gap-3 text-slate-600">
                                <span>
                                  <strong>{block.durationMinutes}</strong> dk
                                </span>
                                <span>
                                  Hiz: <strong>{block.speed.toFixed(1)}</strong>
                                </span>
                                <span>
                                  Egim: <strong>{block.incline.toFixed(1)}%</strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-blue-200/60 bg-blue-50 p-4 text-sm text-blue-900">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold">Antrenmani baslattiktan sonra:</p>
              <ul className="mt-2 space-y-1 text-xs text-blue-800">
                <li>Sure otomatik olarak kaydedilir.</li>
                <li>Istedigin zaman duraklatip devam edebilirsin.</li>
                <li>Tamamla veya yarida birak secenekleri her zaman acik kalir.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:gap-3">
          <Button type="button" variant="outline" onClick={handleCancel} className="flex-1 border-secondary/30 py-5 text-xs hover:bg-secondary/5 md:py-6 md:text-sm">
            Geri don
          </Button>
          <Button type="button" onClick={handleConfirm} className="flex-1 py-5 text-xs md:py-6 md:text-sm">
            {summary.blockingWorkout?.status === "IN_PROGRESS"
              ? "Devam et"
              : summary.blockingWorkout
                ? "Mevcut kayda git"
                : "Antrenmani baslat"}
          </Button>
        </div>

        {summary.blockingWorkout ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 md:text-sm">
            {summary.blockingWorkout.status === "IN_PROGRESS"
              ? "Bu atama icin devam eden bir antrenman var. Dogrudan devam edebilirsin."
              : "Bu atama icin mevcut bir antrenman kaydi var. Yeni antrenman baslatilamaz."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
