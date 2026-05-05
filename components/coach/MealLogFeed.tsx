"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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

type DayGroup = {
  dateKey: string;   // "2026-05-05"
  dateLabel: string; // "5 Mayıs Pazartesi"
  logs: MealLog[];
  green: number;
  yellow: number;
  red: number;
};

const TAG_META: Record<AdherenceTag, { emoji: string; label: string; color: string; bg: string }> = {
  GREEN:  { emoji: "🟢", label: "Plana uygun", color: "#16A34A", bg: "#22C55E15" },
  YELLOW: { emoji: "🟡", label: "Hafif sapma",  color: "#CA8A04", bg: "#F59E0B15" },
  RED:    { emoji: "🔴", label: "Plan dışı",    color: "#DC2626", bg: "#EF444415" },
};

function toDateKey(iso: string) {
  return iso.slice(0, 10); // "2026-05-05"
}

function toLongLabel(dateKey: string) {
  return new Date(dateKey + "T12:00:00").toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", weekday: "long",
  });
}

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function AdherenceDots({ green, yellow, red }: { green: number; yellow: number; red: number }) {
  return (
    <span className="flex items-center gap-1 text-[11px]">
      {green  > 0 && <span className="flex items-center gap-0.5"><span className="text-green-500">🟢</span><span className="font-bold text-green-700">{green}</span></span>}
      {yellow > 0 && <span className="flex items-center gap-0.5"><span className="text-amber-500">🟡</span><span className="font-bold text-amber-700">{yellow}</span></span>}
      {red    > 0 && <span className="flex items-center gap-0.5"><span className="text-red-500">🔴</span><span className="font-bold text-red-700">{red}</span></span>}
    </span>
  );
}

function MealCard({ log }: { log: MealLog }) {
  const meta = TAG_META[log.adherenceTag];
  return (
    <div className="rounded-2xl p-3" style={{ background: meta.bg, border: `1px solid ${meta.color}26` }}>
      <div className="flex gap-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200">
          {log.photoUrl ? (
            <Image src={log.photoUrl} alt="meal" fill className="object-cover" sizes="64px" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl">🍽️</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-white" style={{ background: meta.color }}>
              {meta.emoji} {meta.label}
            </span>
            <span className="text-[10px] text-slate-400 shrink-0">{timeStr(log.loggedAt)}</span>
          </div>
          {log.clientNote && (
            <p className="mt-1.5 text-xs font-semibold text-slate-700 line-clamp-2">"{log.clientNote}"</p>
          )}
          {log.aiSummary && (
            <p className="mt-1 text-[11px] italic text-slate-500 line-clamp-2">🤖 {log.aiSummary}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Day view ─────────────────────────────────────────────────────────────────
function DayView({ days }: { days: DayGroup[] }) {
  const [idx, setIdx] = useState(0); // 0 = most recent day

  if (days.length === 0) {
    return <p className="py-6 text-center text-xs text-slate-400">Henüz öğün paylaşımı yok.</p>;
  }

  const day = days[idx];
  const isFirst = idx === 0;
  const isLast  = idx === days.length - 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Day navigator */}
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2" style={{ border: "1px solid #E2E8F0" }}>
        <button
          type="button"
          onClick={() => setIdx((i) => i + 1)}
          disabled={isLast}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-center">
          <p className="text-[12px] font-black text-slate-800">{day.dateLabel}</p>
          <div className="mt-0.5 flex items-center justify-center gap-2">
            <AdherenceDots green={day.green} yellow={day.yellow} red={day.red} />
            <span className="text-[10px] text-slate-400">{day.logs.length} öğün</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIdx((i) => i - 1)}
          disabled={isFirst}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day pagination dots */}
      {days.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {days.slice(0, 7).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className="rounded-full transition-all"
              style={{
                width: i === idx ? 20 : 6,
                height: 6,
                background: i === idx ? "#F97316" : "#E2E8F0",
              }}
            />
          ))}
          {days.length > 7 && (
            <span className="text-[10px] text-slate-400">+{days.length - 7}</span>
          )}
        </div>
      )}

      {/* Logs for this day */}
      <div className="flex flex-col gap-2.5">
        {day.logs.map((log) => <MealCard key={log.id} log={log} />)}
      </div>
    </div>
  );
}

// ─── Bulk view ────────────────────────────────────────────────────────────────
function BulkView({ days }: { days: DayGroup[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  if (days.length === 0) {
    return <p className="py-6 text-center text-xs text-slate-400">Henüz öğün paylaşımı yok.</p>;
  }

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {days.map((day) => {
        const isOpen = !collapsed.has(day.dateKey);
        // Pick the dominant adherence color for the left border
        const borderColor = day.red > 0 ? "#EF4444" : day.yellow > 0 ? "#F59E0B" : "#22C55E";
        return (
          <div key={day.dateKey} className="overflow-hidden rounded-2xl bg-white" style={{ border: "1px solid rgba(0,0,0,0.06)", borderLeft: `3px solid ${borderColor}` }}>
            {/* Day header — always visible */}
            <button
              type="button"
              onClick={() => toggle(day.dateKey)}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-[12px] font-black text-slate-800">{day.dateLabel}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <AdherenceDots green={day.green} yellow={day.yellow} red={day.red} />
                  <span className="text-[10px] text-slate-400">{day.logs.length} öğün</span>
                </div>
              </div>
              <span
                className="text-[10px] font-bold text-slate-400 transition-transform duration-200"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}
              >
                ▾
              </span>
            </button>

            {/* Logs — collapsible */}
            {isOpen && (
              <div className="flex flex-col gap-2 px-3 pb-3">
                {day.logs.map((log) => <MealCard key={log.id} log={log} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MealLogFeed({ clientId }: { clientId: string }) {
  const { error } = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [view, setView] = useState<"daily" | "bulk">("daily");

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

  // Group logs by calendar day, DESC
  const days = useMemo<DayGroup[]>(() => {
    const map = new Map<string, MealLog[]>();
    for (const log of logs) {
      const key = toDateKey(log.loggedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, dayLogs]) => ({
        dateKey: key,
        dateLabel: toLongLabel(key),
        logs: dayLogs,
        green:  dayLogs.filter((l) => l.adherenceTag === "GREEN").length,
        yellow: dayLogs.filter((l) => l.adherenceTag === "YELLOW").length,
        red:    dayLogs.filter((l) => l.adherenceTag === "RED").length,
      }));
  }, [logs]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-black text-slate-800">Beslenme Akışı</p>
          <p className="text-[10px] text-slate-400">{days.length} gün · {logs.length} öğün</p>
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl bg-slate-100 p-0.5" style={{ gap: 2 }}>
          {([["daily", "Günlük"], ["bulk", "Toplu"]] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className="rounded-[10px] px-3 py-1 text-[11px] font-black transition-all"
              style={{
                background: view === key ? "#fff" : "transparent",
                color: view === key ? "#1E293B" : "#94A3B8",
                boxShadow: view === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      ) : view === "daily" ? (
        <DayView days={days} />
      ) : (
        <BulkView days={days} />
      )}
    </div>
  );
}
