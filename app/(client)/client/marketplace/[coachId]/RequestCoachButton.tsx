"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { useNotificationContext } from "@/contexts/NotificationContext";

type RelationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | null;

export function RequestCoachButton({
  coachId,
  initialStatus,
  className,
}: {
  coachId: string;
  initialStatus: RelationStatus;
  className?: string;
}) {
  const { push } = useNotificationContext();
  const [status, setStatus] = useState<RelationStatus>(initialStatus);
  const [submitting, setSubmitting] = useState(false);

  const disabled = submitting || status === "PENDING" || status === "ACCEPTED";

  const label = status === "ACCEPTED"
    ? "Bağlantı Kuruldu"
    : status === "PENDING"
      ? "İstek Gönderildi"
      : submitting
        ? "Gönderiliyor..."
        : "Bağlantı İsteği Gönder";

  const handleRequest = async () => {
    if (disabled) return;

    setSubmitting(true);
    const response = await fetch("/api/client/coaches/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId }),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      push(data.error || "Koç isteği gönderilemedi.");
      return;
    }

    setStatus("PENDING");
    push("Koç isteği gönderildi.");
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        void handleRequest();
      }}
      className={className}
    >
      <UserPlus className="h-4 w-4" />
      {label}
    </button>
  );
}
