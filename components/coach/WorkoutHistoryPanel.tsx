"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { CommentBox } from "@/components/coach/CommentBox";

type WorkoutItem = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  durationMinutes: number | null;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  template: { name: string };
  sets: Array<{
    id: string;
    setNumber: number;
    weightKg: number | null;
    reps: number | null;
    rir: number | null;
    durationMinutes: number | null;
    completed: boolean;
    exercise: { name: string; type: "WEIGHT" | "CARDIO" };
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: { name: string };
  }>;
};

const statusConfig: Record<
  WorkoutItem["status"],
  { label: string; emoji: string; bg: string; color: string; badgeBg: string }
> = {
  COMPLETED:   { label: "Tamamlandı",    emoji: "✅", bg: "#22C55E18", color: "#22C55E", badgeBg: "#22C55E18" },
  ABANDONED:   { label: "Yarıda bırakıldı", emoji: "⚠️", bg: "#F59E0B18", color: "#F59E0B", badgeBg: "#F59E0B18" },
  IN_PROGRESS: { label: "Devam ediyor",  emoji: "🏃", bg: "#2563EB18", color: "#2563EB", badgeBg: "#2563EB18" },
};

export function WorkoutHistoryPanel({ workouts }: { workouts: WorkoutItem[] }) {
  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>(null);

  if (workouts.length === 0) {
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
      {workouts.map((workout) => {
        const isOpen = openWorkoutId === workout.id;
        const cfg = statusConfig[workout.status];
        const date = new Date(workout.startedAt).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const completedSets = workout.sets.filter((s) => s.completed).length;

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
                  {completedSets > 0 && ` · ${completedSets} set`}
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
                            : `${s.durationMinutes ?? 0} dk kardiyo`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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
