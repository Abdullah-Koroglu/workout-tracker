import Link from "next/link";
import { Lock } from "lucide-react";
import type { SubscriptionTier } from "@prisma/client";
import { TIER_CONFIG } from "@/lib/tier-limits";

type GatedFeature = "analytics" | "bodyTracking";

const FEATURE_META: Record<GatedFeature, { label: string; description: string; minPlan: string }> = {
  analytics: {
    label: "Performans Analitiği",
    description: "Güç trendi, hacim karşılaştırması ve ısı haritası raporları Pro planla açılır.",
    minPlan: "Pro",
  },
  bodyTracking: {
    label: "Vücut Takibi",
    description: "Kilo, ölçüm ve before/after fotoğraf takibi Pro planla açılır.",
    minPlan: "Pro",
  },
};

type Props = {
  feature: GatedFeature;
  tier: SubscriptionTier;
  children: React.ReactNode;
};

export function FeatureGate({ feature, tier, children }: Props) {
  const cfg = TIER_CONFIG[tier];
  const allowed = feature === "analytics" ? cfg.analytics : cfg.bodyTracking;

  if (allowed) return <>{children}</>;

  const meta = FEATURE_META[feature];

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none select-none opacity-30 blur-[3px]">{children}</div>

      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 p-6 text-center backdrop-blur-sm">
        <div
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)" }}
        >
          <Lock className="h-7 w-7 text-amber-600" />
        </div>
        <p className="text-[15px] font-black text-slate-800">{meta.label}</p>
        <p className="mt-1.5 max-w-[260px] text-[12px] leading-relaxed text-slate-500">
          {meta.description}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white"
            style={{ background: TIER_CONFIG[tier].color }}
          >
            {TIER_CONFIG[tier].label}
          </span>
          <span className="text-[11px] text-slate-400">→</span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white"
            style={{ background: "#3B82F6" }}
          >
            {meta.minPlan}
          </span>
        </div>
        <Link
          href="/coach/billing"
          className="mt-4 rounded-xl px-6 py-2.5 text-[13px] font-black text-white shadow-lg transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 6px 20px rgba(245,158,11,0.35)" }}
        >
          {meta.minPlan}'a Geç →
        </Link>
      </div>
    </div>
  );
}
