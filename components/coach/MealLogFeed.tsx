"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useNotificationContext } from "@/contexts/NotificationContext";

type AdherenceTag = "GREEN" | "YELLOW" | "RED";

type MealLog = {
  id: string;
  photoUrl: string | null;
  adherenceTag: AdherenceTag;
  clientNote: string | null;
  aiSummary: string | null;
  loggedAt: string;
};

const TAG_META: Record<AdherenceTag, { emoji: string; label: string; color: string; bg: string }> = {
  GREEN: { emoji: "🟢", label: "Plana uygun", color: "#16A34A", bg: "#22C55E15" },
  YELLOW: { emoji: "🟡", label: "Hafif sapma", color: "#CA8A04", bg: "#F59E0B15" },
  RED: { emoji: "🔴", label: "Plan dışı", color: "#DC2626", bg: "#EF444415" },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export function MealLogFeed({ clientId }: { clientId: string }) {
  const { error } = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<MealLog[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch(`/api/coach/clients/${clientId}/nutrition-logs`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        error(data.error || "Beslenme akışı yüklenemedi.");
        setLoading(false);
        return;
      }
      setLogs(data.logs ?? []);
      setLoading(false);
    };
    void load();
  }, [clientId, error]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-black text-slate-800">Beslenme Akışı</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          Son {logs.length} öğün
        </span>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">Henüz öğün paylaşımı yok.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map((log) => {
            const meta = TAG_META[log.adherenceTag];
            return (
              <div key={log.id} className="rounded-2xl p-3" style={{ background: meta.bg, border: `1px solid ${meta.color}26` }}>
                <div className="flex gap-3">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200">
                    {log.photoUrl ? (
                      <Image src={log.photoUrl} alt="meal" fill className="object-cover" sizes="80px" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-white" style={{ background: meta.color }}>
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{timeAgo(log.loggedAt)}</span>
                    </div>
                    {log.clientNote && (
                      <p className="mt-1.5 text-xs font-semibold text-slate-700">“{log.clientNote}”</p>
                    )}
                    {log.aiSummary && (
                      <p className="mt-1 text-[11px] italic text-slate-500">AI: {log.aiSummary}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
