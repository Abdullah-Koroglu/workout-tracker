"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";

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
    <div className="space-y-4">
      <Link
        href="/client/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Dashboard'a geri don
      </Link>
      <h1 className="text-2xl font-bold">Coach Bul</h1>
      <div className="flex gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İsme göre ara" />
        <Button type="button" onClick={load}>Ara</Button>
      </div>
      <div className="space-y-2">
        {coaches.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Arama kriterine uygun coach bulunamadı.
          </div>
        ) : (
          coaches.map((coach) => (
            <div key={coach.id} className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{coach.name}</p>
                <p className="text-xs text-muted-foreground">{coach.email}</p>
                <p className="mt-1 text-xs text-emerald-600">
                  Durum: {coach.requestStatus ? statusLabel[coach.requestStatus] : "İstek gönderilmedi"}
                </p>
              </div>
              <div className="flex gap-2">
                {coach.requestStatus !== "PENDING" && coach.requestStatus !== "ACCEPTED" ? (
                  <Button
                    type="button"
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
          ))
        )}
      </div>
    </div>
  );
}
