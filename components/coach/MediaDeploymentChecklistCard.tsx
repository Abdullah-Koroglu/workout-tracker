import { AlertTriangle, CheckCircle2, HardDriveUpload, ShieldCheck, Video } from "lucide-react";

import { getMediaDeploymentReadiness } from "@/lib/media-deployment-readiness";

const STATUS_STYLE = {
  ready: {
    badge: "bg-emerald-50 text-emerald-600",
    icon: CheckCircle2,
    card: "border-emerald-200 bg-emerald-50",
  },
  partial: {
    badge: "bg-amber-50 text-amber-600",
    icon: AlertTriangle,
    card: "border-amber-200 bg-amber-50",
  },
  missing: {
    badge: "bg-rose-50 text-rose-600",
    icon: AlertTriangle,
    card: "border-rose-200 bg-rose-50",
  },
} as const;

export function MediaDeploymentChecklistCard() {
  const readiness = getMediaDeploymentReadiness();
  const topStyle = STATUS_STYLE[readiness.status];
  const TopIcon = topStyle.icon;

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
              <HardDriveUpload className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Launch Readiness</p>
              <h2 className="text-xl font-black tracking-[-0.03em] text-slate-900">Media deployment checklist</h2>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Public marketplace görselleri ve hassas danışan medyası için deploy öncesi storage, CDN ve platform limitleri
            burada tek yerde görünür.
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${topStyle.badge}`}>
          <TopIcon className="h-3.5 w-3.5" />
          {readiness.status === "ready" ? "Ready" : readiness.status === "partial" ? "Kısmi hazır" : "Eksik"}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-3">
          {readiness.checks.map((check) => {
            const checkStyle = STATUS_STYLE[check.status];
            const CheckIcon = checkStyle.icon;
            return (
              <div key={check.key} className={`rounded-2xl border p-4 ${checkStyle.card}`}>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4" />
                  <div className="text-sm font-black text-slate-900">{check.label}</div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{check.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Deployment notları
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <p>Driver: <span className="font-black text-slate-900">{readiness.driver.toUpperCase()}</span></p>
              <p>Public base URL: <span className="font-black text-slate-900">{readiness.publicBaseUrl ?? "Tanımlı değil"}</span></p>
              <p>Önerilen minimum request body limiti: <span className="font-black text-slate-900">{readiness.recommendedBodySizeMb}MB</span></p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
              <Video className="h-4 w-4 text-orange-500" />
              Upload limit referansı
            </div>
            <div className="mt-3 space-y-3">
              {readiness.uploadLimits.map((limit) => (
                <div key={limit.label} className="rounded-xl bg-slate-50 px-3 py-3">
                  <div className="text-sm font-black text-slate-900">{limit.label}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Max {limit.maxSizeMb}MB
                    {limit.maxDurationSeconds ? ` · ${limit.maxDurationSeconds} sn sınırı` : ""}
                  </div>
                  <div className="mt-2 text-[11px] leading-5 text-slate-500">{limit.allowedTypes.join(", ")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
