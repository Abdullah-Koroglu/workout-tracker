"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Gift, Loader2, Share2, Sparkles } from "lucide-react";

type ReferralItem = {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  referee: { id: string; name: string } | null;
};

export function CoachReferralGrowthCard({
  initialReferrals,
}: {
  initialReferrals: ReferralItem[];
}) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const primaryReferral = referrals[0] ?? null;
  const joinedCount = useMemo(
    () => referrals.filter((item) => item.status === "joined" || item.status === "converted").length,
    [referrals]
  );
  const pendingCount = useMemo(
    () => referrals.filter((item) => item.status === "pending").length,
    [referrals]
  );

  const referralUrl = primaryReferral
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?role=coach&ref=${primaryReferral.code}`
    : "";

  const createReferral = async () => {
    setBusy(true);
    const response = await fetch("/api/referrals", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.referral) return;
    setReferrals((current) => [data.referral, ...current]);
  };

  const copyLink = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50">
              <Gift className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-500">Growth Loop</p>
              <h2 className="text-lg font-black tracking-[-0.03em] text-slate-900">Koç referral programı</h2>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Başka bir bağımsız koçu FitCoach'a getir. Kazanımı sonra kurallandırabiliriz; bu yüzey şimdiden gerçek bir paylaşım ve takip akışı sağlar.
          </p>
        </div>

        <div className="grid min-w-[220px] grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xl font-black text-slate-900">{joinedCount}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Katılan koç</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xl font-black text-slate-900">{pendingCount}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Bekleyen</div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          <Share2 className="h-3.5 w-3.5" />
          Referral linki
        </div>

        {primaryReferral ? (
          <>
            <div className="mt-3 flex gap-2">
              <input
                readOnly
                value={referralUrl}
                className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Kopyalandı" : "Kopyala"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Bu link ile gelen yeni koç kaydı otomatik olarak referral listene düşer.
            </p>
          </>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void createReferral()}
              disabled={busy}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-700 px-4 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              İlk referral linkini oluştur
            </button>
            <p className="text-xs text-slate-500">Koçtan koça büyüme kanalı için tek tık başlangıç.</p>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {referrals.length > 0 ? (
          referrals.slice(0, 6).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900">{item.code}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.referee ? `${item.referee.name} kaydoldu` : "Henüz kullanılmadı"}
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-black ${
                  item.status === "joined" || item.status === "converted"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {item.status === "joined" || item.status === "converted" ? "Katıldı" : "Bekliyor"}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Henüz referral kodu oluşturulmadı.
          </div>
        )}
      </div>
    </section>
  );
}
