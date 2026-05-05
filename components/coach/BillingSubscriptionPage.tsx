"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Crown,
  Download,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import type { SubscriptionTier } from "@prisma/client";

const PLAN_FEATURES: Record<SubscriptionTier, string[]> = {
  FREE: ["3 aktif danisan", "Temel antrenman sablonlari", "Mesajlasma"],
  TIER_1: ["15 aktif danisan", "Ozel antrenman sablonlari", "Mesajlasma", "Temel analitik"],
  TIER_2: ["50 aktif danisan", "Gelismis analitik", "Toplu mesaj", "Oncelikli destek"],
  AGENCY: ["Coklu koc", "Yuksek kapasite", "Beyaz etiket opsiyonu", "Oncelikli onboarding"],
};

const PLAN_ICONS: Record<SubscriptionTier, typeof Users> = {
  FREE: Users,
  TIER_1: Zap,
  TIER_2: Crown,
  AGENCY: Sparkles,
};

const PLAN_COLORS: Record<SubscriptionTier, string> = {
  FREE: "#64748B",
  TIER_1: "#2563EB",
  TIER_2: "#F97316",
  AGENCY: "#7C3AED",
};

type BillingCycle = "monthly" | "yearly";

type BillingInfo = {
  tier: SubscriptionTier;
  label: string;
  paymentProvider: "STRIPE" | "IYZICO";
  maxClients: number | null;
  currentClientCount: number;
  remainingClients: number | null;
  usagePercent: number;
  quotaState: "ok" | "warning" | "critical" | "full";
  currentPlanPrice: { monthly: number; yearly: number | null };
  currentBillingCycle: BillingCycle;
  renewalDate: string | null;
  nextInvoiceDate: string | null;
  activeSince: string | null;
  totalPaid: number;
  stripeConfigured: boolean;
  subscriptionStatus: string | null;
  supportedBillingCycles: BillingCycle[];
  invoices: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: string;
    status: string;
    pdfUrl: string | null;
  }>;
  paymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
  portalAvailable: boolean;
  plans: Array<{
    tier: SubscriptionTier;
    label: string;
    maxClients: number | null;
    price: { monthly: number; yearly: number | null };
    features: string[];
    popular?: boolean;
  }>;
};

