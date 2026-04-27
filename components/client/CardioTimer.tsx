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
  if (v > 12) return { label: "Yüksek", bg: "rgba(239,68,68,0.18)", color: "#EF4444" };
  if (v > 9)  return { label: "Orta-Yüksek", bg: "rgba(249,115,22,0.18)", color: "#F97316" };
  if (v > 6)  return { label: "Orta", bg: "rgba(245,158,11,0.18)", color: "#F59E0B" };
  return        { label: "Düşük", bg: "rgba(34,197,94,0.18)", color: "#22C55E" };
}

function Btn({
  onClick,
  children,
  variant = "primary",
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const styles = {
    primary: {
      background: "linear-gradient(135deg, #FB923C, #EA580C)",
      color: "#fff",
      border: "none",
      boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
    },
    ghost: {
      background: "rgba(255,255,255,0.12)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.2)",
      boxShadow: "none",
    },
    danger: {
      background: "rgba(239,68,68,0.18)",
      color: "#FCA5A5",
      border: "1px solid rgba(239,68,68,0.3)",
      boxShadow: "none",
    },
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold transition disabled:opacity-40"
      style={styles[variant]}
    >
      {children}
    </button>
  );
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
    storageKey,
    enabled,
    totalSeconds,
    1,
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
  const next = currentIndex < protocol.length - 1 ? protocol[currentIndex + 1] : null;
  const progress = useProgress(seconds, totalSeconds);
  const remainingSeconds = Math.max(totalSeconds - seconds, 0);
  const hasStarted = seconds > 0 || isRunning;
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

  useEffect(() => {
    onSecondChange?.(seconds);
  }, [onSecondChange, seconds]);

  const badge = intensityBadge(current?.speed ?? 0, current?.incline ?? 0);

  return (
    <div
      className="overflow-hidden rounded-[18px]"
      style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
    >
      {/* ── Navy header ── */}
      <div
        className="px-5 pt-4 pb-5"
        style={{ background: "linear-gradient(160deg, #1A365D, #2D4A7A)" }}
      >
        {/* Badges row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            Kardiyo Modu
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] text-white/70"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            Blok {Math.min(currentIndex + 1, protocol.length)}/{protocol.length}
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label} Yoğunluk
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="h-2 w-full overflow-hidden rounded-full"
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
        <div className="mt-1.5 flex justify-between text-[10px] text-white/45">
          <span>İlerleme</span>
          <span>%{progress}</span>
        </div>
      </div>

      {/* ── White body ── */}
      <div className="bg-white px-4 pt-4 pb-5 space-y-4">

        {/* Timer display */}
        <div
          className="rounded-2xl px-5 py-4 text-center"
          style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div
            className="text-[52px] font-black leading-none tracking-tight tabular-nums"
            style={{ color: hasFinished ? "#22C55E" : "#1E293B" }}
          >
            {fmt(seconds)}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[12px] text-slate-400">
            <span>Geçen Süre</span>
            <span className="font-bold text-slate-600">{fmt(remainingSeconds)} kalan</span>
          </div>
        </div>

        {/* Current + Next blocks */}
        <div className="grid grid-cols-2 gap-2">
          {/* Current */}
          <div
            className="rounded-xl p-3"
            style={{
              background: "rgba(249,115,22,0.07)",
              border: "1px solid rgba(249,115,22,0.2)",
            }}
          >
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-500">
              Mevcut Blok
            </p>
            <p className="text-[20px] font-black text-slate-800 leading-none">
              {current?.speed ?? 0}
              <span className="text-[12px] font-semibold text-slate-400 ml-1">km/h</span>
            </p>
            <p className="mt-1 text-[12px] text-slate-500">{current?.incline ?? 0}° eğim</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{current?.durationMinutes ?? 1} dk</p>
          </div>

          {/* Next */}
          <div
            className="rounded-xl p-3"
            style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sıradaki
            </p>
            {next ? (
              <>
                <p className="text-[20px] font-black text-slate-600 leading-none">
                  {next.speed}
                  <span className="text-[12px] font-semibold text-slate-400 ml-1">km/h</span>
                </p>
                <p className="mt-1 text-[12px] text-slate-400">{next.incline}° eğim</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{next.durationMinutes} dk</p>
              </>
            ) : (
              <p className="mt-2 text-[13px] font-bold text-green-500">✓ Son blok</p>
            )}
          </div>
        </div>

        {/* Protocol list */}
        {protocol.length > 1 && (
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Protokol
            </p>
            <div className="flex max-h-36 flex-col gap-1.5 overflow-y-auto pr-1">
              {protocol.map((block, index) => {
                const isActive = index === currentIndex;
                const isPast   = index < currentIndex;
                return (
                  <div
                    key={`${index}-${block.speed}-${block.incline}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-[12px] font-semibold transition-all"
                    style={
                      isActive
                        ? { background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", color: "#EA580C", transform: "scale(1.01)" }
                        : isPast
                        ? { background: "#F8FAFC", color: "#CBD5E1", border: "1px solid transparent" }
                        : { background: "#F8FAFC", color: "#64748B", border: "1px solid transparent" }
                    }
                  >
                    <span>
                      {isPast && "✓ "}Blok {index + 1} — {block.durationMinutes} dk
                    </span>
                    <span className="font-mono text-[11px]">
                      {block.speed} / {block.incline}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {/* Primary action */}
          {!hasStarted && !hasFinished ? (
            <Btn variant="primary" onClick={start}>
              <Play className="h-4 w-4" /> Başlat
            </Btn>
          ) : isRunning ? (
            <Btn variant="primary" onClick={pause}>
              <Pause className="h-4 w-4" /> Duraklat
            </Btn>
          ) : !hasFinished ? (
            <Btn variant="primary" onClick={resume}>
              <Play className="h-4 w-4" /> Devam
            </Btn>
          ) : (
            <Btn variant="primary" disabled>
              ✓ Tamamlandı
            </Btn>
          )}

          {/* Reset */}
          <Btn variant="ghost" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Sıfırla
          </Btn>

          {/* Abandon */}
          <Btn
            variant="danger"
            onClick={() => { reset(); onAbandon?.(); }}
          >
            <TimerOff className="h-4 w-4" />
          </Btn>
        </div>

        {/* Finished banner */}
        {hasFinished && (
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <span className="text-[13px] font-bold text-green-600">
              🎉 Harika! Tüm protokol başarıyla tamamlandı.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
