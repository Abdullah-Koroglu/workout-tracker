"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2, Timer, Trophy, Weight, Dumbbell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";

type WorkoutShareCardProps = {
  title: string;
  durationMinutes: number | null;
  totalVolumeKg: number;
  prExerciseNames: string[];
  workoutDate?: Date;
  totalSets?: number;
};

export function WorkoutShareCard({
  title,
  durationMinutes,
  totalVolumeKg,
  prExerciseNames,
  workoutDate,
  totalSets,
}: WorkoutShareCardProps) {
  const { success, error } = useNotificationContext();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const dataUrl = await generateImage();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = "fitcoach-workout-story.png";
      link.href = dataUrl;
      link.click();
      success("Paylaşım kartı indirildi.");
    } catch {
      error("Kart oluşturulamadı.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      await handleDownload();
      return;
    }
    setSharing(true);
    try {
      const dataUrl = await generateImage();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "fitcoach-workout.png", { type: "image/png" });
      await navigator.share({
        title: `FitCoach — ${title}`,
        text: `Antrenmanı tamamladım! ${totalVolumeKg.toLocaleString("tr-TR")} kg toplam hacim${prExerciseNames.length > 0 ? ` · ${prExerciseNames.length} PR` : ""} #FitCoach`,
        files: [file],
      });
    } catch {
      // User cancelled or share failed — silently ignore
    } finally {
      setSharing(false);
    }
  };

  const dateLabel = workoutDate
    ? workoutDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Workout Story</p>
          <h3 className="text-base font-black text-foreground">Paylaşım Kartı</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            İnstagram story formatında indir veya paylaş
          </p>
        </div>
        <div className="flex gap-2">
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button type="button" variant="outline" onClick={handleShare} disabled={sharing || downloading} className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden xs:inline">{sharing ? "Paylaşılıyor..." : "Paylaş"}</span>
            </Button>
          )}
          <Button type="button" onClick={handleDownload} disabled={downloading || sharing} className="gap-2">
            <Download className="h-4 w-4" />
            {downloading ? "Hazırlanıyor..." : "İndir"}
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="overflow-auto rounded-xl border bg-muted/20 p-3">
        <div
          ref={cardRef}
          className="mx-auto flex h-[640px] w-[360px] flex-col justify-between overflow-hidden rounded-[28px] p-6 text-white"
          style={{
            background: "linear-gradient(135deg, #059669 0%, #0d9488 40%, #0891b2 100%)",
          }}
        >
          {/* Top */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-100">FitCoach</p>
              {dateLabel && (
                <p className="text-[10px] font-semibold text-emerald-100/80">{dateLabel}</p>
              )}
            </div>
            <h4 className="mt-3 text-[28px] font-black leading-tight tracking-tight">
              Antrenman<br />Tamamlandı 🏆
            </h4>
            <p className="mt-2 text-sm font-medium text-emerald-100/90 leading-snug line-clamp-2">{title}</p>
          </div>

          {/* Stats */}
          <div className="space-y-2.5">
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100/80">Süre</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-black">
                <Timer className="h-5 w-5 opacity-90" />
                {durationMinutes ?? 0} dk
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-100/80">Hacim</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-black">
                  <Weight className="h-4 w-4 opacity-90" />
                  {totalVolumeKg.toLocaleString("tr-TR")} kg
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-100/80">Set</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-black">
                  <Dumbbell className="h-4 w-4 opacity-90" />
                  {totalSets ?? "-"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/20 px-4 py-3 backdrop-blur-sm border border-white/20">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100/80">Kırılan PR</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-black">
                <Trophy className="h-5 w-5 text-amber-300" />
                {prExerciseNames.length}
              </p>
              {prExerciseNames.length > 0 && (
                <p className="mt-1.5 text-xs font-semibold text-emerald-100/90 leading-relaxed line-clamp-2">
                  {prExerciseNames.join(" · ")}
                </p>
              )}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/80">
            #FitCoach #Progress #Fitness
          </p>
        </div>
      </div>
    </section>
  );
}

