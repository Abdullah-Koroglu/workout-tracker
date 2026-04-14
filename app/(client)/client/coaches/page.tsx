"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Search, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/action-menu";
import { Input } from "@/components/ui/input";
import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";

type Coach = {
  id: string;
  name: string;
  email: string;
  requestStatus: "PENDING" | "ACCEPTED" | "REJECTED" | null;
};

const statusLabel: Record<NonNullable<Coach["requestStatus"]>, string> = {
  PENDING: "Bekliyor",
  ACCEPTED: "Kabul Edildi",
  REJECTED: "Reddedildi"
};

export default function ClientCoachesPage() {
  const { push } = useNotificationContext();
  const { confirm } = useConfirmation();
  const [search, setSearch] = useState("");
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loadingCoachId, setLoadingCoachId] = useState<string | null>(null);

  const load = async () => {
    const query = search ? `?q=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/client/coaches${query}`);
    const data = await res.json();
    setCoaches(data.coaches || []);
  };

  useEffect(() => {
    load();
  }, []);

  const requestCoach = async (coachId: string) => {
    setLoadingCoachId(coachId);
    const response = await fetch("/api/client/coaches/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId })
    });
    setLoadingCoachId(null);

    if (!response.ok) {
      push("Coach isteği gönderilemedi.");
      return;
    }

    push("Coach isteği gönderildi.");
    await load();
  };

  const disconnectCoach = async (coachId: string) => {
    const approved = await confirm({
      title: "Coach baglantisini kaldir",
      description: "Bu coach ile baglantiyi kaldirmak istediginize emin misiniz?",
      confirmText: "Kaldir",
      cancelText: "Vazgec",
      danger: true
    });

    if (!approved) {
      return;
    }

    setLoadingCoachId(coachId);
    const response = await fetch(`/api/client/coaches/${coachId}`, {
      method: "DELETE"
    });
    const data = await response.json().catch(() => ({}));
    setLoadingCoachId(null);

    if (!response.ok) {
      push(data.error || "Coach bağlantısı kaldırılamadı.");
      return;
    }

    push("Coach bağlantısı kaldırıldı.");
    await load();
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 shadow-sm md:rounded-[28px] md:p-6">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 hover:text-emerald-900 md:text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard'a geri dön
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 md:text-xs">Coach Network</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Coach Bul</h1>
            <p className="mt-1 text-xs text-slate-600 md:text-sm">Coach ara, istek gönder ve mevcut bağlantılarını yönet.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Toplam</p>
              <p className="mt-1 text-lg font-black text-slate-900">{coaches.length}</p>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Kabul</p>
              <p className="mt-1 text-lg font-black text-emerald-700">{coaches.filter((coach) => coach.requestStatus === "ACCEPTED").length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border bg-card p-3 md:p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsme göre ara"
              className="pl-9"
            />
          </div>
          <Button type="button" onClick={load} className="w-full sm:w-auto">
            Ara
          </Button>
        </div>
      </div>

      <div className="space-y-2.5 md:space-y-3">
        {coaches.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Arama kriterine uygun coach bulunamadı.
          </div>
        ) : (
          coaches.map((coach) => (
            <div key={coach.id} className="rounded-2xl border p-3.5 shadow-sm md:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <p className="line-clamp-1 text-sm font-semibold md:text-base">{coach.name}</p>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{coach.email}</p>
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold md:text-xs bg-muted text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {coach.requestStatus ? statusLabel[coach.requestStatus] : "İstek gönderilmedi"}
                  </p>
                </div>

                <div className="flex w-full gap-2 sm:w-auto">
                  {coach.requestStatus !== "PENDING" && coach.requestStatus !== "ACCEPTED" ? (
                    <Button
                      type="button"
                      className="w-full sm:w-auto"
                      disabled={loadingCoachId === coach.id}
                      onClick={() => requestCoach(coach.id)}
                    >
                      {coach.requestStatus === "REJECTED" ? "Tekrar İstek Gönder" : "İstek Gönder"}
                    </Button>
                  ) : null}

                  {coach.requestStatus === "ACCEPTED" ? (
                    <ActionMenu
                      items={[
                        {
                          label: "Bağlantıyı Kaldır",
                          danger: true,
                          onClick: () => {
                            void disconnectCoach(coach.id);
                          }
                        }
                      ]}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
