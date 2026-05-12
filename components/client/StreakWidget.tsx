"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy, Zap } from "lucide-react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  activeDays: { key: string; date: string; active: boolean }[];
}

const DAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

export function StreakWidget() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/streak")
      .then((r) => r.json())
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />;
  if (!data) return null;

  const { currentStreak, longestStreak, totalWorkouts, activeDays } = data;

  const streakColor =
    currentStreak >= 7
      ? "#EF4444"   // 7+ = red-hot
      : currentStreak >= 3
      ? "#F97316"   // 3–6 = orange
      : "#94A3B8";  // 0–2 = grey

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: currentStreak >= 3
          ? `linear-gradient(135deg, ${streakColor}18, ${streakColor}08)`
          : "white",
        border: `1px solid ${currentStreak >= 3 ? streakColor + "30" : "#F1F5F9"}`,
        boxShadow: currentStreak >= 3
          ? `0 4px 20px ${streakColor}22`
          : "0 1px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame
              className="h-5 w-5"
              style={{ color: streakColor }}
              fill={currentStreak >= 1 ? streakColor : "none"}
            />
            <span className="text-sm font-black text-slate-800">Seri</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Trophy className="h-3 w-3" />
              <span className="font-bold">En uzun: {longestStreak}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Zap className="h-3 w-3" />
              <span className="font-bold">Toplam: {totalWorkouts}</span>
            </div>
          </div>
        </div>

        {/* Current streak number */}
        <div className="flex items-baseline gap-2 mb-4">
          <span
            className="text-[42px] font-black leading-none"
            style={{ color: streakColor }}
          >
            {currentStreak}
          </span>
          <span className="text-sm font-bold text-slate-500">
            {currentStreak === 1 ? "günlük seri" : "günlük seri"}
          </span>
          {currentStreak >= 7 && (
            <span className="ml-auto rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-black text-red-600 animate-pulse">
              🔥 ATEŞTE!
            </span>
          )}
          {currentStreak >= 3 && currentStreak < 7 && (
            <span className="ml-auto rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-black text-orange-600">
              🔥 Süper!
            </span>
          )}
          {currentStreak === 0 && (
            <span className="ml-auto text-[11px] text-slate-400">Antrenmanını tamamla, seri başlasın!</span>
          )}
        </div>

        {/* 14-day mini calendar */}
        <div className="grid grid-cols-14 gap-1" style={{ gridTemplateColumns: "repeat(14, 1fr)" }}>
          {activeDays.map((day, i) => {
            const isToday = i === 13;
            return (
              <div key={day.key} className="flex flex-col items-center gap-0.5">
                <div
                  className="h-7 w-full rounded-lg transition-all"
                  style={{
                    background: day.active
                      ? isToday
                        ? streakColor
                        : `${streakColor}CC`
                      : isToday
                      ? "#E2E8F0"
                      : "#F8FAFC",
                    boxShadow: day.active && isToday ? `0 2px 8px ${streakColor}44` : "none",
                    transform: isToday ? "scale(1.1)" : "scale(1)",
                  }}
                />
                <span className="text-[8px] font-bold text-slate-400">
                  {DAY_LABELS[new Date(day.date).getDay() === 0 ? 6 : new Date(day.date).getDay() - 1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom motivational bar */}
      {currentStreak > 0 && (
        <div
          className="px-4 py-2 text-center text-[11px] font-bold"
          style={{
            background: `${streakColor}15`,
            color: streakColor,
          }}
        >
          {currentStreak >= 30
            ? "🏆 Efsanevi seri! 30 gün boyunca hiç durmuyor sun."
            : currentStreak >= 7
            ? `🔥 ${currentStreak} gündür durdurulamıyorsun! Devam et!`
            : `💪 ${currentStreak} günlük seri. ${7 - currentStreak} gün daha → 7 günlük rozet!`}
        </div>
      )}
    </div>
  );
}
