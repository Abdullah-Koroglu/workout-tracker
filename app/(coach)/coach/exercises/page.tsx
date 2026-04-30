"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  "Göğüs": "#3B82F6",
  "Sırt": "#8B5CF6",
  "Bacak": "#22C55E",
  "Omuz": "#F59E0B",
  "Kol": "#EF4444",
  "Core": "#F97316",
  "Diğer": "#94A3B8",
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
    const res = await fetch("/api/coach/exercises");
    const data = await res.json();
    setItems(data.exercises ?? []);
  };

  useEffect(() => { load(); }, []);

  const create = async (values: ExerciseInput) => {
    setSubmitting(true);
    const res = await fetch("/api/coach/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) { push("Egzersiz eklenemedi."); return; }
    form.reset({ name: "", type: values.type, targetMuscle: null });
    push("Egzersiz eklendi.");
    await load();
  };

  const removeExercise = async (id: string) => {
    setDeletingId(id);
    const res = await fetch(`/api/coach/exercises/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); push(d.error || "Egzersiz silinemedi."); return; }
    push("Egzersiz silindi.");
    await load();
  };

  const updateMuscle = async (id: string, targetMuscle: string | null) => {
    const res = await fetch(`/api/coach/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetMuscle }),
    });
    if (!res.ok) { push("Güncellenemedi."); return; }
    setEditingMuscle(null);
    await load();
  };

  const typeLabel = (t: string) => t === "WEIGHT" ? "Ağırlık" : "Kardiyo";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800">Egzersiz Kütüphanesi</h1>
        <p className="mt-0.5 text-sm text-slate-400">Kas grubu etiketleyerek hacim analizini etkinleştirin.</p>
      </div>

      {/* Create form */}
      <form
        onSubmit={form.handleSubmit(create)}
        className="grid gap-2 rounded-xl border p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <div>
          <Input placeholder="Egzersiz adı" {...form.register("name")} />
          {form.formState.errors.name && <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>}
        </div>

        <select
          {...form.register("type")}
          className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="WEIGHT">Ağırlık</option>
          <option value="CARDIO">Kardiyo</option>
        </select>

        <select
          {...form.register("targetMuscle")}
          className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Kas Grubu Seç</option>
          {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <Button type="submit" disabled={submitting} className="md:self-start">
          Ekle
        </Button>
      </form>

      {/* Exercise list */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Henüz egzersiz yok. İlk egzersizi ekleyin.
          </div>
        ) : (
          items.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center gap-3 rounded-xl border bg-white p-3"
              style={{ borderLeft: ex.targetMuscle ? `3px solid ${MUSCLE_COLORS[ex.targetMuscle] ?? "#94A3B8"}` : undefined }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{ex.name}</p>
                <p className="text-xs text-slate-400">{typeLabel(ex.type)}</p>
              </div>

              {/* Muscle tag / inline picker */}
              {editingMuscle === ex.id ? (
                <select
                  autoFocus
                  defaultValue={ex.targetMuscle ?? ""}
                  onBlur={(e) => updateMuscle(ex.id, e.target.value || null)}
                  onChange={(e) => updateMuscle(ex.id, e.target.value || null)}
                  className="h-8 rounded-lg border px-2 text-xs focus:outline-none"
                >
                  <option value="">— Seçiniz —</option>
                  {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <button
                  onClick={() => setEditingMuscle(ex.id)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-black text-white transition hover:opacity-80"
                  style={{ background: ex.targetMuscle ? (MUSCLE_COLORS[ex.targetMuscle] ?? "#94A3B8") : "#E2E8F0", color: ex.targetMuscle ? "#fff" : "#94A3B8" }}
                >
                  {ex.targetMuscle ?? "Etiket Ekle"}
                </button>
              )}

              <Button
                type="button"
                variant="ghost"
                className="text-red-400 hover:text-red-600"
                disabled={deletingId === ex.id}
                onClick={() => removeExercise(ex.id)}
              >
                Sil
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
