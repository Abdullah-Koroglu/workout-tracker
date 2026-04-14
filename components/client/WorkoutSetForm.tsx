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
    <div className="space-y-3 rounded-lg md:rounded-2xl border border-border/60 bg-card/70 p-3 md:p-4 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <p className="text-xs md:text-sm font-semibold text-foreground">Set {setNumber} Bilgisi</p>
        <p className="text-xs text-muted-foreground">Değerleri düzenleyebilirsin</p>
      </div>

      <div className="grid gap-2 grid-cols-3 md:grid-cols-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">Kg</label>
          <Input 
            value={weightKg} 
            onChange={(e) => setWeightKg(e.target.value)} 
            placeholder="0" 
            disabled={disabled}
            type="number"
            inputMode="decimal"
            className="text-center text-lg md:text-base h-12 md:h-10 font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">Rep</label>
          <Input 
            value={reps} 
            onChange={(e) => setReps(e.target.value)} 
            placeholder="0" 
            disabled={disabled}
            type="number"
            inputMode="numeric"
            className="text-center text-lg md:text-base h-12 md:h-10 font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">RIR</label>
          <Input 
            value={rir} 
            onChange={(e) => setRir(e.target.value)} 
            placeholder="0" 
            disabled={disabled}
            type="number"
            inputMode="numeric"
            className="text-center text-lg md:text-base h-12 md:h-10 font-bold"
          />
        </div>
        <div className="flex flex-col justify-end">
          <Button 
            type="button" 
            onClick={submit} 
            disabled={disabled || !weightKg || !reps || !rir}
            className="text-xs md:text-sm py-5 md:py-6 h-12 md:h-10 font-bold"
          >
            <span className="hidden md:inline">Kaydet</span>
            <span className="md:hidden">✓</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
