"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { exerciseSchema, type ExerciseInput, MUSCLE_GROUPS } from "@/validations/exercise";

type Exercise = {
  id: string;
  name: string;
  type: "WEIGHT" | "CARDIO";
  targetMuscle: string | null;
};

const MUSCLE_COLORS: Record<string, string> = {
  Gogus: "#3B82F6",
  Sirt: "#8B5CF6",
  Bacak: "#22C55E",
  Omuz: "#F59E0B",
  Kol: "#EF4444",
  Core: "#F97316",
  Diger: "#94A3B8",
};

export default function CoachExercisesPage() {
  const { push } = useNotificationContext();
  const [items, setItems] = useState<Exercise[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingMuscle, setEditingMuscle] = useState<string | null>(null);

  const form = useForm<ExerciseInput>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: { name: "", type: "WEIGHT", targetMuscle: null },
  });

  const load = async () => {
    const response = await fetch("/api/coach/exercises");
    const data = await response.json().catch(() => ({}));
    setItems(data.exercises ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (values: ExerciseInput) => {
    setSubmitting(true);
    const response = await fetch("/api/coach/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);

    if (!response.ok) {
      push("Egzersiz eklenemedi.");
      return;
    }

    form.reset({ name: "", type: values.type, targetMuscle: null });
    push("Egzersiz eklendi.");
    await load();
  };

  const removeExercise = async (id: string) => {
    setDeletingId(id);
    const response = await fetch(`/api/coach/exercises/${id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      push(data.error || "Egzersiz silinemedi.");
      return;
    }

    push("Egzersiz silindi.");
    await load();
  };

  const updateMuscle = async (id: string, targetMuscle: string | null) => {
    const response = await fetch(`/api/coach/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetMuscle }),
    });

    if (!response.ok) {
      push("Guncellenemedi.");
      return;
    }

    setEditingMuscle(null);
    await load();
  };

  const typeLabel = (type: string) => (type === "WEIGHT" ? "Agirlik" : "Kardiyo");

  return (
    <div className="space-y-5 pb-[calc(var(--app-mobile-nav-height)+2rem)] md:pb-10">
      <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-sm md:px-6 md:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">
              Exercise Library
            </div>
            <h1 className="text-[26px] font-black tracking-[-0.04em] text-slate-900 md:text-[30px]">
              Egzersiz kutuphaneni temiz tut
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Kas grubu etiketleri ile hacim analizi, program olusturma ve raporlama daha net calisir.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-[320px]">
            {[
              { label: "Toplam", value: String(items.length) },
              { label: "Etiketli", value: String(items.filter((item) => item.targetMuscle).length) },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{metric.label}</div>
                <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          <div>
            <h2 className="text-lg font-black text-slate-900">Yeni egzersiz ekle</h2>
            <p className="text-sm text-slate-500">Tek kolon mobil, daha yogun desktop form duzeni.</p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(create)} className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_180px_180px_auto]">
          <div>
            <Input placeholder="Egzersiz adi" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <select {...form.register("type")} className="h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm">
            <option value="WEIGHT">Agirlik</option>
            <option value="CARDIO">Kardiyo</option>
          </select>

          <select {...form.register("targetMuscle")} className="h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm">
            <option value="">Kas grubu sec</option>
            {MUSCLE_GROUPS.map((muscle) => (
              <option key={muscle} value={muscle}>
                {muscle}
              </option>
            ))}
          </select>

          <Button type="submit" disabled={submitting} className="w-full md:w-auto">
            Ekle
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            Henuz egzersiz yok. Ilk egzersizi ekleyin.
          </div>
        ) : (
          items.map((exercise) => (
            <div
              key={exercise.id}
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
              style={{ borderLeftWidth: exercise.targetMuscle ? 4 : 1, borderLeftColor: exercise.targetMuscle ? (MUSCLE_COLORS[exercise.targetMuscle] ?? "#94A3B8") : undefined }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-slate-900">{exercise.name}</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {typeLabel(exercise.type)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  {editingMuscle === exercise.id ? (
                    <select
                      autoFocus
                      defaultValue={exercise.targetMuscle ?? ""}
                      onBlur={(event) => void updateMuscle(exercise.id, event.target.value || null)}
                      onChange={(event) => void updateMuscle(exercise.id, event.target.value || null)}
                      className="h-10 rounded-xl border px-3 text-sm focus:outline-none"
                    >
                      <option value="">Seciniz</option>
                      {MUSCLE_GROUPS.map((muscle) => (
                        <option key={muscle} value={muscle}>
                          {muscle}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingMuscle(exercise.id)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition hover:opacity-85"
                      style={{
                        background: exercise.targetMuscle ? (MUSCLE_COLORS[exercise.targetMuscle] ?? "#94A3B8") : "#E2E8F0",
                        color: exercise.targetMuscle ? "#FFFFFF" : "#64748B",
                      }}
                    >
                      <Tag className="h-3.5 w-3.5" />
                      {exercise.targetMuscle ?? "Etiket ekle"}
                    </button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-start px-0 text-red-500 hover:text-red-600"
                    disabled={deletingId === exercise.id}
                    onClick={() => void removeExercise(exercise.id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Sil
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
