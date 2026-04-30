"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, MessageSquare, Loader2 } from "lucide-react";

type ChurnClient = {
  clientId: string;
  name: string;
  lastWorkout: string | null;
  inactiveDays: number | null;
  missedCount: number;
};

export function ChurnAlerts() {
  const [risks, setRisks] = useState<ChurnClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach/clients/churn-risks")
      .then((r) => r.json())
      .then((d) => setRisks(d.risks ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-16 items-center justify-center rounded-2xl bg-amber-50">
      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
    </div>
  );

  if (risks.length === 0) return null;

  return (
    <div
      className="rounded-[18px] bg-white p-4 shadow-sm"
      style={{ border: "1px solid rgba(0,0,0,0.06)", borderLeft: "4px solid #F59E0B" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h3 className="text-[14px] font-black text-slate-800">Risk Altındaki Danışanlar</h3>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
          {risks.length}
        </span>
      </div>

      <div className="space-y-2">
        {risks.map((c) => (
          <div
            key={c.clientId}
            className="flex items-center justify-between rounded-xl bg-amber-50/60 px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-bold text-slate-800">{c.name}</p>
              <p className="text-xs text-slate-500">
                {c.inactiveDays !== null
                  ? `${c.inactiveDays} gündür antrenman yok`
                  : "Hiç antrenman tamamlamadı"}
                {c.missedCount > 0 && ` · ${c.missedCount} atlanmış program`}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/coach/clients/${c.clientId}`}
                className="flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-black/5 hover:bg-slate-50"
              >
                Profil
              </Link>
              <Link
                href={`/coach/messages?withUserId=${c.clientId}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white hover:bg-amber-600"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
