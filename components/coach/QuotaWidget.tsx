"use client";

import Link from "next/link";
import { SubscriptionTier } from "@prisma/client";
import { TIER_LIMITS } from "@/lib/config/pricing";

type Props = {
  tier: SubscriptionTier;
  currentClientCount: number;
};

const TIER_LABELS: Record<SubscriptionTier, string> = {
  FREE: "Starter",
  TIER_1: "Pro",
  TIER_2: "Elite",
  AGENCY: "Agency",
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE: "#64748B",
  TIER_1: "#3B82F6",
  TIER_2: "#F59E0B",
  AGENCY: "#8B5CF6",
};

export function QuotaWidget({ tier, currentClientCount }: Props) {
  const max = TIER_LIMITS[tier].maxClients;
  const pct = Math.min(100, Math.round((currentClientCount / max) * 100));
  const isFull = currentClientCount >= max;
  const color = TIER_COLORS[tier];

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Danışan Kotası
          </p>
          <p className="mt-0.5 text-sm font-bold text-slate-700">
            {currentClientCount} / {max} danışan
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-black text-white"
          style={{ background: color }}
        >
          {TIER_LABELS[tier]}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: isFull ? "#EF4444" : color,
          }}
        />
      </div>

      {isFull && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-red-500">Kapasite doldu!</p>
          <Link
            href="/coach/subscription"
            className="rounded-xl px-3 py-1.5 text-xs font-black text-white transition hover:opacity-90"
            style={{ background: color }}
          >
            Planı Yükselt →
          </Link>
        </div>
      )}
    </div>
  );
}
