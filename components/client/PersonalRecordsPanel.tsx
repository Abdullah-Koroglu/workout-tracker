"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Trophy } from "lucide-react";

interface PR {
  id: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  estimatedOneRM: number | null;
  achievedAt: string;
  exercise: { id: string; name: string; targetMuscle: string | null } | null;
}

interface Props {
  clientId?: string;
}

export function PersonalRecordsPanel({ clientId }: Props) {
  const [records, setRecords] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = clientId ? `?clientId=${clientId}` : "";
    fetch(`/api/personal-records${qs}`)
      .then((r) => r.json())
      .then((d) => setRecords(d.records ?? []))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />;
  if (records.length === 0) return null;

  // Keep best per exercise
  const best = new Map<string, PR>();
  for (const r of records) {
    const k = r.exerciseId;
    const prev = best.get(k);
    if (!prev || (r.estimatedOneRM ?? 0) > (prev.estimatedOneRM ?? 0)) best.set(k, r);
  }
  const list = Array.from(best.values()).slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50">
          <Trophy className="h-4 w-4 text-rose-500" />
        </div>
        <h2 className="text-base font-black text-slate-800">Kişisel Rekorlar</h2>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white border border-slate-100 p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 text-white">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-800 truncate">{r.exercise?.name ?? "—"}</p>
              <p className="text-[11px] text-slate-500">
                {r.weightKg}kg × {r.reps}
                {r.estimatedOneRM ? <> · ~1RM {r.estimatedOneRM}kg</> : null}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
