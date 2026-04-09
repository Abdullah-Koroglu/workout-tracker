"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

    push(status === "ACCEPTED" ? "Client isteği kabul edildi." : "Client isteği reddedildi.");
    router.refresh();
  };

  const removeClient = async (clientId: string) => {
    const approved = await confirm({
      title: "Client baglantisini kaldir",
      description: "Bu client ile iliskiyi kaldirmak istediginize emin misiniz?",
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
      push(data.error || "Client bağlantısı kaldırılamadı.");
      return;
    }

    push("Client bağlantısı kaldırıldı.");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-semibold">Kabul Edilenler</h2>
        {accepted.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Henüz kabul edilmiş client yok.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {accepted.map((client) => (
              <div key={client.relationId} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
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
                        label: "Client'ı kaldır",
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

      <section className="space-y-3">
        <h2 className="font-semibold">Bekleyen İstekler</h2>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Bekleyen istek yok.
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((client) => (
              <div key={client.relationId} className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="bg-emerald-600 text-white hover:opacity-90"
                    disabled={activeClientId === client.id}
                    onClick={() => updateRelation(client.id, "ACCEPTED")}
                  >
                    Kabul Et
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
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
    </div>
  );
}
