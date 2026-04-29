"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";

const LABELS: Record<number, string> = {
  1: "Çok kolay", 2: "Kolay", 3: "Hafif",
  4: "Orta-Düşük", 5: "Orta", 6: "Orta-Zor",
  7: "Zor", 8: "Çok Zor", 9: "Maksimum", 10: "Her şeyi verdim",
};

function scoreColor(n: number): string {
  if (n <= 3) return "#22C55E";
  if (n <= 5) return "#84CC16";
  if (n <= 7) return "#F59E0B";
  if (n <= 9) return "#F97316";
  return "#EF4444";
}

export function IntensityScoreWidget({
  workoutId,
  initialScore,
}: {
  workoutId: string;
  initialScore: number | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(initialScore);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!initialScore);

  const handleSelect = async (n: number) => {
    if (saving) return;
    setSelected(n);
    setSaving(true);
    try {
      const res = await fetch(`/api/client/workouts/${workoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intensityScore: n }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="rounded-2xl bg-white p-5"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "rgba(249,115,22,0.1)" }}
          >
            <Zap className="h-4 w-4 text-orange-500" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Yoğunluk Skoru
          </h3>
        </div>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-orange-400" />}
        {saved && !saving && selected && (
          <span
            className="text-[11px] font-black rounded-full px-2.5 py-1"
            style={{
              background: scoreColor(selected) + "18",
              color: scoreColor(selected),
            }}
          >
            {selected}/10 — {LABELS[selected]}
          </span>
        )}
      </div>

      {/* Score buttons */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = selected === n;
          const color = scoreColor(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => void handleSelect(n)}
              disabled={saving}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black transition-all disabled:cursor-not-allowed"
              style={
                active
                  ? {
                      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                      color: "#fff",
                      boxShadow: `0 4px 12px ${color}55`,
                      transform: "scale(1.08)",
                    }
                  : selected && n < selected
                  ? { background: color + "18", color }
                  : { background: "#F8FAFC", color: "#CBD5E1", border: "1px solid #F1F5F9" }
              }
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Empty prompt */}
      {!selected && (
        <p className="mt-3 text-[12px] text-slate-400">
          Bu antrenman nasıl geçti? Bir skor seç.
        </p>
      )}
    </div>
  );
}
