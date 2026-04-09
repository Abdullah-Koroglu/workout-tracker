import Link from "next/link";
import { Clock, Zap, Dumbbell } from "lucide-react";

export type WorkoutSummaryData = {
  id: string;
  status: "COMPLETED" | "ABANDONED";
  templateName: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMinutes: number | null;
  setCount: number;
  isOneTime: boolean;
};

export function WorkoutSummaryCard({ workout }: { workout: WorkoutSummaryData }) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-";
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}dk`;
  };

  return (
    <Link href={`/coach/workouts/${workout.id}`} className="block">
      <div className={`rounded-2xl border p-4 transition ${
        workout.status === "COMPLETED"
          ? "border-emerald-200/60 bg-emerald-50/30 hover:border-emerald-400"
          : "border-orange-200/60 bg-orange-50/30 hover:border-orange-400"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <p className="font-semibold text-foreground">{workout.templateName}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(new Date(workout.startedAt))}
              </div>
              {workout.durationMinutes && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Süre: {formatDuration(workout.durationMinutes)}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Dumbbell className="h-3 w-3" />
                {workout.setCount} set
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              workout.status === "COMPLETED"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-orange-100 text-orange-700"
            }`}>
              {workout.status === "COMPLETED" ? "Tamamlandı" : "İptal Edildi"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
