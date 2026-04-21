"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, ChevronLeft, Clock3, MessageCircle, Search, ShieldCheck, UserPlus, Users } from "lucide-react";

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

export default function ClientCoachesContent() {
  const { push } = useNotificationContext();
  const { confirm } = useConfirmation();
  const [search, setSearch] = useState("");
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACCEPTED" | "PENDING" | "AVAILABLE">("ALL");
  const [loadingCoachId, setLoadingCoachId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const query = search ? `?q=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/client/coaches${query}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      push(data.error || "Koç listesi yüklenemedi.");
      return;
    }
    setCoaches(data.coaches || []);
  }, [search, push]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const accepted = coaches.filter((coach) => coach.requestStatus === "ACCEPTED").length;
    const pending = coaches.filter((coach) => coach.requestStatus === "PENDING").length;
    const available = coaches.filter((coach) => coach.requestStatus === null || coach.requestStatus === "REJECTED").length;
    return { accepted, pending, available };
  }, [coaches]);

  const filteredCoaches = useMemo(() => {
    switch (activeFilter) {
      case "ACCEPTED":
        return coaches.filter((coach) => coach.requestStatus === "ACCEPTED");
      case "PENDING":
        return coaches.filter((coach) => coach.requestStatus === "PENDING");
      case "AVAILABLE":
        return coaches.filter((coach) => coach.requestStatus === null || coach.requestStatus === "REJECTED");
      default:
        return coaches;
    }
  }, [activeFilter, coaches]);

  const requestCoach = async (coachId: string) => {
    setLoadingCoachId(coachId);
    const response = await fetch("/api/client/coaches/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId })
    });
    setLoadingCoachId(null);

    if (!response.ok) {
      push("Koç isteği gönderilemedi.");
      return;
    }

    push("Koç isteği gönderildi.");
    await load();
  };

  const disconnectCoach = async (coachId: string) => {
    const approved = await confirm({
      title: "Koç bağlantısını kaldır",
      description: "Bu koç ile bağlantıyı kaldırmak istediğinize emin misiniz?",
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
      push(data.error || "Koç bağlantısı kaldırılamadı.");
      return;
    }

    push("Koç bağlantısı kaldırıldı.");
    await load();
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 shadow-sm md:rounded-[28px] md:p-6">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 hover:text-emerald-900 md:text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard'a geri dön
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 md:text-xs">Koç Ağı</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Koçlarını Yönet</h1>
            <p className="mt-1 text-xs text-slate-600 md:text-sm">Uygun koçlara istek gönder, bekleyen talepleri takip et ve aktif bağlantılarını yönet.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Toplam</p>
              <p className="mt-1 text-lg font-black text-slate-900">{coaches.length}</p>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Aktif</p>
              <p className="mt-1 text-lg font-black text-emerald-700">{stats.accepted}</p>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Bekleyen</p>
              <p className="mt-1 text-lg font-black text-amber-600">{stats.pending}</p>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Uygun</p>
              <p className="mt-1 text-lg font-black text-sky-700">{stats.available}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border bg-card p-3 md:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter("ALL")}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold",
                activeFilter === "ALL"
                  ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                  : "bg-muted text-muted-foreground"
              ].join(" ")}
            >
              Tümü ({coaches.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("ACCEPTED")}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold",
                activeFilter === "ACCEPTED"
                  ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                  : "bg-muted text-muted-foreground"
              ].join(" ")}
            >
              Aktif ({stats.accepted})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("PENDING")}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold",
                activeFilter === "PENDING"
                  ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                  : "bg-muted text-muted-foreground"
              ].join(" ")}
            >
              Bekleyen ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("AVAILABLE")}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold",
                activeFilter === "AVAILABLE"
                  ? "bg-sky-100 text-sky-800 ring-1 ring-sky-200"
                  : "bg-muted text-muted-foreground"
              ].join(" ")}
            >
              Uygun ({stats.available})
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İsme göre koç ara"
                className="pl-9"
              />
            </div>
            <Button type="button" onClick={load} className="w-full sm:w-auto">
              Ara
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 md:space-y-3">
        {filteredCoaches.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Bu filtre için gösterilecek koç bulunamadı.
          </div>
        ) : (
          filteredCoaches.map((coach) => (
            <div key={coach.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm ring-1 ring-black/5 md:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <p className="line-clamp-1 text-sm font-semibold md:text-base">{coach.name}</p>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{coach.email}</p>
                  {coach.requestStatus === "ACCEPTED" ? (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 md:text-xs">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Aktif bağlantı
                    </p>
                  ) : coach.requestStatus === "PENDING" ? (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 md:text-xs">
                      <Clock3 className="h-3.5 w-3.5" />
                      Onay bekliyor
                    </p>
                  ) : (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 md:text-xs">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {coach.requestStatus ? statusLabel[coach.requestStatus] : "İstek gönderilmedi"}
                    </p>
                  )}
                </div>

                <div className="flex w-full gap-2 sm:w-auto">
                  {coach.requestStatus !== "PENDING" && coach.requestStatus !== "ACCEPTED" ? (
                    <Button
                      type="button"
                      className="w-full sm:w-auto"
                      disabled={loadingCoachId === coach.id}
                      onClick={() => requestCoach(coach.id)}
                    >
                      <UserPlus className="mr-1 h-4 w-4" />
                      {coach.requestStatus === "REJECTED" ? "Tekrar İstek Gönder" : "İstek Gönder"}
                    </Button>
                  ) : null}

                  {coach.requestStatus === "PENDING" ? (
                    <Button type="button" variant="outline" disabled className="w-full sm:w-auto">
                      <Clock3 className="mr-1 h-4 w-4" />
                      Beklemede
                    </Button>
                  ) : null}

                  {coach.requestStatus === "ACCEPTED" ? (
                    <>
                      <Link href={`/client/messages?withUserId=${coach.id}`} className="w-full sm:w-auto">
                        <Button type="button" variant="outline" className="w-full sm:w-auto">
                          <MessageCircle className="mr-1 h-4 w-4" />
                          Mesaj
                        </Button>
                      </Link>
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
                    </>
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
