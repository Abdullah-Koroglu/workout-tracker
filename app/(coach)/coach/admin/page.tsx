import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MediaDeploymentChecklistCard } from "@/components/coach/MediaDeploymentChecklistCard";

export default function CoachAdminPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="space-y-3">
        <Link
          href="/coach/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard'a dön
        </Link>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-500">Internal Ops</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900">Deploy ve launch kontrol yüzeyi</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Bu alan coach-facing ürün yüzeyi değil; launch öncesi storage, CDN ve upload limitlerinin hazır olup olmadığını
            hızlıca görmek için tutuluyor.
          </p>
        </div>
      </div>

      <MediaDeploymentChecklistCard />
    </div>
  );
}
