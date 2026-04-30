import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIER_LIMITS } from "@/lib/config/pricing";
import { SubscriptionTier } from "@prisma/client";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

const TIER_ORDER: SubscriptionTier[] = ["FREE", "TIER_1", "TIER_2", "AGENCY"];

const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE:   "#64748B",
  TIER_1: "#3B82F6",
  TIER_2: "#F59E0B",
  AGENCY: "#8B5CF6",
};

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  FREE:   ["3 danışana kadar", "Antrenman şablonları", "İlerleme takibi", "Mesajlaşma", "Davet linki"],
  TIER_1: ["15 danışana kadar", "Tüm Starter özellikleri", "Öncelikli destek", "Gelişmiş analitik"],
  TIER_2: ["50 danışana kadar", "Tüm Pro özellikleri", "Özel onboarding", "API erişimi"],
  AGENCY: ["9999 danışana kadar", "Tüm Elite özellikleri", "Çoklu koç desteği", "Beyaz etiket seçeneği"],
};

export default async function BillingPage() {
  const session = await auth();
  const coachId = session?.user.id || "";

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: coachId },
    select: { subscriptionTier: true },
  });
  const currentTier = profile?.subscriptionTier ?? "FREE";

  const clientCount = await prisma.coachClientRelation.count({
    where: { coachId, status: "ACCEPTED" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">Plan & Faturalama</h1>
        <p className="mt-1 text-sm text-slate-400">
          Mevcut planın ve danışan kotası
        </p>
      </div>

      {/* Current status */}
      <div className="mb-8 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Mevcut Plan</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xl font-black text-slate-800">{TIER_LIMITS[currentTier].name}</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {clientCount} / {TIER_LIMITS[currentTier].maxClients} danışan kullanılıyor
            </p>
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.round((clientCount / TIER_LIMITS[currentTier].maxClients) * 100))}%`,
                background: TIER_COLORS[currentTier],
              }}
            />
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {TIER_ORDER.map((tier) => {
          const config = TIER_LIMITS[tier];
          const color = TIER_COLORS[tier];
          const isCurrent = tier === currentTier;
          const isHigher = TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(currentTier);

          return (
            <div
              key={tier}
              className="relative rounded-2xl bg-white p-5"
              style={{
                boxShadow: isCurrent ? `0 0 0 2px ${color}` : "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {tier === "TIER_1" && !isCurrent && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-black text-white"
                  style={{ background: color }}
                >
                  En Popüler
                </div>
              )}

              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white"
                style={{ background: color }}
              >
                {config.name[0]}
              </div>

              <p className="font-black text-slate-800">{config.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {config.price === 0 ? "Ücretsiz" : `₺${config.price}/ay`}
              </p>
              <p className="mt-0.5 text-xs font-bold" style={{ color }}>
                {config.maxClients === 9999 ? "Sınırsız" : `${config.maxClients} danışan`}
              </p>

              <ul className="mt-4 space-y-1.5">
                {TIER_FEATURES[tier].map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <div
                    className="flex h-9 w-full items-center justify-center rounded-xl text-xs font-black"
                    style={{ background: `${color}15`, color }}
                  >
                    Mevcut Plan
                  </div>
                ) : isHigher ? (
                  <Link
                    href="/coach/subscription"
                    className="flex h-9 w-full items-center justify-center rounded-xl text-xs font-black text-white transition hover:opacity-90"
                    style={{ background: color }}
                  >
                    Yükselt →
                  </Link>
                ) : (
                  <div className="flex h-9 w-full items-center justify-center rounded-xl bg-slate-50 text-xs font-bold text-slate-400">
                    Mevcut planının altında
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Stripe entegrasyonu yakında aktif olacak.{" "}
        <Link href="/coach/subscription" className="font-bold text-blue-500 hover:underline">
          Abonelik ayarlarına git →
        </Link>
      </p>
    </div>
  );
}
