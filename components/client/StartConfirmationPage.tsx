"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ChevronLeft, Dumbbell, Flame, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";
import Link from "next/link";

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

export function StartConfirmationPage({ assignmentId, onConfirm }: { assignmentId: string; onConfirm: () => void }) {
  const router = useRouter();
  const { warning } = useNotificationContext();
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await fetchAssignmentSummary(assignmentId);
      setSummary(data);
      setLoading(false);
    };
    fetch();
  }, [assignmentId]);

  const handleConfirm = () => {
    if (summary?.blockingWorkout && summary.blockingWorkout.status !== "IN_PROGRESS") {
      router.push(`/client/workouts/${summary.blockingWorkout.id}`);
      return;
    }

    onConfirm();
  };

  const handleCancel = () => {
    warning("Antrenman başlatılmadı.");
    router.back();
  };

  if (loading) {
    return (
      <div className="rounded-3xl border p-8 text-sm text-muted-foreground">
        Antrenman bilgileri yükleniyor...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
        Antrenman bilgileri yüklenemedi.
      </div>
    );
  }

  const weightExercises = summary.exercises.filter((e) => e.type === "WEIGHT");
  const cardioExercises = summary.exercises.filter((e) => e.type === "CARDIO");

  return (
    <div className="space-y-4 pb-28 md:space-y-6">
      {/* Mobile Header */}
      <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 md:rounded-[32px] md:p-6 shadow-sm">
        <Link href="/client/dashboard" className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-emerald-700 hover:text-emerald-900">
          <ChevronLeft className="h-4 w-4" />
          Geri
        </Link>
        <div className="mt-3 md:mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Antrenman Başlatma</p>
          <h1 className="mt-1 text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">Onay Ekranı</h1>
          <p className="mt-2 text-xs md:text-sm text-slate-600">
            Aşağıdaki antrenmanı başlatmak üzeresin. Detayları incele ve onay ver.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
        
        {/* Template Header */}
        <div className="rounded-2xl md:rounded-[32px] border border-border/60 bg-card p-4 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Template Adı</p>
              <h2 className="mt-2 text-xl md:text-2xl font-black text-foreground">{summary.templateName}</h2>
              {summary.templateDescription && (
                <p className="mt-2 text-xs md:text-sm text-muted-foreground">{summary.templateDescription}</p>
              )}
              {summary.isOneTime && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  <AlertCircle className="h-3 w-3" />
                  Tek kullanımlık
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exercises Details */}
        <div className="space-y-3 md:space-y-4">
          {weightExercises.length > 0 && (
            <div className="rounded-2xl md:rounded-[32px] border border-border/60 bg-card p-4 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="h-5 w-5 text-slate-700" />
                <p className="font-semibold text-foreground">Ağırlık Antrenmanları</p>
                <span className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-xs font-bold">
                  {weightExercises.length}
                </span>
              </div>
              <div className="space-y-3">
                {weightExercises.map((ex, idx) => (
                  <div key={ex.id} className="rounded-xl border border-slate-200/60 bg-slate-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-foreground">
                        {idx + 1}. {ex.name}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-lg bg-white p-2 border border-slate-200">
                        <p className="text-muted-foreground font-semibold uppercase tracking-[0.1em]">Set</p>
                        <p className="mt-1 text-lg font-black text-foreground">{ex.targetSets || "-"}</p>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-slate-200">
                        <p className="text-muted-foreground font-semibold uppercase tracking-[0.1em]">Tekrar</p>
                        <p className="mt-1 text-lg font-black text-foreground">{ex.targetReps || "-"}</p>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-slate-200">
                        <p className="text-muted-foreground font-semibold uppercase tracking-[0.1em]">RIR</p>
                        <p className="mt-1 text-lg font-black text-foreground">{ex.targetRir || "-"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cardioExercises.length > 0 && (
            <div className="rounded-2xl md:rounded-[32px] border border-border/60 bg-card p-4 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-600" />
                <p className="font-semibold text-foreground">Kardiyovaküler Antrenmanlar</p>
                <span className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                  {cardioExercises.length}
                </span>
              </div>
              <div className="space-y-3">
                {cardioExercises.map((ex, idx) => (
                  <div key={ex.id} className="rounded-xl border border-orange-200/60 bg-orange-50 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-foreground">
                        {idx + 1}. {ex.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs font-semibold text-orange-700">
                        <Clock className="h-3 w-3" />
                        {ex.durationMinutes || 1} dk
                      </div>
                    </div>

                    {ex.protocol && ex.protocol.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Protokol Blokları</p>
                        <div className="grid grid-cols-1 gap-2">
                          {ex.protocol.map((block, blockIdx) => (
                            <div key={blockIdx} className="rounded-lg bg-white p-2 border border-orange-200 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-600">Blok {blockIdx + 1}</span>
                                <div className="flex items-center gap-3 text-right">
                                  <span><strong>{block.durationMinutes}</strong> dk</span>
                                  <span>Hız: <strong>{block.speed.toFixed(1)}</strong></span>
                                  <span>Eğim: <strong>{block.incline.toFixed(1)}%</strong></span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="rounded-2xl md:rounded-[32px] border border-border/60 bg-card p-4 md:p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Antrenman Özeti</p>
          <div className="mt-3 grid grid-cols-2 gap-3 md:gap-4">
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-[0.1em]">Toplam Egzersiz</p>
              <p className="mt-1 text-2xl font-black text-foreground">{summary.exercises.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-[0.1em]">Egzersiz Türü</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {weightExercises.length > 0 && cardioExercises.length > 0
                  ? "Karma"
                  : weightExercises.length > 0
                  ? "Ağırlık"
                  : "Kardiyovaküler"}
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-xl md:rounded-2xl bg-blue-50 p-3 md:p-4 text-sm text-blue-900 border border-blue-200/60">
          <div className="flex gap-2 md:gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-xs md:text-sm">Antrenmanı başlattıktan sonra:</p>
              <ul className="mt-2 list-inside space-y-1 text-xs text-blue-800">
                <li>• Süresi otomatik olarak kaydedilir</li>
                <li>• İstediğin zaman duraklatabilir ve devam edebilirsin</li>
                <li>• Tamamlama veya yarıda bırakma seçeneğin olur</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 md:flex-row md:gap-3">
          <Button type="button" variant="outline" onClick={handleCancel} className="flex-1 text-xs md:text-sm py-5 md:py-6">
            Geri Dön
          </Button>
          <Button type="button" onClick={handleConfirm} className="flex-1 text-xs md:text-sm py-5 md:py-6">
            {summary.blockingWorkout?.status === "IN_PROGRESS"
              ? "Devam Et"
              : summary.blockingWorkout
              ? "Mevcut Kayda Git"
              : "Antrenmanı Başlat"}
          </Button>
        </div>

        {summary.blockingWorkout && (
          <div className="rounded-xl md:rounded-2xl border border-amber-200 bg-amber-50 p-3 md:p-4 text-xs md:text-sm text-amber-800">
            {summary.blockingWorkout.status === "IN_PROGRESS"
              ? "Bu atama için devam eden bir antrenman var. Doğrudan devam edebilirsin."
              : `Bu atama için mevcut bir antrenman kaydı var. Yeni antrenman başlatılamaz.`}
          </div>
        )}
      </div>
    </div>
  );
}
