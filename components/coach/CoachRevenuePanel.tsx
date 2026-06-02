"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SubscriptionTier } from "@prisma/client";
import { TrendingUp, CreditCard, Users } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  subscription: { client: { name: string } } | null;
}

interface Subscription {
  id: string;
  status: string;
  client: { name: string };
  package: { title: string; price: number | null } | null;
  expiresAt: string | null;
}

const PANEL_COPY: Record<
  SubscriptionTier,
  {
    title: string;
    body: string;
    bullets: string[];
    ctaLabel: string;
  }
> = {
  FREE: {
    title: "Ucretsiz planda tabani kur, Pro ile buyumeyi ac",
    body: "Koctan SaaS odemesi aldiran ana fark, danisan yonetimi ile yeni musteri kazanimi ayni yerde toplamak.",
    bullets: [
      "15 danisana kadar buyu ve marketplace vitrini daha guclu kullan.",
      "Haftalik sessiz AI raporuyla riskli danisanlari erken yakala.",
      "Check-in, beslenme ve olcum takibini satis argumanina cevir.",
    ],
    ctaLabel: "Pro plana gec",
  },
  TIER_1: {
    title: "Pro ile operasyonu kur, Elite ile premium servisi sat",
    body: "Bu seviyeden sonra gelir artisi, daha cok danisan almak kadar daha iyi gorunen bir servis sunmaktan geliyor.",
    bullets: [
      "50 danisana kadar kapasite ac.",
      "Aksiyon merkezi ve AI strateji raporuyla ekibi hizlandir.",
      "Donusum vitrini ve premium servis algisini guclendir.",
    ],
    ctaLabel: "Elite farklarini gor",
  },
  TIER_2: {
    title: "Elite planda premium kocluk paketin guclu gorunuyor",
    body: "Bu katmanda esas hedef, retention ve donusum hikayelerini buyuterek daha yuksek fiyatli paketleri savunabilmek.",
    bullets: [
      "Haftalik AI strateji raporunu satis ve retention rutinine bagla.",
      "Toplu mesaj ve risk analitigi ile operasyon suresini kisalt.",
      "Marketplace ve sosyal kanit yuzeylerini aktif tut.",
    ],
    ctaLabel: "Planini yonet",
  },
  AGENCY: {
    title: "Agency katmani ekip workspace ve shared client akisini aciyor",
    body: "Bu seviyede deger artik tek koc kapasitesi degil; coklu koc, ortak roster ve merkezi billing ile operasyonu buyutmek.",
    bullets: [
      "Ekip bazli roller ve raporlama icin altyapiyi planla.",
      "Marketplace talebini ekip kapasitesine bagla.",
      "RTC ve operasyon panelleri icin sonraki sprinti hazirla.",
    ],
    ctaLabel: "Agency planini incele",
  },
};

export function CoachRevenuePanel({
  subscriptionTier,
  currentClientCount,
}: {
  subscriptionTier: SubscriptionTier;
  currentClientCount: number;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<{ totalRevenue: number; paymentCount: number } | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/payments").then((r) => r.json()),
      fetch("/api/subscriptions?status=active").then((r) => r.json()),
    ]).then(([p, s]) => {
      setPayments(p.payments ?? []);
      setSummary(p.summary);
      setSubs(s.subscriptions ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />;

  const totalActive = subs.length;
  const mrr = subs.reduce((sum, s) => sum + (s.package?.price ?? 0), 0);
  const panelCopy = PANEL_COPY[subscriptionTier];
  const capacityHint =
    subscriptionTier === "FREE"
      ? `${currentClientCount}/3 danisan slotu kullaniliyor`
      : subscriptionTier === "TIER_1"
        ? `${currentClientCount}/15 aktif danisan kapasitesi`
        : subscriptionTier === "TIER_2"
          ? `${currentClientCount}/50 aktif danisan kapasitesi`
          : `${currentClientCount} aktif danisan ile ekip hazirligi`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
          <CreditCard className="h-4 w-4 text-emerald-600" />
        </div>
        <h2 className="text-base font-black text-slate-800">Gelir Paneli</h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white border border-slate-100 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Toplam Gelir</p>
          <p className="mt-1 text-lg font-black text-emerald-600">
            {(summary?.totalRevenue ?? 0).toLocaleString("tr-TR")} ₺
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">MRR</p>
          <p className="mt-1 text-lg font-black text-orange-500">
            {mrr.toLocaleString("tr-TR")} ₺
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Aktif Abone</p>
          <p className="mt-1 text-lg font-black text-indigo-500">{totalActive}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300">Koc SaaS Degeri</p>
            <h3 className="mt-2 text-lg font-black tracking-[-0.03em]">{panelCopy.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">{panelCopy.body}</p>
            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75">
              {capacityHint}
            </div>
          </div>

          <Link
            href="/coach/subscription"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 px-4 text-sm font-black text-white shadow-sm transition hover:opacity-95"
          >
            {panelCopy.ctaLabel}
          </Link>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {panelCopy.bullets.map((bullet) => (
            <div key={bullet} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/80">
              {bullet}
            </div>
          ))}
        </div>
      </div>

      {payments.length === 0 && subs.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-center text-xs text-slate-400">
          Henüz abonelik veya ödeme kaydı yok. Müşteriler paket satın aldığında burada görünecek.
        </div>
      ) : (
        <>
          {subs.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-600">
                <Users className="h-3.5 w-3.5" /> Aktif Abonelikler
              </div>
              {subs.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{s.client.name}</p>
                    <p className="text-[11px] text-slate-400">{s.package?.title ?? "Paket yok"}</p>
                  </div>
                  <p className="text-sm font-black text-emerald-600">
                    {s.package?.price ? `${s.package.price.toLocaleString("tr-TR")} ₺` : "—"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {payments.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-600">
                <TrendingUp className="h-3.5 w-3.5" /> Son Ödemeler
              </div>
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-700">{p.subscription?.client.name ?? "—"}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString("tr-TR")} · {p.status}
                    </p>
                  </div>
                  <p className="font-black text-emerald-600">{p.amount.toLocaleString("tr-TR")} {p.currency}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
