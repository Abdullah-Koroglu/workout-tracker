"use client";

import { useState } from "react";

import { CommentBox } from "@/components/coach/CommentBox";
import { Button } from "@/components/ui/button";

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

export function WorkoutHistoryPanel({ workouts }: { workouts: WorkoutItem[] }) {
  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>(workouts[0]?.id ?? null);

  const statusLabel: Record<WorkoutItem["status"], string> = {
    IN_PROGRESS: "Devam ediyor",
    COMPLETED: "Tamamlandı",
    ABANDONED: "Yarıda bırakıldı"
  };

  if (workouts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        Bu client için antrenman geçmişi bulunmuyor.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => {
        const isOpen = openWorkoutId === workout.id;

        return (
          <div key={workout.id} className="rounded-xl border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{workout.template.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(workout.startedAt).toLocaleString("tr-TR")} - {statusLabel[workout.status]}
                </p>
                {(workout.finishedAt || workout.durationMinutes !== null) && (
                  <p className="text-xs text-muted-foreground">
                    {workout.finishedAt ? `Bitiş: ${new Date(workout.finishedAt).toLocaleString("tr-TR")}` : "Bitiş: -"}
                    {` | Süre: ${workout.durationMinutes ?? "-"} dk`}
                  </p>
                )}
              </div>
              <Button type="button" variant="outline" onClick={() => setOpenWorkoutId(isOpen ? null : workout.id)}>
                {isOpen ? "Detayı Gizle" : "Detayı Aç"}
              </Button>
            </div>

            {isOpen && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  {workout.sets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Henüz kaydedilmiş set yok.</p>
                  ) : (
                    workout.sets.map((setItem) => (
                      <div key={setItem.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                        <p className="font-medium">{setItem.exercise.name} - Set {setItem.setNumber}</p>
                        {setItem.exercise.type === "WEIGHT" ? (
                          <p>
                            {setItem.weightKg ?? "-"} kg / {setItem.reps ?? "-"} tekrar / RIR {setItem.rir ?? "-"}
                          </p>
                        ) : (
                          <p>{setItem.durationMinutes ?? 0} dk kardiyo tamamlandı</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Yorumlar</h3>
                  {workout.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Henüz yorum yok.</p>
                  ) : (
                    workout.comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg border p-3 text-sm">
                        <p>{comment.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {comment.author.name} - {new Date(comment.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <CommentBox workoutId={workout.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
