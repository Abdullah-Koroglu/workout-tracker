"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SavePayload = {
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number;
};

export function WorkoutSetForm({
  setNumber,
  defaultValues,
  disabled,
  onSave
}: {
  setNumber: number;
  defaultValues?: { weightKg?: number | null; reps?: number | null; rir?: number | null };
  disabled?: boolean;
  onSave: (payload: SavePayload) => Promise<void>;
}) {
  const [weightKg, setWeightKg] = useState(defaultValues?.weightKg?.toString() || "");
  const [reps, setReps] = useState(defaultValues?.reps?.toString() || "");
  const [rir, setRir] = useState(defaultValues?.rir?.toString() || "");

  useEffect(() => {
    setWeightKg(defaultValues?.weightKg?.toString() || "");
    setReps(defaultValues?.reps?.toString() || "");
    setRir(defaultValues?.rir?.toString() || "");
  }, [defaultValues?.reps, defaultValues?.rir, defaultValues?.weightKg]);

  const submit = async () => {
    const numericWeight = Number(weightKg);
    const numericReps = Number(reps);
    const numericRir = Number(rir);

    if (!Number.isFinite(numericWeight) || !Number.isFinite(numericReps) || !Number.isFinite(numericRir)) {
      return;
    }

    await onSave({
      setNumber,
      weightKg: numericWeight,
      reps: numericReps,
      rir: numericRir
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Set {setNumber}</p>
        <p className="text-xs text-muted-foreground">Önerilen değerleri düzenleyebilirsin</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="Kg" disabled={disabled} />
        <Input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="Tekrar" disabled={disabled} />
        <Input value={rir} onChange={(e) => setRir(e.target.value)} placeholder="RIR" disabled={disabled} />
        <Button type="button" onClick={submit} disabled={disabled || !weightKg || !reps || !rir}>
          Seti Kaydet
        </Button>
      </div>
    </div>
  );
}
