"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

export type BodyLog = {
  id: string;
  date: string;
  weight: number | null;
  shoulder: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arm: number | null;
  leg: number | null;
  frontPhotoUrl: string | null;
  sidePhotoUrl: string | null;
  backPhotoUrl: string | null;
};

type Props = {
  logs: BodyLog[];
  activeMeasurements: string[];
};

const MEASUREMENT_LABELS: Record<string, string> = {
  shoulder: "Omuz",
  chest: "Göğüs",
  waist: "Bel",
  hips: "Kalça",
  arm: "Kol",
  leg: "Bacak",
};

// For these measurements, a decrease is positive (green)
const DECREASE_IS_GOOD = new Set(["waist", "hips"]);

function fmt(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function deltaColor(key: string, delta: number): string {
  const positive = DECREASE_IS_GOOD.has(key) ? delta < 0 : delta > 0;
  return positive ? "#22C55E" : "#EF4444";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2.5 shadow-lg ring-1 ring-black/8">
      <p className="mb-1 text-[11px] font-black text-slate-700">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">{p.name}</span>
          <span className="text-[11px] font-bold" style={{ color: p.color }}>
            {p.value} {p.unit ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
};

export function BodyProgressClient({ logs, activeMeasurements }: Props) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[20px] bg-white py-16 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <span className="text-5xl">📏</span>
        <p className="text-[15px] font-bold text-slate-600">Henüz ölçüm yok</p>
        <p className="text-[13px] text-slate-400">İlk check-in'ini tamamladığında veriler burada görünecek.</p>
      </div>
    );
  }

  // Logs are DESC — oldest is last, newest is first
  const newest = logs[0];
  const oldest = logs[logs.length - 1];

  // ── Hero stats ──────────────────────────────────────────────────────────────
  const weightLogs = [...logs].reverse().filter((l) => l.weight !== null);
  const firstWeight = weightLogs[0]?.weight ?? null;
  const lastWeight = weightLogs[weightLogs.length - 1]?.weight ?? null;
  const weightDelta = firstWeight !== null && lastWeight !== null ? +(lastWeight - firstWeight).toFixed(1) : null;
  const minWeight = weightLogs.length > 0 ? Math.min(...weightLogs.map((l) => l.weight!)) : null;

  const heroStats = [
    {
      label: "İlk → Son Kilo",
      value: firstWeight && lastWeight ? `${firstWeight} → ${lastWeight} kg` : "—",
      badge:
        weightDelta !== null
          ? {
              text: `${weightDelta > 0 ? "+" : ""}${weightDelta} kg`,
              color: weightDelta <= 0 ? "#22C55E" : "#EF4444",
            }
          : null,
    },
    { label: "En Düşük Kilo", value: minWeight !== null ? `${minWeight} kg` : "—", badge: null },
    { label: "Toplam Kayıt", value: `${logs.length}`, badge: null },
    {
      label: "Son Check-in",
      value: fmt(newest.date),
      badge: null,
    },
  ];

  // ── Weight chart data ────────────────────────────────────────────────────────
  const weightChartData = weightLogs.map((l) => ({
    date: fmt(l.date),
    kg: l.weight,
  }));

  // ── Measurement delta bars ───────────────────────────────────────────────────
  const deltaData = activeMeasurements
    .map((key) => {
      const k = key as keyof BodyLog;
      const first = (oldest[k] as number | null);
      const last = (newest[k] as number | null);
      if (first === null || last === null) return null;
      const delta = +(last - first).toFixed(1);
      return { key, label: MEASUREMENT_LABELS[key] ?? key, delta };
    })
    .filter(Boolean) as { key: string; label: string; delta: number }[];

  // ── History table columns ────────────────────────────────────────────────────
  const tableCols = [
    "weight",
    ...activeMeasurements,
  ].filter((c) => logs.some((l) => (l as any)[c] !== null));

  const COL_LABELS: Record<string, string> = {
    weight: "Kilo (kg)",
    shoulder: "Omuz",
    chest: "Göğüs",
    waist: "Bel",
    hips: "Kalça",
    arm: "Kol",
    leg: "Bacak",
  };

  const hasPhotos = logs.some(
    (l) => l.frontPhotoUrl || l.sidePhotoUrl || l.backPhotoUrl
  );
    const PHOTO_SLOTS = [
    { key: "frontPhotoUrl" as const, label: "Ön" },
    { key: "sidePhotoUrl" as const, label: "Yan" },
    { key: "backPhotoUrl" as const, label: "Arka" },
  ];

  const [modalAngle, setModalAngle] = useState<number | null>(null);

  useEffect(() => {
    if (modalAngle === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalAngle(null);
      if (e.key === "ArrowLeft") setModalAngle((p) => p !== null ? (p + 2) % 3 : null);
      if (e.key === "ArrowRight") setModalAngle((p) => p !== null ? (p + 1) % 3 : null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalAngle]);

  return (
    <div className="flex flex-col gap-5">
      {/* ── A) Hero Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {heroStats.map((s) => (
          <div
            key={s.label}
            className="rounded-[18px] bg-white p-3.5 shadow-sm"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="mt-1 text-[15px] font-black text-slate-800 leading-tight">{s.value}</p>
            {s.badge && (
              <span
                className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                style={{ background: s.badge.color }}
              >
                {s.badge.text}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── B) Weight Trend Chart ─────────────────────────────────────────────── */}
      {weightChartData.length >= 2 && (
        <div
          className="rounded-[20px] bg-white p-4 shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="mb-1 text-[13px] font-black text-slate-800">Kilo Trendi</p>
          <p className="mb-3 text-[11px] text-slate-400">kg · tüm kayıtlar</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightChartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                dataKey="kg"
                name="Kilo"
                unit=" kg"
                stroke="#7C3AED"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#7C3AED" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── C) Measurement Delta Bars ─────────────────────────────────────────── */}
      {deltaData.length >= 2 && (
        <div
          className="rounded-[20px] bg-white p-4 shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="mb-1 text-[13px] font-black text-slate-800">Ölçüm Değişimi</p>
          <p className="mb-3 text-[11px] text-slate-400">cm · ilk kayıt → son kayıt</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={deltaData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number, _: any, props: any) => [
                  `${v > 0 ? "+" : ""}${v} cm`,
                  props.payload.label,
                ]}
              />
              <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                {deltaData.map((entry) => (
                  <Cell key={entry.key} fill={deltaColor(entry.key, entry.delta)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400" />İyi yön</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />Ters yön</span>
          </div>
        </div>
      )}

      {/* ── D) Before / After Gallery — thumbnail grid + modal ───────────────── */}
      {hasPhotos && logs.length >= 2 && (
        <div
          className="rounded-[20px] bg-white p-4 shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-black text-slate-800">Before / After</p>
              <p className="text-[11px] text-slate-400">
                {fmt(oldest.date)} → {fmt(newest.date)} · Büyütmek için tıkla
              </p>
            </div>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-black text-purple-600">3 açı</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PHOTO_SLOTS.map((slot, idx) => {
              const beforeUrl = oldest[slot.key];
              const afterUrl = newest[slot.key];
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => setModalAngle(idx)}
                  className="group flex flex-col gap-1 focus:outline-none"
                >
                  <p className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-purple-600 transition-colors">
                    {slot.label}
                  </p>
                  <div
                    className="relative overflow-hidden rounded-xl ring-1 ring-slate-200 group-hover:ring-purple-300 transition-all"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {beforeUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={beforeUrl} alt={`before-${slot.label}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-[18px]">📷</div>
                    )}
                    <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 py-0.5 text-[8px] font-black text-white">ÖNCE</span>
                  </div>
                  <div
                    className="relative overflow-hidden rounded-xl ring-2 ring-purple-200 group-hover:ring-purple-500 transition-all"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {afterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={afterUrl} alt={`after-${slot.label}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-purple-50 text-[18px]">📷</div>
                    )}
                    <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 py-0.5 text-[8px] font-black text-white">SONRA</span>
                  </div>
                  <p className="text-center text-[9px] text-slate-300 group-hover:text-purple-400 transition-colors">🔍 Büyüt</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Photo Modal ───────────────────────────────────────────────────────── */}
      {modalAngle !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setModalAngle(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-[#0F0F0F] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-black text-white">
                  {PHOTO_SLOTS[modalAngle].label} Fotoğraf
                </p>
                <p className="text-[11px] text-white/50">
                  {fmt(oldest.date)} → {fmt(newest.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAngle(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Before / After full size */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "ÖNCE", url: oldest[PHOTO_SLOTS[modalAngle].key], date: oldest.date },
                { label: "SONRA", url: newest[PHOTO_SLOTS[modalAngle].key], date: newest.date },
              ].map(({ label, url, date }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <div
                    className="relative overflow-hidden rounded-xl"
                    style={{
                      aspectRatio: "3/4",
                      border: label === "SONRA" ? "2px solid #7C3AED" : "2px solid #374151",
                    }}
                  >
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-900 text-2xl">
                        <span>📷</span>
                        <span className="text-[11px] text-white/30">Fotoğraf yok</span>
                      </div>
                    )}
                    <span
                      className="absolute bottom-2 left-2 rounded-lg px-2 py-0.5 text-[10px] font-black text-white"
                      style={{ background: label === "SONRA" ? "#7C3AED" : "#374151" }}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="text-center text-[10px] text-white/40">
                    {new Date(date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setModalAngle((modalAngle + 2) % 3)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-lg"
              >
                ←
              </button>
              <div className="flex items-center gap-2">
                {PHOTO_SLOTS.map((slot, idx) => (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => setModalAngle(idx)}
                    className="flex flex-col items-center gap-1 transition-all"
                  >
                    <div
                      className="rounded-full transition-all"
                      style={{
                        width: idx === modalAngle ? 24 : 8,
                        height: 8,
                        background: idx === modalAngle ? "#7C3AED" : "rgba(255,255,255,0.25)",
                      }}
                    />
                    <span
                      className="text-[9px] font-black transition-colors"
                      style={{ color: idx === modalAngle ? "#A78BFA" : "rgba(255,255,255,0.3)" }}
                    >
                      {slot.label}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setModalAngle((modalAngle + 1) % 3)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-lg"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── E) History Table ──────────────────────────────────────────────────── */}
      <div
        className="rounded-[20px] bg-white shadow-sm overflow-hidden"
        style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[13px] font-black text-slate-800">Tüm Kayıtlar</p>
          <p className="text-[11px] text-slate-400">{logs.length} check-in</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="sticky left-0 bg-slate-50 px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Tarih
                </th>
                {tableCols.map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    {COL_LABELS[col] ?? col}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Foto
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map((log, i) => {
                const prev = logs[i + 1];
                return (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="sticky left-0 bg-white px-4 py-2.5 text-[12px] font-semibold text-slate-600 whitespace-nowrap">
                      {fmt(log.date)}
                    </td>
                    {tableCols.map((col) => {
                      const val = (log as any)[col] as number | null;
                      const prevVal = prev ? (prev as any)[col] as number | null : null;
                      const delta = val !== null && prevVal !== null ? +(val - prevVal).toFixed(1) : null;
                      return (
                        <td key={col} className="px-4 py-2.5 whitespace-nowrap">
                          {val !== null ? (
                            <span className="flex items-center gap-1">
                              <span className="text-[13px] font-black text-slate-800">{val}</span>
                              {delta !== null && delta !== 0 && (
                                <span
                                  className="text-[10px] font-bold"
                                  style={{
                                    color: col === "weight" || DECREASE_IS_GOOD.has(col)
                                      ? delta < 0 ? "#22C55E" : "#EF4444"
                                      : delta > 0 ? "#22C55E" : "#EF4444",
                                  }}
                                >
                                  {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-[12px] text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-[14px]">
                      {log.frontPhotoUrl || log.sidePhotoUrl || log.backPhotoUrl
                        ? <button type="button" onClick={() => setModalAngle(0)} className="text-purple-500 hover:text-purple-700">📸</button>
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