function formatMoney(amount: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function cycleSuffix(cycle: BillingCycle) {
  return cycle === "monthly" ? "/ay" : "/ay ort.";
}

function quotaText(state: BillingInfo["quotaState"]) {
  if (state === "full") return "Kapasite doldu";
  if (state === "critical") return "Kritik";
  if (state === "warning") return "Yaklasiliyor";
  return "Saglikli";
}

function quotaColor(state: BillingInfo["quotaState"]) {
  if (state === "full") return "#DC2626";
  if (state === "critical") return "#F97316";
  if (state === "warning") return "#F59E0B";
  return "#22C55E";
}

function BillingSubscriptionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const success = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";

  useEffect(() => {
    fetch("/api/coach/subscription")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Abonelik bilgileri alinamadi.");
        }
        setInfo(data);
        setBillingCycle(data.supportedBillingCycles.includes("yearly") ? "yearly" : "monthly");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const plans = useMemo(() => {
    if (!info) return [];

    const ordered: SubscriptionTier[] = ["FREE", "TIER_1", "TIER_2", "AGENCY"];
    const tierOrder = Object.fromEntries(ordered.map((tier, index) => [tier, index])) as Record<SubscriptionTier, number>;

    const plansByTier = Object.fromEntries(info.plans.map((plan) => [plan.tier, plan])) as Record<SubscriptionTier, BillingInfo["plans"][number]>;

    return ordered.map((tier) => {
      const planConfig = plansByTier[tier];
      const isCurrent = info.tier === tier;
      const isDowngrade = tierOrder[tier] < tierOrder[info.tier];
      const cycleSupported = billingCycle === "monthly" || info.supportedBillingCycles.includes("yearly");
      const isUpgradeable = !isCurrent && !isDowngrade && tier !== "FREE" && cycleSupported;

      return {
        tier,
        label: planConfig.label,
        price: billingCycle === "yearly" ? planConfig.price.yearly ?? planConfig.price.monthly : planConfig.price.monthly,
        priceMonthly: planConfig.price.monthly,
        priceYearly: planConfig.price.yearly,
        maxClients: planConfig.maxClients,
        isCurrent,
        isDowngrade,
        isUpgradeable,
        popular: Boolean(planConfig.popular),
        features: planConfig.features.length > 0 ? planConfig.features : PLAN_FEATURES[tier],
        icon: PLAN_ICONS[tier],
        color: PLAN_COLORS[tier],
      };
    });
  }, [billingCycle, info]);

  const handleUpgrade = async (tier: "PRO" | "ELITE") => {
    setUpgradingPlan(tier);
    setError(null);

    const response = await fetch("/api/coach/subscription/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, cycle: billingCycle }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      setError(data.error || "Odeme oturumu baslatilamadi.");
      setUpgradingPlan(null);
      return;
    }

    router.push(data.url);
  };

  const openPortal = async () => {
    setPortalBusy(true);
    setError(null);

    const response = await fetch("/api/coach/subscription/portal", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      setError(data.error || "Faturalama portali acilamadi.");
      setPortalBusy(false);
      return;
    }

    router.push(data.url);
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!info) return null;

  const currentPlanColor = PLAN_COLORS[info.tier];
  const currentPrice = billingCycle === "yearly" ? info.currentPlanPrice.yearly ?? info.currentPlanPrice.monthly : info.currentPlanPrice.monthly;
  const currentCurrency = info.invoices[0]?.currency ?? "TRY";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-[28px] font-black tracking-[-0.04em] text-slate-900">Faturalama & Abonelik</h1>
        <p className="mt-1 text-sm text-slate-500">Koc planini, danisan limitini ve faturalama gecmisini yonet.</p>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Plan guncellendi.
        </div>
      )}

      {canceled && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Odeme islemi iptal edildi.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section
        className="relative overflow-hidden rounded-[24px] px-6 py-7 text-white"
        style={{
          background: "linear-gradient(135deg, #1A365D 0%, #2D4A7A 60%, #1E3A5F 100%)",
          boxShadow: "0 12px 40px rgba(26,54,93,0.28)",
        }}
      >
        <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-white/5" />
        <div className="absolute bottom-[-56px] left-56 h-40 w-40 rounded-full bg-orange-500/15" />

        <div className="relative grid gap-5 lg:grid-cols-3">
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">Mevcut Plan</div>
            <div className="mb-2 flex items-center gap-3">
              <div className="text-[30px] font-black tracking-[-0.06em]">{info.label}</div>
              <span className="rounded-full border border-orange-400/30 bg-orange-500/20 px-3 py-1 text-[11px] font-bold text-orange-100">
                {info.subscriptionStatus ? info.subscriptionStatus.toUpperCase() : "AKTIF"}
              </span>
            </div>
            <div className="text-[24px] font-black tracking-[-0.04em] text-orange-100">
              {currentPrice === 0 ? "Ucretsiz" : formatMoney(currentPrice, "TRY")}
              {currentPrice > 0 && <span className="ml-1 text-sm font-medium text-white/45">{cycleSuffix(billingCycle)}</span>}
            </div>
            <div className="mt-2 text-xs text-white/50">
              {info.renewalDate ? `Yenileme: ${formatDate(info.renewalDate)}` : "Henüz aktif yenileme tarihi yok"}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">Danisan Kotasi</div>
            <div className="mb-2 flex items-end justify-between gap-3">
              <div className="text-[30px] font-black tracking-[-0.06em]">
                {info.currentClientCount}
                <span className="text-lg font-medium text-white/55">/{info.maxClients ?? "∞"}</span>
              </div>
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ background: `${quotaColor(info.quotaState)}22`, color: quotaColor(info.quotaState) }}
              >
                {quotaText(info.quotaState)}
              </span>
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${info.maxClients === null ? 0 : Math.min(100, info.usagePercent)}%`,
                  background: `linear-gradient(90deg, ${quotaColor(info.quotaState)}, ${currentPlanColor})`,
                  boxShadow: `0 0 12px ${quotaColor(info.quotaState)}88`,
                }}
              />
            </div>
            <div className="text-xs font-medium text-white/65">
              {info.maxClients === null
                ? "Bu planda pratikte limitsiz danisan kapasitesi var."
                : info.remainingClients === 0
                  ? "Yeni danisan almak icin daha ust plana gecmen gerekiyor."
                  : `${info.remainingClients} bos kontenjan kaldi.`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Aylik Gelir", value: currentPrice === 0 ? "-" : formatMoney(info.currentPlanPrice.monthly, "TRY"), icon: CreditCard },
              { label: "Sonraki Fatura", value: formatDate(info.nextInvoiceDate), icon: ShieldCheck },
              { label: "Aktif Sure", value: info.activeSince ? `${Math.max(1, Math.round((Date.now() - new Date(info.activeSince).getTime()) / (1000 * 60 * 60 * 24 * 30)))} ay` : "-", icon: Loader2 },
              { label: "Toplam Odeme", value: info.totalPaid > 0 ? formatMoney(info.totalPaid, currentCurrency) : "-", icon: Sparkles },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/7 px-3 py-3 backdrop-blur-sm">
                  <Icon className="mb-2 h-4 w-4 text-orange-200" />
                  <div className="text-[15px] font-black tracking-[-0.03em] text-white">{stat.value}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-center gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => {
            const supported = cycle === "monthly" || info.supportedBillingCycles.includes("yearly");
            return (
              <button
                key={cycle}
                type="button"
                disabled={!supported}
                onClick={() => setBillingCycle(cycle)}
                className="rounded-xl px-5 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background: billingCycle === cycle ? "linear-gradient(135deg,#FB923C,#EA580C)" : "transparent",
                  color: billingCycle === cycle ? "#fff" : "#64748B",
                  boxShadow: billingCycle === cycle ? "0 3px 10px rgba(249,115,22,0.28)" : "none",
                }}
              >
                {cycle === "monthly" ? "Aylik" : "Yillik"}
              </button>
            );
          })}
        </div>
        {billingCycle === "yearly" && info.supportedBillingCycles.includes("yearly") && (
          <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-600">2 ay ucretsiz</span>
        )}
      </div>

      <section className="mt-6 grid gap-5 lg:grid-cols-4">
        {plans.map((plan) => {
          const buttonLabel = plan.isCurrent
            ? "Mevcut Plan"
            : plan.isDowngrade
              ? "Alt plan"
              : !plan.isUpgradeable
                ? "Kullanilamaz"
                : `${plan.label}'e Gec`;

          return (
            <div
              key={plan.tier}
              className="relative overflow-hidden rounded-[22px] border px-5 py-6 h-auto flex flex-col"
              style={{
                background: plan.popular
                  ? "linear-gradient(160deg, #0D1B2E, #152436)"
                  : "#fff",
                borderColor: plan.popular ? "rgba(249,115,22,0.35)" : "#E2E8F0",
                boxShadow: plan.popular
                  ? "0 0 0 1px rgba(249,115,22,0.15), 0 12px 36px rgba(249,115,22,0.16)"
                  : "0 2px 18px rgba(15,23,42,0.06)",
              }}
            >
              {plan.popular && (
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-orange-500/20 blur-2xl" />
              )}
              {plan.popular && (
                <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                  En Populer
                </span>
              )}
              {plan.isCurrent && (
                <span className="absolute right-4 top-4 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-[11px] font-bold text-green-600">
                  Mevcut
                </span>
              )}

              <div className="">
                {/* <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${plan.color}18` }}>
                  <Icon className="h-5 w-5" style={{ color: plan.color }} />
                </div> */}
                <div
                  className="text-xs font-bold uppercase tracking-[0.2em]"
                  style={{
                    color: plan.popular ? "rgba(255,255,255,0.5)" : "#94A3B8",
                  }}
                >
                  {plan.label}
                </div>
                <div className="flex gap-4 items-end">
                  <div
                    className="mt-2 text-[34px] font-black tracking-[-0.08em]"
                    style={{ color: plan.popular ? "#fff" : "#0F172A" }}
                  >
                    {plan.price === 0
                      ? "Ucretsiz"
                      : formatMoney(plan.price, "TRY")}
                  </div>
                  {plan.price > 0 && (
                    <div
                      className="text-xs"
                      style={{
                        color: plan.popular
                          ? "rgba(255,255,255,0.45)"
                          : "#94A3B8",
                      }}
                    >
                      {billingCycle === "yearly" && plan.priceYearly
                        ? `${formatMoney(plan.priceYearly * 12, "TRY")}/yil faturalandirilir`
                        : "/ay"}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="mt-4 rounded-2xl px-3 py-3"
                style={{
                  background: plan.popular
                    ? "rgba(255,255,255,0.06)"
                    : "#F8FAFC",
                }}
              >
                <div
                  className="text-sm font-black"
                  style={{ color: plan.popular ? "#fff" : "#0F172A" }}
                >
                  {plan.maxClients === null
                    ? "Esnek kapasite"
                    : `${plan.maxClients} Danisan`}
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-2 text-sm"
                    style={{
                      color: plan.popular
                        ? "rgba(255,255,255,0.85)"
                        : "#334155",
                    }}
                  >
                    <div
                      className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: `${plan.color}18` }}
                    >
                      <CheckCircle2
                        className="h-3 w-3"
                        style={{ color: plan.color }}
                      />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6">
                {plan.tier === "AGENCY" ? (
                  <Link
                    href="mailto:hello@fitcoach.local?subject=Agency%20Plan"
                    className="flex h-11 w-full items-center justify-center rounded-2xl text-sm font-black text-white"
                    style={{
                      background: "linear-gradient(135deg,#6D28D9,#7C3AED)",
                    }}
                  >
                    Iletisime Gec
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={!plan.isUpgradeable || upgradingPlan !== null}
                    onClick={() =>
                      handleUpgrade(plan.tier === "TIER_1" ? "PRO" : "ELITE")
                    }
                    className="flex h-11 w-full items-center justify-center rounded-2xl text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: plan.isCurrent
                        ? `${plan.color}12`
                        : plan.isUpgradeable
                          ? plan.popular
                            ? "linear-gradient(135deg,#FB923C,#EA580C)"
                            : plan.color
                          : "#F8FAFC",
                      color: plan.isCurrent
                        ? plan.color
                        : plan.isUpgradeable
                          ? "#fff"
                          : "#94A3B8",
                      border: plan.isCurrent
                        ? `1px solid ${plan.color}33`
                        : plan.isUpgradeable
                          ? "none"
                          : "1px solid #E2E8F0",
                    }}
                  >
                    {upgradingPlan &&
                    (plan.tier === "TIER_1"
                      ? upgradingPlan === "PRO"
                      : upgradingPlan === "ELITE") ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      buttonLabel
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-6 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-black tracking-[-0.03em] text-slate-900">Faturalama Gecmisi</h2>
            <p className="mt-1 text-sm text-slate-500">Tum fatura ve odemeler.</p>
          </div>
          {info.portalAvailable ? (
            <button
              type="button"
              onClick={openPortal}
              disabled={portalBusy}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-60"
            >
              {portalBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Tumunu Yonet
            </button>
          ) : null}
        </div>

        {info.invoices.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Stripe faturalari henuz olusmamis. Ilk odemeden sonra bu alan dolacak.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Fatura No",
                    "Tarih",
                    "Aciklama",
                    "Tutar",
                    "Durum",
                    "",
                  ].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {info.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{invoice.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(invoice.date)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{invoice.description}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">{formatMoney(invoice.amount, invoice.currency)}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {invoice.pdfUrl ? (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
                        >
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 flex flex-col justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-6 py-5 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-sm">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900">
              {info.paymentMethod
                ? `${info.paymentMethod.brand.toUpperCase()} •••• ${info.paymentMethod.last4}`
                : "Kayitli odeme yontemi yok"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {info.paymentMethod
                ? `Son kullanma: ${String(info.paymentMethod.expMonth).padStart(2, "0")}/${info.paymentMethod.expYear}`
                : info.portalAvailable
                  ? info.paymentProvider === "STRIPE"
                    ? "Stripe portalinden kart ekleyebilirsin."
                    : "Iyzico odemeleri için iç faturalama sayfasına yönlendirilirsin."
                  : "Ödeme yöntemi yönetimi için sağlayıcı kurulumu gerekli."}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={openPortal}
            disabled={!info.portalAvailable || portalBusy}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {info.paymentMethod ? "Degistir" : "Portal Ac"}
          </button>
          <button
            type="button"
            onClick={openPortal}
            disabled={!info.portalAvailable || portalBusy}
            className="rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Yeni Kart Ekle
          </button>
        </div>
      </section>
    </div>
  );
}

export default function BillingSubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <BillingSubscriptionPageInner />
    </Suspense>
  );
}

export function InviteLinkBox() {
  const [copied, setCopied] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => response.json())
      .then((data) => setCoachId(data.profile?.userId ?? null))
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
        type="button"
        onClick={copy}
        className="h-10 rounded-xl bg-slate-800 px-4 text-sm font-black text-white transition hover:bg-slate-700"
      >
        {copied ? "Kopyalandi!" : "Kopyala"}
      </button>
    </div>
  );
}
