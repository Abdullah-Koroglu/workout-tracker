"use client";

import { useRouter } from "next/navigation";

import { ActionMenu } from "@/components/ui/action-menu";
import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";

export function CoachClientActionsMenu({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { confirm } = useConfirmation();
  const { push } = useNotificationContext();

  const removeClient = async () => {
    const approved = await confirm({
      title: "Client bağlantısını kaldır",
      description: "Bu client ile koç bağlantısı kaldırılacak.",
      confirmText: "Kaldır",
      cancelText: "Vazgeç",
      danger: true
    });

    if (!approved) return;

    const response = await fetch(`/api/coach/clients/${clientId}/relation`, {
      method: "DELETE"
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      push(data.error || "Client bağlantısı kaldırılamadı.", "error");
      return;
    }

    push("Client bağlantısı kaldırıldı.", "success");
    router.push("/coach/clients");
    router.refresh();
  };

  return (
    <ActionMenu
      items={[
        {
          label: "Detay",
          onClick: () => router.push(`/coach/clients/${clientId}`)
        },
        {
          label: "İlerleme",
          onClick: () => router.push(`/coach/clients/${clientId}/progress`)
        },
        {
          label: "Client'ı kaldır",
          danger: true,
          onClick: () => {
            void removeClient();
          }
        }
      ]}
    />
  );
}
