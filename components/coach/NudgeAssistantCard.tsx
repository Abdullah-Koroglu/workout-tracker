"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useNotificationContext } from "@/contexts/NotificationContext";

type Candidate = { id: string; name: string };

export function NudgeAssistantCard() {
  const { success, error, warning } = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [count, setCount] = useState(0);
  const [clients, setClients] = useState<Candidate[]>([]);

  const loadCandidates = async () => {
    setLoading(true);
    const response = await fetch("/api/coach/nudges");
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      error(data.error || "Dürtme adayları yüklenemedi.");
      setLoading(false);
      return;
    }

    setCount(data.count ?? 0);
    setClients(data.clients ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadCandidates();
  }, []);

  const sendNudges = async () => {
    if (count === 0) {
      warning("Bu hafta için dürtülecek danışan yok.");
      return;
    }

    setSending(true);
    const response = await fetch("/api/coach/nudges", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setSending(false);

    if (!response.ok) {
      error(data.error || "Dürtmeler gönderilemedi.");
      return;
    }

    success(`${data.sent ?? 0} danışana dürtme gönderildi.`);
    await loadCandidates();
  };

  if (loading) {
    return (
      <div className="rounded-[18px] bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex h-16 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)", borderLeft: "4px solid #F97316" }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[15px] font-bold text-slate-800">Nudge Asistanı</span>
        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-600">
          {count} aday
        </span>
      </div>

      {count > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {clients.slice(0, 4).map((client) => (
            <span key={client.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              {client.name}
            </span>
          ))}
          {clients.length > 4 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
              +{clients.length - 4}
            </span>
          )}
        </div>
      ) : (
        <p className="mb-3 text-[12px] text-slate-400">Bu hafta ilk antrenmanını yapmayan danışan yok.</p>
      )}

      <button
        type="button"
        onClick={() => void sendNudges()}
        disabled={sending || count === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        {sending ? "Gönderiliyor..." : "Bu danışanları dürt"}
      </button>
    </div>
  );
}
