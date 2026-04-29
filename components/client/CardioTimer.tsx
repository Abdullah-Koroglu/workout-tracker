"use client";

import { useEffect, useMemo, useRef } from "react";
import { Pause, Play, RotateCcw, TimerOff } from "lucide-react";

import { useProgress } from "@/hooks/useProgress";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";

type ProtocolItem = {
  durationMinutes: number;
  speed: number;
  incline: number;
};

function intensityBadge(speed: number, incline: number) {
  const v = speed * 0.6 + incline * 0.4;
  if (v > 12) return { label: "Yüksek",       bg: "rgba(239,68,68,0.18)",   color: "#EF4444" };
  if (v > 9)  return { label: "Orta-Yüksek",  bg: "rgba(249,115,22,0.18)",  color: "#F97316" };
  if (v > 6)  return { label: "Orta",          bg: "rgba(245,158,11,0.18)",  color: "#F59E0B" };
  return        { label: "Düşük",             bg: "rgba(34,197,94,0.18)",   color: "#22C55E" };
}

export function CardioTimer({
  storageKey,
  durationMinutes,
  protocol,
  enabled = true,
  onReachedEnd,
  onAbandon,
  onSecondChange,
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
    const fromProtocol = (protocol || []).reduce(
      (sum, row) => sum + Math.max(1, Number(row.durationMinutes) || 1),
      0,
    );
    return fromProtocol > 0 ? fromProtocol : Math.max(1, durationMinutes);
  }, [durationMinutes, protocol]);

  const totalSeconds = totalDurationMinutes * 60;
  const { seconds, isRunning, start, pause, resume, reset } = useWorkoutTimer(
    storageKey, enabled, totalSeconds, 1,
  );
  useWakeLock(enabled && isRunning);

  const elapsedMinutes = Math.floor(seconds / 60);
  const currentIndex = useMemo(() => {
    if (!protocol.length) return 0;
    let acc = 0;
    for (let i = 0; i < protocol.length; i++) {
      acc += Math.max(1, Number(protocol[i].durationMinutes) || 1);
      if (elapsedMinutes < acc) return i;
    }
    return protocol.length - 1;
  }, [elapsedMinutes, protocol]);

  const current = protocol[currentIndex] ?? protocol[protocol.length - 1];
  const next    = currentIndex < protocol.length - 1 ? protocol[currentIndex + 1] : null;
  const progress         = useProgress(seconds, totalSeconds);
  const remainingSeconds = Math.max(totalSeconds - seconds, 0);
  const hasStarted  = seconds > 0 || isRunning;
  const hasFinished = seconds >= totalSeconds;

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const reachedEndRef = useRef(false);
  useEffect(() => {
    if (seconds >= totalSeconds && onReachedEnd && !reachedEndRef.current) {
      reachedEndRef.current = true;
      onReachedEnd();
    }
  }, [onReachedEnd, seconds, totalSeconds]);
  useEffect(() => {
    if (seconds < totalSeconds) reachedEndRef.current = false;
  }, [seconds, totalSeconds]);
  useEffect(() => { onSecondChange?.(seconds); }, [onSecondChange, seconds]);

  const badge = intensityBadge(current?.speed ?? 0, current?.incline ?? 0);

  return (
    <div
      className="overflow-hidden rounded-[18px]"
      style={{
        boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Navy Header ── */}
      <div
        className="px-5 pt-5 pb-6"
        style={{ background: "linear-gradient(160deg, #1A365D, #2D4A7A)" }}
      >
        {/* Top row: badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)" }}
          >
            Kardiyo Modu
          </span>
          <span
            className="rounded-full px-3 py-1 text-[10px]"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
          >
            Blok {Math.min(currentIndex + 1, protocol.length)}/{protocol.length}
          </span>
          <span
            className="rounded-full px-3 py-1 text-[10px] font-bold"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label} Yoğunluk
          </span>
        </div>

        {/* Timer display — big, central */}
        <div className="text-center mb-4">
          <div
            className="text-[56px] font-black leading-none tracking-tight tabular-nums"
            style={{ color: hasFinished ? "#22C55E" : "#fff", letterSpacing: -2 }}
          >
            {fmt(seconds)}
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span>Geçen Süre</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
              {fmt(remainingSeconds)} kalan
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #FB923C, #F97316)",
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          <span>İlerleme</span>
          <span>%{progress}</span>
        </div>
      </div>

      {/* ── White Body ── */}
      <div className="px-4 pt-4 pb-5 space-y-3" style={{ background: "#fff" }}>

        {/* Current + Next blocks */}
        <div className="grid grid-cols-2 gap-2">
          {/* Current */}
          <div
            className="rounded-[14px] p-3"
            style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#F97316" }}>
              Mevcut Blok
            </p>
            <p className="text-[22px] font-black leading-none" style={{ color: "#1E293B" }}>
              {current?.speed ?? 0}
              <span className="text-[12px] font-semibold ml-1" style={{ color: "#94A3B8" }}>km/h</span>
            </p>
            <p className="mt-1 text-[12px]" style={{ color: "#475569" }}>{current?.incline ?? 0}° eğim</p>
            <p className="mt-0.5 text-[11px]" style={{ color: "#94A3B8" }}>{current?.durationMinutes ?? 1} dk</p>
          </div>

          {/* Next */}
          <div
            className="rounded-[14px] p-3"
            style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
              Sıradaki
            </p>
            {next ? (
              <>
                <p className="text-[22px] font-black leading-none" style={{ color: "#475569" }}>
                  {next.speed}
                  <span className="text-[12px] font-semibold ml-1" style={{ color: "#94A3B8" }}>km/h</span>
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "#94A3B8" }}>{next.incline}° eğim</p>
                <p className="mt-0.5 text-[11px]" style={{ color: "#94A3B8" }}>{next.durationMinutes} dk</p>
              </>
            ) : (
              <p className="mt-2 text-[13px] font-bold" style={{ color: "#22C55E" }}>✓ Son blok</p>
            )}
          </div>
        </div>

        {/* Protocol list */}
        {protocol.length > 1 && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
              Protokol
            </p>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1 overflow-x-visible">
              {protocol.map((block, index) => {
                const isActive = index === currentIndex;
                const isPast   = index < currentIndex;
                return (
                  <div
                    key={`${index}-${block.speed}-${block.incline}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-[12px] font-semibold transition-all"
                    style={
                      isActive
                        ? { background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", color: "#EA580C", transform: "scale(1.00)" }
                        : isPast
                        ? { background: "#F8FAFC", color: "#CBD5E1", border: "1px solid transparent", transform: "scale(.99)" }
                        : { background: "#F8FAFC", color: "#64748B", border: "1px solid transparent", transform: "scale(.99)" }
                    }
                  >
                    <span>{isPast && "✓ "}Blok {index + 1} — {block.durationMinutes} dk</span>
                    <span className="font-mono text-[11px]">{block.speed} / {block.incline}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {/* Primary */}
          {!hasStarted && !hasFinished ? (
            <button
              type="button"
              onClick={start}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.44)", border: "none" }}
            >
              <Play className="h-4 w-4" /> Başlat
            </button>
          ) : isRunning ? (
            <button
              type="button"
              onClick={pause}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.44)", border: "none" }}
            >
              <Pause className="h-4 w-4" /> Duraklat
            </button>
          ) : !hasFinished ? (
            <button
              type="button"
              onClick={resume}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.44)", border: "none" }}
            >
              <Play className="h-4 w-4" /> Devam
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-white opacity-40"
              style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)", border: "none" }}
            >
              ✓ Tamamlandı
            </button>
          )}

          {/* Reset */}
          <button
            type="button"
            onClick={reset}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold"
            style={{ background: "rgba(255,255,255,0.12)", color: "#1E293B", border: "1px solid rgba(0,0,0,0.1)" }}
          >
            <RotateCcw className="h-4 w-4" /> Sıfırla
          </button>

          {/* Abandon */}
          <button
            type="button"
            onClick={() => { reset(); onAbandon?.(); }}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}
            title="Bırak"
          >
            <TimerOff className="h-4 w-4" />
          </button>
        </div>

        {/* Finished banner */}
        {hasFinished && (
          <div
            className="rounded-[14px] p-3 text-center"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <span className="text-[13px] font-bold" style={{ color: "#22C55E" }}>
              🎉 Harika! Tüm protokol başarıyla tamamlandı.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
