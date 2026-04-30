"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Users, Zap, Crown, Infinity } from "lucide-react";
import { Suspense } from "react";

type SubscriptionInfo = {
  tier: "FREE" | "PRO" | "ELITE" | "UNLIMITED";
  label: string;
  maxClients: number | null;
  currentClientCount: number;
};

const PLANS = [
  {
    tier: "FREE" as const,
    label: "Ücretsiz",
    price: 0,
    maxClients: 5,
    icon: Users,
    color: "#64748B",
    features: ["5 danışana kadar", "Antrenman şablonları", "İlerleme takibi", "Mesajlaşma"],
  },
  {
    tier: "PRO" as const,
    label: "Pro",
    price: 299,
    maxClients: 25,
    icon: Zap,
    color: "#3B82F6",
    features: ["25 danışana kadar", "Tüm Ücretsiz özellikler", "Öncelikli destek", "Gelişmiş analitik"],
    popular: true,
  },
  {
    tier: "ELITE" as const,
    label: "Elite",
    price: 799,
    maxClients: 100,
    icon: Crown,
    color: "#F59E0B",
    features: ["100 danışana kadar", "Tüm Pro özellikler", "Özel onboarding", "API erişimi"],
  },
];

function SubscriptionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const success = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";

  useEffect(() => {
    fetch("/api/coach/subscription")
      .then((r) => r.json())
      .then(setInfo)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (tier: "PRO" | "ELITE") => {
    setUpgrading(tier);
    const res = await fetch("/api/coach/subscription/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const data = await res.json();
    if (data.url) {
      router.push(data.url);
    } else {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const currentTier = info?.tier ?? "FREE";
  const tierOrder = { FREE: 0, PRO: 1, ELITE: 2, UNLIMITED: 3 };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">Abonelik</h1>
        <p className="mt-1 text-sm text-slate-400">
          Mevcut planın ve danışan kapasiten
        </p>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700 ring-1 ring-green-200">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Planın başarıyla yükseltildi!
        </div>
      )}

      {canceled && (
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
          Ödeme iptal edildi.
        </div>
      )}

      {/* Current status */}
      <div className="mb-8 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Mevcut Durum</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xl font-black text-slate-800">{info?.label} Plan</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {info?.currentClientCount ?? 0} /{" "}
              {info?.maxClients === null ? "∞" : info?.maxClients} danışan
            </p>
          </div>
          {info?.maxClients !== null && (
            <div className="text-right">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${Math.min(100, ((info?.currentClientCount ?? 0) / (info?.maxClients ?? 1)) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Kapasite</p>
            </div>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.tier === currentTier;
          const isDowngrade = tierOrder[plan.tier] < tierOrder[currentTier];
          const canUpgrade = plan.tier !== "FREE" && !isCurrent && !isDowngrade;

          return (
            <div
              key={plan.tier}
              className="relative rounded-2xl bg-white p-5 ring-1 transition-shadow"
              style={{
                // ring: isCurrent ? `2px solid ${plan.color}` : undefined,
                boxShadow: isCurrent ? `0 0 0 2px ${plan.color}` : "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {plan.popular && !isCurrent && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-black text-white"
                  style={{ background: plan.color }}
                >
                  En Popüler
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${plan.color}15` }}
                >
                  <Icon className="h-4 w-4" style={{ color: plan.color }} />
                </div>
                <div>
                  <p className="font-black text-slate-800">{plan.label}</p>
                  <p className="text-xs text-slate-400">
                    {plan.price === 0 ? "Ücretsiz" : `₺${plan.price}/ay`}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <div
                    className="flex h-10 w-full items-center justify-center rounded-xl text-sm font-black"
                    style={{ background: `${plan.color}15`, color: plan.color }}
                  >
                    Mevcut Plan
                  </div>
                ) : canUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.tier as "PRO" | "ELITE")}
                    disabled={upgrading !== null}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
                    style={{ background: plan.color }}
                  >
                    {upgrading === plan.tier ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Yükselt →"
                    )}
                  </button>
                ) : (
                  <div className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-50 text-sm font-bold text-slate-400">
                    {isDowngrade ? "Mevcut planından düşük" : "Kullanılabilir değil"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite link section */}
      <div className="mt-8 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Davet Linki</p>
        <p className="mt-1 text-sm text-slate-600">
          Bu linki paylaşarak yeni danışanlarını platforma davet et
        </p>
        <InviteLinkBox />
      </div>
    </div>
  );
}

export function InviteLinkBox() {
  const [copied, setCopied] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setCoachId(d.profile?.userId ?? null))
      .catch(() => {});
  }, []);

  const inviteUrl = coachId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${coachId}`
    : "";

  const copy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        readOnly
        value={inviteUrl}
        className="h-10 flex-1 rounded-xl bg-white px-3 text-sm text-slate-700 ring-1 ring-slate-200 focus:outline-none"
      />
      <button
        onClick={copy}
        className="h-10 rounded-xl bg-slate-800 px-4 text-sm font-black text-white transition hover:bg-slate-700"
      >
        {copied ? "Kopyalandı!" : "Kopyala"}
      </button>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>}>
      <SubscriptionPageInner />
    </Suspense>
  );
}
