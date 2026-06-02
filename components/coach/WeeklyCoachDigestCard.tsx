import Link from "next/link";
import type { SubscriptionTier } from "@prisma/client";
import { CheckCircle2, Lock, Sparkles, TrendingUp, TriangleAlert, Users } from "lucide-react";

import type { CoachWeeklyDigest } from "@/lib/coach-weekly-digest";

type WeeklyCoachDigestCardProps = {
  digest: CoachWeeklyDigest;
  subscriptionTier: SubscriptionTier;
};

const PAID_TIERS: SubscriptionTier[] = ["TIER_1", "TIER_2", "AGENCY"];

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "green" | "orange" | "violet";
}) {
  const colorMap = {
    slate: "bg-slate-50 text-slate-900",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    violet: "bg-violet-50 text-violet-700",
  } as const;

  return (
    <div className={`rounded-2xl border border-slate-100 p-3 ${colorMap[tone]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black tracking-[-0.04em]">{value}</div>
    </div>
  );
}

export function WeeklyCoachDigestCard({ digest, subscriptionTier }: WeeklyCoachDigestCardProps) {
  const isUnlocked = PAID_TIERS.includes(subscriptionTier);

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-500">Sessiz AI Raporu</p>
                <h2 className="text-lg font-black tracking-[-0.03em] text-slate-900">Haftalik Koç Digest</h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">{digest.weekLabel}</p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              isUnlocked
                ? "bg-emerald-50 text-emerald-600"
                : "border border-orange-200 bg-orange-50 text-orange-600"
            }`}
          >
            {isUnlocked ? "Pro / Elite aktif" : "Pro ile acilir"}
          </span>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-100 px-5 py-4 md:grid-cols-4">
        <StatCard label="Tamamlanma" value={`%${digest.completionRate}`} tone="green" />
        <StatCard label="PR" value={`${digest.prCount}`} tone="orange" />
        <StatCard label="Olcum Logu" value={`${digest.bodyLogCount}`} tone="violet" />
        <StatCard
          label="Beslenme Uyumu"
          value={digest.nutritionLogCount > 0 ? `%${digest.nutritionAdherenceRate}` : "-"}
          tone="slate"
        />
      </div>

      {isUnlocked ? (
        <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <TrendingUp className="h-3.5 w-3.5" />
                Ozet
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{digest.summary}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  Risk Sinyalleri
                </div>
                <div className="mt-3 space-y-2">
                  {digest.riskSignals.length > 0 ? (
                    digest.riskSignals.map((signal) => (
                      <div key={signal} className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-700">
                        {signal}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      Bu hafta belirgin risk sinyali gorunmuyor.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Oncelikli Aksiyonlar
                </div>
                <div className="mt-3 space-y-2">
                  {digest.suggestedActions.map((action) => (
                    <div key={action} className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-700">
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <Users className="h-3.5 w-3.5" />
                One Cikanlar
              </div>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl bg-emerald-50 px-3 py-3">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Top performer</div>
                  <div className="mt-1 text-sm font-black text-emerald-700">
                    {digest.topPerformer ? digest.topPerformer.name : "Bu hafta veri olusmadi"}
                  </div>
                  {digest.topPerformer ? (
                    <div className="mt-1 text-xs text-emerald-700/80">{digest.topPerformer.reason}</div>
                  ) : null}
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Riskli danisanlar</div>
                  <div className="space-y-2">
                    {digest.atRiskClients.length > 0 ? (
                      digest.atRiskClients.map((client) => (
                        <div key={client.clientId} className="rounded-xl bg-slate-50 px-3 py-2">
                          <div className="text-sm font-bold text-slate-800">{client.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{client.reason}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        Yakindan takip gerektiren danisan gorunmuyor.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-5">
          <div className="rounded-[22px] border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100">
                <Lock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-slate-900">Bu haftayi AI ile yonet</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Pro ile riskli danisanlari, beslenme uyumunu ve haftalik aksiyon onerilerini tek ekranda gorursun.
                </p>
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  {[
                    `${digest.activeClients} aktif danisan izlendi`,
                    `${digest.completedCount} tamamlanan antrenman var`,
                    `${digest.atRiskClients.length} danisan risk sinyali uretiyor`,
                  ].map((item) => (
                    <div key={item} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                      {item}
                    </div>
                  ))}
                </div>
                <Link
                  href="/coach/subscription"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 px-5 text-sm font-black text-white shadow-sm transition hover:opacity-95"
                >
                  Pro plana gec ve raporu ac
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
