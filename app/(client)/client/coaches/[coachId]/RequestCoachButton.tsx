"use client";

import { useState } from "react";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { useNotificationContext } from "@/contexts/NotificationContext";

type RelationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | null;

export function RequestCoachButton({
  coachId,
  initialStatus,
}: {
  coachId: string;
  initialStatus: RelationStatus;
}) {
  const { push } = useNotificationContext();
  const [status, setStatus]       = useState<RelationStatus>(initialStatus);
  const [submitting, setSubmitting] = useState(false);

  const disabled = submitting || status === "PENDING" || status === "ACCEPTED";

  const handleRequest = async () => {
    if (disabled) return;
    setSubmitting(true);
    const res  = await fetch("/api/client/coaches/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { push(data.error || "Koç isteği gönderilemedi."); return; }
    setStatus("PENDING");
    push("Koç isteği gönderildi.");
  };

  if (status === "ACCEPTED") {
    return (
      <div
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider"
        style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A", border: "1px solid rgba(34,197,94,0.2)" }}
      >
        <UserCheck className="h-4 w-4" />
        Bağlantı Kuruldu
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider"
        style={{ background: "rgba(245,158,11,0.1)", color: "#D97706", border: "1px solid rgba(245,158,11,0.2)" }}
      >
        <Loader2 className="h-4 w-4" />
        İstek Gönderildi — Bekleniyor
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void handleRequest()}
      className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{
        background: "linear-gradient(135deg, #FB923C, #EA580C)",
        boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
      }}
    >
      {submitting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {submitting ? "Gönderiliyor..." : "Bağlantı İsteği Gönder"}
    </button>
  );
}
