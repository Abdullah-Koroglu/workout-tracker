"use client";

import { useEffect, useState } from "react";
import { Trophy, Lock } from "lucide-react";

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  points: number;
  unlockedAt: string | null;
}

export function AchievementsPanel() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.achievements ?? []);
        setTotalPoints(d.totalPoints ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />;
  if (items.length === 0) return null;

  const unlocked = items.filter((a) => a.unlockedAt);
  const locked = items.filter((a) => !a.unlockedAt);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <h2 className="text-base font-black text-slate-800">Başarımlar</h2>
        </div>
        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
          {totalPoints} puan · {unlocked.length}/{items.length}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {unlocked.map((a) => (
          <div key={a.id} className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-3">
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">{a.title}</p>
                <p className="text-[10px] text-slate-500 line-clamp-2">{a.description}</p>
                <p className="mt-0.5 text-[10px] font-black text-amber-600">+{a.points}p</p>
              </div>
            </div>
          </div>
        ))}
        {locked.slice(0, 6).map((a) => (
          <div key={a.id} className="rounded-2xl bg-slate-50 border border-slate-100 p-3 opacity-60">
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white">
                <Lock className="h-4 w-4 text-slate-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-500 truncate">{a.title}</p>
                <p className="text-[10px] text-slate-400 line-clamp-2">{a.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
