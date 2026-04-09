"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { ExerciseRow } from "@/components/coach/ExerciseRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { exerciseSchema, type ExerciseInput } from "@/validations/exercise";

type Exercise = {
  id: string;
  name: string;
  type: "WEIGHT" | "CARDIO";
};

export default function CoachExercisesPage() {
  const { push } = useNotificationContext();
  const [items, setItems] = useState<Exercise[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<ExerciseInput>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: "",
      type: "WEIGHT"
    }
  });

  const load = async () => {
    const res = await fetch("/api/coach/exercises");
    const data = await res.json();
    setItems(data.exercises || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (values: ExerciseInput) => {
    setSubmitting(true);

    const response = await fetch("/api/coach/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    setSubmitting(false);

    if (!response.ok) {
      push("Egzersiz eklenemedi.");
      return;
    }

    form.reset({ name: "", type: values.type });
    push("Egzersiz eklendi.");
    await load();
  };

  const removeExercise = async (exerciseId: string) => {
    setDeletingId(exerciseId);

    const response = await fetch(`/api/coach/exercises/${exerciseId}`, {
      method: "DELETE"
    });

    setDeletingId(null);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      push(data.error || "Egzersiz silinemedi.");
      return;
    }

    push("Egzersiz silindi.");
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Egzersiz Kütüphanesi</h1>
      <form onSubmit={form.handleSubmit(create)} className="grid gap-2 rounded-xl border p-4 md:grid-cols-[2fr_1fr_auto]">
        <div className="space-y-1">
          <Input placeholder="Egzersiz adı" {...form.register("name")} />
          {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <select
            {...form.register("type")}
            className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="WEIGHT">WEIGHT</option>
            <option value="CARDIO">CARDIO</option>
          </select>
          {form.formState.errors.type && <p className="text-xs text-red-500">Geçerli tür seçin.</p>}
        </div>
        <Button type="submit" disabled={submitting} className="md:self-start">
          Egzersiz Ekle
        </Button>
      </form>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Henüz egzersiz yok. İlk egzersizi ekleyin.
          </div>
        ) : (
          items.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              name={exercise.name}
              type={exercise.type}
              action={
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600"
                  disabled={deletingId === exercise.id}
                  onClick={() => removeExercise(exercise.id)}
                >
                  Sil
                </Button>
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
