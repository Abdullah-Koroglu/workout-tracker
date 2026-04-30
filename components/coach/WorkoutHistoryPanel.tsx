"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { CommentBox } from "@/components/coach/CommentBox";
import { RestAdherenceWidget } from "@/components/coach/RestAdherenceWidget";
import type { TimelineItem } from "@/lib/coach-timeline";

const statusConfig: Record<
  "IN_PROGRESS" | "COMPLETED" | "ABANDONED",
  { label: string; emoji: string; bg: string; color: string; badgeBg: string }
> = {
  COMPLETED:   { label: "Tamamlandı", emoji: "✅", bg: "#22C55E18", color: "#22C55E", badgeBg: "#22C55E18" },
  ABANDONED:   { label: "Yapılmadı",  emoji: "⚠️", bg: "#EF444418", color: "#EF4444", badgeBg: "#EF444418" },
  IN_PROGRESS: { label: "Devam ediyor", emoji: "⏳", bg: "#EF444418", color: "#EF4444", badgeBg: "#EF444418" },
};

export function WorkoutHistoryPanel({ items }: { items: TimelineItem[] }) {
  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div
        className="rounded-[18px] p-6 text-center text-sm"
        style={{
          background: "#F8FAFC",
          border: "1.5px dashed #E2E8F0",
          color: "#94A3B8",
        }}
      >
        Bu danışan için antrenman geçmişi bulunmuyor.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => {
        // ── Missed assignment card ────────────────────────────────────────────
        if (item.type === "missed") {
          return (
            <div
              key={`missed-${item.id}`}
              className="rounded-[18px] overflow-hidden"
              style={{
                background: "#FFF1F2",
                boxShadow: "0 2px 16px rgba(239,68,68,0.08), 0 1px 3px rgba(239,68,68,0.06)",
                border: "1px solid #FECACA",
              }}
            >
              <div className="flex items-center gap-3 p-3.5">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "#EF444418" }}
                >
                  ⚠️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate" style={{ color: "#991B1B" }}>
                    {item.templateName}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#B91C1C" }}>
                    Planlanan gün geçti: {new Date(item.scheduledFor).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold rounded-full px-2.5 py-1"
                  style={{ background: "#FEE2E2", color: "#B91C1C" }}
                >
                  Yapılmadı
                </span>
              </div>
            </div>
          );
        }

        // ── Workout card ──────────────────────────────────────────────────────
        const workout = item;
        const isOpen = openWorkoutId === workout.id;
        const cfg = statusConfig[workout.status];
        const date = new Date(workout.startedAt).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const completedSets = workout.sets.filter((s) => s.completed).length;
        const totalSets = workout.sets.length;
        const totalVolume = workout.sets.reduce((sum, set) => {
          if (!set.completed || set.weightKg == null || set.reps == null) return sum;
          return sum + set.weightKg * set.reps;
        }, 0);
        const completionPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
        const totalCardioMinutes = workout.sets.reduce((sum, set) => {
          if (set.exercise.type !== "CARDIO") return sum;
          if (set.durationMinutes != null) return sum + set.durationMinutes;
          if (set.durationSeconds != null) return sum + Math.round(set.durationSeconds / 60);
          return sum;
        }, 0);
        const startedAt = new Date(workout.startedAt);
        const finishedAt = workout.finishedAt ? new Date(workout.finishedAt) : null;
        const scheduledFor = new Date(workout.assignment.scheduledFor);

        return (
          <div
            key={workout.id}
            className="rounded-[18px] overflow-hidden"
            style={{
              background: "#fff",
              boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {/* Row */}
            <div className="flex items-center gap-3 p-3.5">
              {/* Status Icon */}
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: cfg.bg }}
              >
                {cfg.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold truncate" style={{ color: "#1E293B" }}>
                  {workout.template.name}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
                  {date}
                  {totalSets > 0 && ` · ${completedSets}/${totalSets} set`}
                  {workout.durationMinutes !== null && ` · ${workout.durationMinutes} dk`}
                </div>
              </div>

              {/* Badge + Toggle */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-[10px] font-bold rounded-full px-2.5 py-1"
                  style={{ background: cfg.badgeBg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <button
                  onClick={() => setOpenWorkoutId(isOpen ? null : workout.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: "#F1F5F9", color: "#94A3B8" }}
                >
                  {isOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Detail */}
            {isOpen && (
              <div
                className="px-3.5 pb-4 pt-1 flex flex-col gap-3"
                style={{ borderTop: "1px solid #F1F5F9" }}
              >
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "Durum", value: cfg.label },
                    { label: "Planlanan Gün", value: scheduledFor.toLocaleDateString("tr-TR") },
                    { label: "Başlangıç", value: startedAt.toLocaleString("tr-TR") },
                    { label: "Bitiş", value: finishedAt ? finishedAt.toLocaleString("tr-TR") : "-" },
                    { label: "Tamamlanma", value: `%${completionPercent}` },
                    { label: "Yoğunluk", value: workout.intensityScore != null ? `${workout.intensityScore}/10` : "-" },
                    { label: "Toplam Hacim", value: `${Math.round(totalVolume)} kg` },
                    { label: "Kardiyo Süresi", value: `${totalCardioMinutes} dk` },
                    { label: "Atama ID", value: workout.assignment.id },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl px-3 py-2"
                      style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                        {item.label}
                      </div>
                      <div className="mt-0.5 break-all text-[12px] font-semibold" style={{ color: "#1E293B" }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {workout.template.description && (
                  <div className="rounded-xl px-3 py-2.5" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                      Program Açıklaması
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "#334155" }}>
                      {workout.template.description}
                    </p>
                  </div>
                )}

                {/* Sets */}
                {workout.sets.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: "#94A3B8" }}
                    >
                      Setler
                    </div>
                    {workout.sets.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl px-3 py-2"
                        style={{ background: "#F8FAFC" }}
                      >
                        <div>
                          <span className="text-[13px] font-semibold" style={{ color: "#1E293B" }}>
                            {s.exercise.name}
                          </span>
                          <span className="text-[11px] ml-1.5" style={{ color: "#94A3B8" }}>
                            Set {s.setNumber}
                          </span>
                        </div>
                        <div className="text-[12px] font-semibold" style={{ color: "#475569" }}>
                          {s.exercise.type === "WEIGHT"
                            ? `${s.weightKg ?? "—"} kg · ${s.reps ?? "—"} tek · RIR ${s.rir ?? "—"}`
                            : `${s.durationMinutes ?? (s.durationSeconds != null ? Math.round(s.durationSeconds / 60) : 0)} dk kardiyo`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rest Adherence */}
                <RestAdherenceWidget sets={workout.sets} />

                {/* Comments */}
                {workout.comments.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: "#94A3B8" }}
                    >
                      Yorumlar
                    </div>
                    {workout.comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl px-3 py-2.5"
                        style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                      >
                        <p className="text-[13px]" style={{ color: "#1E293B" }}>
                          {c.content}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>
                          {c.author.name} ·{" "}
                          {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Box */}
                <CommentBox workoutId={workout.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
