"use client";

import { useRouter } from "next/navigation";

import { ActionMenu } from "@/components/ui/action-menu";

export function DashboardActionMenu({ clientId }: { clientId: string }) {
  const router = useRouter();

  return (
    <ActionMenu
      items={[
        {
          label: "Client Detay",
          onClick: () => router.push(`/coach/clients/${clientId}`)
        },
        {
          label: "Ilerleme",
          onClick: () => router.push(`/coach/clients/${clientId}/progress`)
        }
      ]}
    />
  );
}
