"use client";

import { useEffect, useState } from "react";
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

export function CoachRevenuePanel() {
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
