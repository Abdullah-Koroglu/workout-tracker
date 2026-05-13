"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, ChevronRight, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface ActiveWorkout {
  workoutId: string;
  assignmentId: string;
  templateName: string;
  startedAt: string;
}

export function ActiveWorkoutBanner() {
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  // Don't show if already on the workout page
  const isOnWorkoutPage = pathname.includes("/workout/") && pathname.includes("/start");

  useEffect(() => {
    setDismissed(false); // Reset on navigation
  }, [pathname]);

  useEffect(() => {
    if (isOnWorkoutPage) return;
    fetch("/api/client/active-workout")
      .then((r) => r.json())
      .then((d) => setActive(d.workout ?? null))
      .catch(() => null);
  }, [isOnWorkoutPage, pathname]);

  if (!active || dismissed || isOnWorkoutPage) return null;

  const elapsed = Math.floor(
    (Date.now() - new Date(active.startedAt).getTime()) / 60000
  );

  return (
    <div className="fixed top-16 left-0 right-0 z-40 px-4 md:pl-[272px] md:pr-4">
      <div
        className="flex items-center gap-3 rounded-2xl p-3 shadow-lg"
        style={{
          background: "linear-gradient(135deg, #F97316, #EA580C)",
          boxShadow: "0 4px 20px rgba(234,88,12,0.4)",
        }}
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Dumbbell className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white/80 leading-none">Antrenman devam ediyor</p>
          <p className="text-sm font-black text-white truncate mt-0.5">{active.templateName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-white/70">{elapsed} dk</span>
          <Link
            href={`/client/workout/${active.assignmentId}/start`}
            className="flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-black text-white hover:bg-white/30"
          >
            Devam Et <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
