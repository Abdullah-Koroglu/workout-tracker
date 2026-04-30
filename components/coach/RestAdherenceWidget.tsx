"use client";

import { Clock, AlertTriangle, CheckCircle2, Info } from "lucide-react";

type SetWithRest = {
  id: string;
  setNumber: number;
  exercise: { name: string; type: string };
  actualRestSeconds: number | null;
  prescribedRestSeconds: number | null;
  completed: boolean;
};

type Props = { sets: SetWithRest[] };

const OVER_THRESHOLD = 0.3; // > 30% longer = violation

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}d ${s}s` : `${s}s`;
}

function adherenceStatus(actual: number, prescribed: number) {
  const ratio = actual / prescribed;
  if (ratio > 1 + OVER_THRESHOLD) return "over" as const;
  if (ratio < 0.5) return "under" as const;
  return "ok" as const;
}

export function RestAdherenceWidget({ sets }: Props) {
  // Only weight sets that have both actual and prescribed rest
  const relevant = sets.filter(
    (s) =>
      s.exercise.type === "WEIGHT" &&
      s.completed &&
      s.actualRestSeconds !== null &&
      s.prescribedRestSeconds !== null
  );

  if (relevant.length === 0) return null;

  const violations = relevant.filter((s) => {
    const status = adherenceStatus(s.actualRestSeconds!, s.prescribedRestSeconds!);
    return status === "over";
  });

  const adherenceRate = Math.round(
    ((relevant.length - violations.length) / relevant.length) * 100
  );

  return (
    <div
      className="mt-4 rounded-2xl"
      style={{ border: "1px solid rgba(0,0,0,0.06)", background: "#FAFAFA" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Clock className="h-4 w-4 text-slate-400" />
        <span className="text-[13px] font-black text-slate-700">Dinlenme Süresi Analizi</span>
        <span
          className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-black"
          style={{
            background: adherenceRate >= 80 ? "#22C55E18" : adherenceRate >= 50 ? "#F59E0B18" : "#EF444418",
            color: adherenceRate >= 80 ? "#16A34A" : adherenceRate >= 50 ? "#D97706" : "#DC2626",
          }}
        >
          Uyum: %{adherenceRate}
        </span>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: "Toplam Set", value: relevant.length, color: "#1A365D" },
          {
            label: "Uyumlu",
            value: relevant.length - violations.length,
            color: "#22C55E",
          },
          { label: "Aşım", value: violations.length, color: violations.length > 0 ? "#EF4444" : "#22C55E" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center py-3">
            <span className="text-[22px] font-black" style={{ color: item.color }}>
              {item.value}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Set rows */}
      <div className="divide-y divide-slate-100">
        {relevant.map((s) => {
          const status = adherenceStatus(s.actualRestSeconds!, s.prescribedRestSeconds!);
          const diff = s.actualRestSeconds! - s.prescribedRestSeconds!;

          return (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
              {/* Status icon */}
              {status === "ok" ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
              ) : status === "over" ? (
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
              ) : (
                <Info className="h-4 w-4 flex-shrink-0 text-amber-400" />
              )}

              {/* Exercise + set */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-700 truncate">
                  {s.exercise.name}
                  <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                    Set {s.setNumber}
                  </span>
                </p>
              </div>

              {/* Times */}
              <div className="flex items-center gap-3 text-right flex-shrink-0">
                <div>
                  <p className="text-[10px] text-slate-400">Reçete</p>
                  <p className="text-[12px] font-bold text-slate-600">
                    {fmt(s.prescribedRestSeconds!)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Gerçek</p>
                  <p
                    className="text-[12px] font-bold"
                    style={{
                      color:
                        status === "over"
                          ? "#EF4444"
                          : status === "under"
                          ? "#F59E0B"
                          : "#22C55E",
                    }}
                  >
                    {fmt(s.actualRestSeconds!)}
                  </p>
                </div>
                {diff !== 0 && (
                  <div
                    className="rounded-full px-2 py-0.5 text-[10px] font-black"
                    style={{
                      background: status === "over" ? "#FEE2E2" : "#FEF3C7",
                      color: status === "over" ? "#DC2626" : "#D97706",
                    }}
                  >
                    {diff > 0 ? "+" : ""}
                    {fmt(Math.abs(diff))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
