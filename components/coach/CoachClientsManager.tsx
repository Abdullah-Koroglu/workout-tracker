"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";

type ClientRelationItem = {
  id: string;
  relationId: string;
  name: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
};

export function CoachClientsManager({
  accepted,
  pending
}: {
  accepted: ClientRelationItem[];
  pending: ClientRelationItem[];
}) {
  const router = useRouter();
  const { push } = useNotificationContext();
  const { confirm } = useConfirmation();
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACCEPTED" | "PENDING">("ALL");

  const updateRelation = async (clientId: string, status: "ACCEPTED" | "REJECTED") => {
    setActiveClientId(clientId);
    const response = await fetch(`/api/coach/clients/${clientId}/relation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setActiveClientId(null);

    if (!response.ok) {
      push("İstek güncellenemedi.");
      return;
    }

    push(status === "ACCEPTED" ? "Danışan isteği kabul edildi." : "Danışan isteği reddedildi.");
    router.refresh();
  };

  const removeClient = async (clientId: string) => {
    const approved = await confirm({
      title: "Client baglantisini kaldir",
      description: "Bu danışan ile ilişkiyi kaldırmak istediğinize emin misiniz?",
      confirmText: "Kaldir",
      cancelText: "Vazgec",
      danger: true
    });

    if (!approved) {
      return;
    }

    setActiveClientId(clientId);
    const response = await fetch(`/api/coach/clients/${clientId}/relation`, {
      method: "DELETE"
    });
    const data = await response.json().catch(() => ({}));
    setActiveClientId(null);

    if (!response.ok) {
      push(data.error || "Danışan bağlantısı kaldırılamadı.");
      return;
    }

    push("Danışan bağlantısı kaldırıldı.");
    router.refresh();
  };

  const acceptedFiltered = accepted.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
  });

  const pendingFiltered = pending.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
  });

  const allCount = accepted.length + pending.length;

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-black/5 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Danışan adı veya e-posta ara..."
              className="h-10 w-full rounded-lg border-0 bg-muted/60 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={[
                "rounded-full px-3 py-1 font-semibold",
                filter === "ALL" ? "bg-primary/15 text-foreground ring-1 ring-primary/30" : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              Tümü ({allCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("ACCEPTED")}
              className={[
                "rounded-full px-3 py-1 font-semibold",
                filter === "ACCEPTED" ? "bg-secondary/20 text-secondary ring-1 ring-secondary/30" : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              Aktif ({accepted.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("PENDING")}
              className={[
                "rounded-full px-3 py-1 font-semibold",
                filter === "PENDING" ? "bg-primary/15 text-foreground ring-1 ring-primary/30" : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              Bekleyen ({pending.length})
            </button>
          </div>
        </div>
      </section>

      {(filter === "ALL" || filter === "ACCEPTED") && (
        <section className="space-y-3">
          <h2 className="font-semibold">Aktif Danışanlar</h2>
          {acceptedFiltered.length === 0 ? (
            <div className="rounded-xl bg-muted/50 p-6 text-sm text-muted-foreground">
              Aktif danışan bulunamadı.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {acceptedFiltered.map((client) => (
                <div key={client.relationId} className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-foreground">{client.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{client.email}</p>
                    </div>
                    <ActionMenu
                      items={[
                        {
                          label: "Detay",
                          onClick: () => {
                            router.push(`/coach/clients/${client.id}`);
                          }
                        },
                        {
                          label: "İlerleme",
                          onClick: () => {
                            router.push(`/coach/clients/${client.id}/progress`);
                          }
                        },
                        {
                          label: "Danışanı kaldır",
                          danger: true,
                          onClick: () => {
                            void removeClient(client.id);
                          }
                        }
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(filter === "ALL" || filter === "PENDING") && (
        <section className="space-y-3">
          <h2 className="font-semibold">Bekleyen İstekler</h2>
          {pendingFiltered.length === 0 ? (
            <div className="rounded-xl bg-muted/50 p-6 text-sm text-muted-foreground">
              Bekleyen istek yok.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingFiltered.map((client) => (
                <div key={client.relationId} className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-black/5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={activeClientId === client.id}
                      onClick={() => updateRelation(client.id, "ACCEPTED")}
                    >
                      Kabul Et
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-red-600"
                      disabled={activeClientId === client.id}
                      onClick={() => updateRelation(client.id, "REJECTED")}
                    >
                      Reddet
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
