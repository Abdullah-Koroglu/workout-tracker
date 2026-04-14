"use client";

import { useEffect, useMemo, useRef } from "react";
import { Pause, Play, RotateCcw, TimerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";

type ProtocolItem = {
  durationMinutes: number;
  speed: number;
  incline: number;
};

function getIntensityColor(speed: number, incline: number): string {
  const intensity = speed * 0.6 + incline * 0.4;
  if (intensity > 12) return "from-red-500 to-red-600";
  if (intensity > 9) return "from-orange-500 to-orange-600";
  if (intensity > 6) return "from-yellow-500 to-yellow-600";
  return "from-emerald-500 to-teal-600";
}

function getIntensityLabel(speed: number, incline: number): string {
  const intensity = speed * 0.6 + incline * 0.4;
  if (intensity > 12) return "Yuksek";
  if (intensity > 9) return "Orta-Yuksek";
  if (intensity > 6) return "Orta";
  return "Dusuk";
}

export function CardioTimer({
  storageKey,
  durationMinutes,
  protocol,
  enabled = true,
  onReachedEnd,
  onAbandon,
  onSecondChange
}: {
  storageKey: string;
  durationMinutes: number;
  protocol: ProtocolItem[];
  enabled?: boolean;
  onReachedEnd?: () => void;
  onAbandon?: () => void;
  onSecondChange?: (seconds: number) => void;
}) {
  const totalDurationMinutes = useMemo(() => {
    const fromProtocol = (protocol || []).reduce((sum, row) => sum + Math.max(1, Number(row.durationMinutes) || 1), 0);
    return fromProtocol > 0 ? fromProtocol : Math.max(1, durationMinutes);
  }, [durationMinutes, protocol]);

  const totalSeconds = totalDurationMinutes * 60;
  const { seconds, isRunning, start, pause, resume, reset } = useWorkoutTimer(storageKey, enabled, totalSeconds, 1);
  useWakeLock(enabled && isRunning);

  const elapsedMinutes = Math.floor(seconds / 60);
  const currentIndex = useMemo(() => {
    if (!protocol.length) return 0;
    let acc = 0;
    for (let i = 0; i < protocol.length; i += 1) {
      acc += Math.max(1, Number(protocol[i].durationMinutes) || 1);
      if (elapsedMinutes < acc) return i;
    }
    return protocol.length - 1;
  }, [elapsedMinutes, protocol]);

  const current = protocol[currentIndex] || protocol[protocol.length - 1];
  const progress = useProgress(seconds, totalSeconds);
  const remainingSeconds = Math.max(totalSeconds - seconds, 0);
  const hasStarted = seconds > 0 || isRunning;
  const hasFinished = seconds >= totalSeconds;
  const next = currentIndex < protocol.length - 1 ? protocol[currentIndex + 1] : null;
  const currentBlockMinute = elapsedMinutes + 1;
  const formattedSeconds = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const formattedRemaining = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const reachedEndNotifiedRef = useRef(false);

  useEffect(() => {
    if (seconds >= totalSeconds && onReachedEnd && !reachedEndNotifiedRef.current) {
      reachedEndNotifiedRef.current = true;
      onReachedEnd();
    }
  }, [onReachedEnd, seconds, totalSeconds]);

  useEffect(() => {
    if (seconds < totalSeconds) {
      reachedEndNotifiedRef.current = false;
    }
  }, [seconds, totalSeconds]);

  useEffect(() => {
    onSecondChange?.(seconds);
  }, [onSecondChange, seconds]);

  return (
    <div className="overflow-hidden rounded-xl md:rounded-[28px] border border-emerald-200/60 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-3 md:p-5 text-white shadow-xl">
      <div className="space-y-3 md:space-y-6">
        <div className="grid gap-3 md:gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] md:text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
                Kardiyo Modu
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] md:text-xs text-white/80">
                Dakika {Math.min(currentBlockMinute, totalDurationMinutes)} / {totalDurationMinutes}
              </span>
              <span className={`rounded-full bg-gradient-to-r px-2 py-1 text-[10px] md:text-xs font-semibold text-white ${getIntensityColor(current?.speed ?? 0, current?.incline ?? 0)}`}>
                {getIntensityLabel(current?.speed ?? 0, current?.incline ?? 0)} Yogunluk
              </span>
            </div>

            <div className="rounded-2xl md:rounded-3xl border border-white/15 bg-black/10 px-4 py-4 md:px-6 md:py-6 shadow-inner backdrop-blur-sm">
              <p className="text-4xl md:text-7xl font-black tracking-tight">{formattedSeconds}</p>
              <div className="mt-2 md:mt-3 flex items-baseline justify-between">
                <p className="text-[10px] md:text-sm uppercase tracking-[0.14em] md:tracking-[0.18em] text-white/70">Kalan Sure</p>
                <p className="text-lg md:text-2xl font-bold text-white/90">{formattedRemaining}</p>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center justify-between text-[10px] md:text-xs uppercase tracking-[0.14em] md:tracking-[0.18em] text-white/70">
                <span>Ilerleme</span>
                <span>%{progress}</span>
              </div>
              <div className="h-2.5 md:h-4 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white via-white/80 to-white/60 transition-all duration-500 shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid gap-2 md:gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 rounded-xl md:rounded-2xl bg-white/10 p-3 md:p-4 backdrop-blur-sm">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.14em] md:tracking-[0.2em] text-white/70">Su anki blok</p>
                <div className="space-y-1">
                  <p className="text-sm md:text-lg font-bold">{current?.speed ?? 0} Hiz</p>
                  <p className="text-xs md:text-sm text-white/80">{current?.incline ?? 0} Egim</p>
                  <p className="text-[10px] md:text-xs text-white/70">Sure: {current?.durationMinutes ?? 1} dk</p>
                </div>
              </div>
              <div className="space-y-1.5 rounded-xl md:rounded-2xl bg-white/10 p-3 md:p-4 backdrop-blur-sm">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.14em] md:tracking-[0.2em] text-white/70">Siradaki blok</p>
                {next ? (
                  <div className="space-y-1">
                    <p className="text-sm md:text-lg font-bold">{next.speed} Hiz</p>
                    <p className="text-xs md:text-sm text-white/80">{next.incline} Egim</p>
                    <p className="text-[10px] md:text-xs text-white/70">Sure: {next.durationMinutes} dk</p>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm font-medium text-emerald-100">Tamamlandi</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 md:space-y-2 overflow-visible h-full">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.14em] md:tracking-[0.2em] text-white/70 lg:mb-2">Protokol Gosterimi</p>
            <div className="flex flex-col gap-1.5 md:gap-2 max-h-44 md:max-h-56 pr-1 md:pr-2 overflow-y-auto px-1 md:px-2">
              {protocol.map((block, index) => {
                const isActive = index === currentIndex;
                const isPast = index < currentIndex;
                return (
                  <div
                    key={`${index}-${block.durationMinutes}-${block.speed}-${block.incline}`}
                    className={`rounded-lg md:rounded-xl px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-white text-emerald-700 scale-105 shadow-lg"
                        : isPast
                        ? "bg-white/20 text-white/70"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Blok {index + 1} - {block.durationMinutes} dk</span>
                      <span className="text-right">
                        <span className="block">{block.speed} / {block.incline}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {!hasStarted && !hasFinished ? (
            <Button type="button" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-10 md:h-12 text-[11px] md:text-sm px-2" onClick={start}>
              <Play className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
              Baslat
            </Button>
          ) : isRunning ? (
            <Button type="button" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-10 md:h-12 text-[11px] md:text-sm px-2" onClick={pause}>
              <Pause className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
              Duraklat
            </Button>
          ) : !hasFinished ? (
            <Button type="button" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-10 md:h-12 text-[11px] md:text-sm px-2" onClick={resume}>
              <Play className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
              Devam Et
            </Button>
          ) : (
            <Button type="button" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-10 md:h-12 text-[11px] md:text-sm px-2" disabled>
              Tamamlandi
            </Button>
          )}
          <Button type="button" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 font-semibold h-10 md:h-12 text-[11px] md:text-sm px-2" onClick={reset}>
            <RotateCcw className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
            Sifirla
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10 font-semibold h-10 md:h-12 text-[11px] md:text-sm px-2"
            onClick={() => {
              reset();
              onAbandon?.();
            }}
          >
            <TimerOff className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
            Yarida Birak
          </Button>
        </div>

        {hasFinished && (
          <div className="rounded-xl md:rounded-2xl border border-emerald-200/30 bg-emerald-400/20 p-3 md:p-4 text-xs md:text-sm font-medium text-emerald-50">
            Harika performans! Tum protokol basariyla tamamlandi.
          </div>
        )}
      </div>
    </div>
  );
}
