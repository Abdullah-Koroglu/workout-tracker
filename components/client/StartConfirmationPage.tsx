"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ChevronLeft, Dumbbell, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";
import Link from "next/link";

type AssignmentSummary = {
  id: string;
  templateName: string;
  blockingWorkout?: {
    id: string;
    status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
    startedAt: string;
    finishedAt: string | null;
  } | null;
  exercises: Array<{
    id: string;
    name: string;
    type: "WEIGHT" | "CARDIO";
  }>;
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
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="overflow-hidden rounded-[32px] border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 shadow-sm">
        <Link href="/client/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900">
          <ChevronLeft className="h-4 w-4" />
          Dashboard'a dön
        </Link>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Antrenman Başlatma</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Onay ekranı</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Aşağıdaki antrenmanı başlatmak üzeresin. Lütfen detayları kontrol et ve onayla.
          </p>
        </div>
      </div>

      {/* Confirmation Card */}
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Template Info */}
        <div className="rounded-[32px] border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Template Adı</p>
              <h2 className="mt-2 text-2xl font-black text-foreground">{summary.templateName}</h2>
              {summary.isOneTime && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  <AlertCircle className="h-3 w-3" />
                  Tek kullanımlık
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exercises Summary */}
        <div className="rounded-[32px] border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Egzersizler</p>
          <p className="mt-1 text-sm text-muted-foreground">Toplam {summary.exercises.length} egzersiz</p>

          <div className="mt-4 space-y-3">
            {weightExercises.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  <Dumbbell className="mr-2 inline h-3 w-3" />
                  Ağırlık Antrenmanları ({weightExercises.length})
                </p>
                <div className="space-y-2 pl-5">
                  {weightExercises.map((ex) => (
                    <div key={ex.id} className="text-sm text-foreground">
                      • {ex.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cardioExercises.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  <Flame className="mr-2 inline h-3 w-3" />
                  Kardiyolar ({cardioExercises.length})
                </p>
                <div className="space-y-2 pl-5">
                  {cardioExercises.map((ex) => (
                    <div key={ex.id} className="text-sm text-foreground">
                      • {ex.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold">Antrenmanı başlattıktan sonra:</p>
              <ul className="mt-2 list-inside space-y-1 text-xs text-blue-800">
                <li>• Süresi otomatik olarak kaydedilecek</li>
                <li>• İstediğin zaman iptal edebileceksin</li>
                <li>• Tamamlama veya yarıda bırakma seçeneğin olacak</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
            Geri Dön
          </Button>
          <Button type="button" onClick={handleConfirm} className="flex-1">
            {summary.blockingWorkout?.status === "IN_PROGRESS"
              ? "Devam Eden Antrenmana Gir"
              : summary.blockingWorkout
              ? "Mevcut Antrenmana Git"
              : "Antrenmanı Başlat"}
          </Button>
        </div>

        {summary.blockingWorkout && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {summary.blockingWorkout.status === "IN_PROGRESS"
              ? "Bu atama için devam eden bir antrenman var. Doğrudan içeri girip devam edebilirsin."
              : `Bu atama için mevcut bir antrenman kaydı var (${summary.blockingWorkout.status}). Yeni antrenman başlatılamaz, mevcut kayda yönlendiriliyorsun.`}
          </div>
        )}
      </div>
    </div>
  );
}
