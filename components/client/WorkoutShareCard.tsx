"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Trophy, Timer, Weight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";

type WorkoutShareCardProps = {
  title: string;
  durationMinutes: number | null;
  totalVolumeKg: number;
  prExerciseNames: string[];
};

export function WorkoutShareCard({ title, durationMinutes, totalVolumeKg, prExerciseNames }: WorkoutShareCardProps) {
  const { success, error } = useNotificationContext();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) {
      return;
    }

    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff"
      });

      const link = document.createElement("a");
      link.download = "fitcoach-workout-story.png";
      link.href = dataUrl;
      link.click();
      success("Paylasim karti indirildi.");
    } catch {
      error("Kart olusturulamadi.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Workout Story</p>
          <h3 className="text-lg font-black text-foreground">Paylasim Karti</h3>
        </div>
        <Button type="button" onClick={handleDownload} disabled={downloading}>
          <Download className="mr-2 h-4 w-4" />
          {downloading ? "Hazirlaniyor..." : "Kartı Indir"}
        </Button>
      </div>

      <div className="overflow-auto rounded-xl border bg-muted/20 p-2">
        <div
          ref={cardRef}
          className="mx-auto flex h-[640px] w-[360px] flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-50">Fit Coach</p>
            <h4 className="mt-2 text-3xl font-black leading-tight">Workout Complete</h4>
            <p className="mt-2 text-sm text-emerald-50/90">{title}</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-50/80">Sure</p>
              <p className="mt-1 inline-flex items-center gap-2 text-2xl font-black">
                <Timer className="h-5 w-5" />
                {durationMinutes ?? 0} dk
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-50/80">Toplam Hacim</p>
              <p className="mt-1 inline-flex items-center gap-2 text-2xl font-black">
                <Weight className="h-5 w-5" />
                {totalVolumeKg.toLocaleString("tr-TR")} kg
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-50/80">Kirilan PR</p>
              <p className="mt-1 inline-flex items-center gap-2 text-xl font-black">
                <Trophy className="h-5 w-5" />
                {prExerciseNames.length}
              </p>
              <p className="mt-2 text-sm text-emerald-50/95">
                {prExerciseNames.length > 0 ? prExerciseNames.join(", ") : "Bu antrenmanda yeni PR yok"}
              </p>
            </div>
          </div>

          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/90">#FitCoach #Progress</p>
        </div>
      </div>
    </section>
  );
}
