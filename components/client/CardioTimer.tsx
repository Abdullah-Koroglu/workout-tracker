"use client";

import { useEffect, useMemo, useRef } from "react";
import { Pause, Play, RotateCcw, TimerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";

type ProtocolItem = {
  minute: number;
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
  if (intensity > 12) return "Yüksek";
  if (intensity > 9) return "Orta-Yüksek";
  if (intensity > 6) return "Orta";
  return "Düşük";
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
  const totalSeconds = durationMinutes * 60;
  const { seconds, isRunning, start, pause, resume, reset } = useWorkoutTimer(storageKey, enabled, totalSeconds);
  useWakeLock(enabled && isRunning);

  const minute = Math.floor(seconds / 60) + 1;
  const current = useMemo(
    () => protocol.find((p) => p.minute === minute) || protocol[protocol.length - 1],
    [protocol, minute]
  );
  const progress = useProgress(seconds, totalSeconds);
  const remainingSeconds = Math.max(totalSeconds - seconds, 0);
  const hasStarted = seconds > 0 || isRunning;
  const hasFinished = seconds >= totalSeconds;
  const next = useMemo(
    () => protocol.find((p) => p.minute === Math.min(minute + 1, durationMinutes)),
    [durationMinutes, minute, protocol]
  );
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
    <div className="overflow-hidden rounded-[28px] border border-emerald-200/60 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 text-white shadow-xl">
      <div className="space-y-6">
        {/* Main Timer Display */}
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                Kardiyo Modu
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                Dakika {Math.min(minute, durationMinutes)} / {durationMinutes}
              </span>
              <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${getIntensityColor(current?.speed ?? 0, current?.incline ?? 0)}`}>
                {getIntensityLabel(current?.speed ?? 0, current?.incline ?? 0)} Yoğunluk
              </span>
            </div>

            {/* Large Time Display */}
            <div className="rounded-3xl border border-white/15 bg-black/10 px-6 py-6 shadow-inner backdrop-blur-sm">
              <p className="text-6xl font-black tracking-tight sm:text-7xl">{formattedSeconds}</p>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-sm uppercase tracking-[0.18em] text-white/70">Kalan Süre</p>
                <p className="text-2xl font-bold text-white/90">{formattedRemaining}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/70">
                <span>İlerleme</span>
                <span>%{progress}</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-white/15">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-white via-white/80 to-white/60 transition-all duration-500 shadow-lg" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>

            {/* Current and Next Blocks */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Şu anki blok</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold">{current?.speed ?? 0} Hız</p>
                  <p className="text-sm text-white/80">{current?.incline ?? 0} Eğim</p>
                </div>
              </div>
              <div className="space-y-2 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Sıradaki blok</p>
                {next ? (
                  <div className="space-y-1">
                    <p className="text-lg font-bold">{next.speed} Hız</p>
                    <p className="text-sm text-white/80">{next.incline} Eğim</p>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-emerald-100">Tamamlandı</p>
                )}
              </div>
            </div>
          </div>

          {/* Protocol Timeline */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70 lg:mb-2">Protokol Gösterimi</p>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-2">
              {protocol.map((block) => {
                const isActive = block.minute === minute;
                const isPast = block.minute < minute;
                return (
                  <div
                    key={block.minute}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? `bg-white text-emerald-700 scale-105 shadow-lg`
                        : isPast
                        ? `bg-white/20 text-white/70`
                        : `bg-white/10 text-white/60`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{block.minute}. dk</span>
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

        {/* Control Buttons */}
        <div className="grid gap-3 sm:grid-cols-3">
          {!hasStarted && !hasFinished ? (
            <Button type="button" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-12" onClick={start}>
              <Play className="mr-2 h-5 w-5" />
              Başlat
            </Button>
          ) : isRunning ? (
            <Button type="button" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-12" onClick={pause}>
              <Pause className="mr-2 h-5 w-5" />
              Duraklat
            </Button>
          ) : !hasFinished ? (
            <Button type="button" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-12" onClick={resume}>
              <Play className="mr-2 h-5 w-5" />
              Devam Et
            </Button>
          ) : (
            <Button type="button" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-12" disabled>
              Tamamlandı ✓
            </Button>
          )}
          <Button type="button" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 font-semibold h-12" onClick={reset}>
            <RotateCcw className="mr-2 h-5 w-5" />
            Sıfırla
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10 font-semibold h-12"
            onClick={() => {
              reset();
              onAbandon?.();
            }}
          >
            <TimerOff className="mr-2 h-5 w-5" />
            Yarıda Bırak
          </Button>
        </div>

        {hasFinished && (
          <div className="rounded-2xl border border-emerald-200/30 bg-emerald-400/20 p-4 text-sm font-medium text-emerald-50">
            🎉 Harika performans! Tüm protokol başarıyla tamamlandı.
          </div>
        )}
      </div>
    </div>
  );
}
