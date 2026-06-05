"use client";

import { useEffect, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Expand, Ruler, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

type BodyMetricKey = "weight" | "shoulder" | "chest" | "waist" | "hips" | "arm" | "leg";

type Props = {
  logs: BodyLog[];
  activeMeasurements: string[];
};

const MEASUREMENT_LABELS: Record<string, string> = {
  shoulder: "Omuz",
  chest: "Gogus",
  waist: "Bel",
  hips: "Kalca",
  arm: "Kol",
  leg: "Bacak",
};

const DECREASE_IS_GOOD = new Set(["waist", "hips"]);

const PHOTO_SLOTS = [
  { key: "frontPhotoUrl" as const, label: "On" },
  { key: "sidePhotoUrl" as const, label: "Yan" },
  { key: "backPhotoUrl" as const, label: "Arka" },
];

type ChartTooltipPayload = {
  dataKey?: string;
  name?: string;
  color?: string;
  value?: number | string;
  unit?: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function deltaColor(key: string, delta: number): string {
  const positive = DECREASE_IS_GOOD.has(key) ? delta < 0 : delta > 0;
  return positive ? "#22C55E" : "#EF4444";
}

function getBodyMetric(log: BodyLog, key: BodyMetricKey): number | null {
  return log[key];
}

function formatDelta(delta: number) {
  return `${delta > 0 ? "+" : ""}${delta}`;
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-white px-3 py-2.5 shadow-lg ring-1 ring-black/8">
      <p className="mb-1 text-[11px] font-black text-slate-700">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey ?? item.name} className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">{item.name}</span>
          <span className="text-[11px] font-bold" style={{ color: item.color }}>
            {item.value} {item.unit ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
};

export function BodyProgressClient({ logs, activeMeasurements }: Props) {
  const [modalAngle, setModalAngle] = useState<number | null>(null);

  useEffect(() => {
    if (modalAngle === null) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalAngle(null);
      if (event.key === "ArrowLeft") setModalAngle((prev) => (prev !== null ? (prev + 2) % 3 : null));
      if (event.key === "ArrowRight") setModalAngle((prev) => (prev !== null ? (prev + 1) % 3 : null));
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalAngle]);

  if (logs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-[20px] bg-white py-16 shadow-sm"
        style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Ruler className="h-6 w-6" />
        </div>
        <p className="text-[15px] font-bold text-slate-600">Henuz olcum yok</p>
        <p className="text-[13px] text-slate-400">Ilk check-in tamamlandiginda veriler burada gorunecek.</p>
      </div>
    );
  }

  const newest = logs[0];
  const oldest = logs[logs.length - 1];

  const weightLogs = [...logs].reverse().filter((log) => log.weight !== null);
  const firstWeight = weightLogs[0]?.weight ?? null;
  const lastWeight = weightLogs[weightLogs.length - 1]?.weight ?? null;
  const weightDelta = firstWeight !== null && lastWeight !== null ? +(lastWeight - firstWeight).toFixed(1) : null;
  const minWeight = weightLogs.length > 0 ? Math.min(...weightLogs.map((log) => log.weight!)) : null;

  const heroStats = [
    {
      label: "Ilk -> Son Kilo",
      value: firstWeight !== null && lastWeight !== null ? `${firstWeight} -> ${lastWeight} kg` : "-",
      badge:
        weightDelta !== null
          ? {
              text: `${weightDelta > 0 ? "+" : ""}${weightDelta} kg`,
              color: weightDelta <= 0 ? "#22C55E" : "#EF4444",
            }
          : null,
    },
    { label: "En Dusuk Kilo", value: minWeight !== null ? `${minWeight} kg` : "-", badge: null },
    { label: "Toplam Kayit", value: String(logs.length), badge: null },
    { label: "Son Check-in", value: fmt(newest.date), badge: null },
  ];

  const weightChartData = weightLogs.map((log) => ({
    date: fmt(log.date),
    kg: log.weight,
  }));

  const deltaData = activeMeasurements
    .map((key) => {
      const bodyKey = key as keyof BodyLog;
      const first = oldest[bodyKey] as number | null;
      const last = newest[bodyKey] as number | null;
      if (first === null || last === null) return null;
      const delta = +(last - first).toFixed(1);
      return { key, label: MEASUREMENT_LABELS[key] ?? key, delta };
    })
    .filter(Boolean) as { key: string; label: string; delta: number }[];

  const tableCols = (["weight", ...activeMeasurements] as BodyMetricKey[]).filter((column) => {
    if (!(column in logs[0])) return false;
    return logs.some((log) => getBodyMetric(log, column) !== null);
  });

  const colLabels: Record<string, string> = {
    weight: "Kilo (kg)",
    shoulder: "Omuz",
    chest: "Gogus",
    waist: "Bel",
    hips: "Kalca",
    arm: "Kol",
    leg: "Bacak",
  };

  const hasPhotos = logs.some((log) => log.frontPhotoUrl || log.sidePhotoUrl || log.backPhotoUrl);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {heroStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[18px] bg-white p-3.5 shadow-sm"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{stat.label}</p>
            <p className="mt-1 text-[15px] font-black leading-tight text-slate-800">{stat.value}</p>
            {stat.badge ? (
              <span
                className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                style={{ background: stat.badge.color }}
              >
                {stat.badge.text}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {weightChartData.length >= 2 ? (
        <div
          className="rounded-[20px] bg-white p-4 shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="mb-1 text-[13px] font-black text-slate-800">Kilo Trendi</p>
          <p className="mb-3 text-[11px] text-slate-400">kg · tum kayitlar</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightChartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
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
      ) : null}

      {deltaData.length >= 2 ? (
        <div
          className="rounded-[20px] bg-white p-4 shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="mb-1 text-[13px] font-black text-slate-800">Olcum Degisimi</p>
          <p className="mb-3 text-[11px] text-slate-400">cm · ilk kayit {"->"} son kayit</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={deltaData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number, _name, item) => {
                  const label =
                    typeof item?.payload === "object" && item.payload && "label" in item.payload
                      ? String((item.payload as { label?: string }).label ?? "")
                      : "";
                  return [`${value > 0 ? "+" : ""}${value} cm`, label];
                }}
              />
              <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                {deltaData.map((entry) => (
                  <Cell key={entry.key} fill={deltaColor(entry.key, entry.delta)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400" />
              Iyi yon
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
              Ters yon
            </span>
          </div>
        </div>
      ) : null}

      {hasPhotos && logs.length >= 2 ? (
        <div
          className="rounded-[20px] bg-white p-4 shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-black text-slate-800">Before / After</p>
              <p className="text-[11px] text-slate-400">
                {fmt(oldest.date)} {"->"} {fmt(newest.date)} · Buyutmek icin tikla
              </p>
            </div>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-black text-purple-600">3 aci</span>
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
                  <p className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400 transition-colors group-hover:text-purple-600">
                    {slot.label}
                  </p>
                  <div
                    className="relative overflow-hidden rounded-xl ring-1 ring-slate-200 transition-all group-hover:ring-purple-300"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {beforeUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={beforeUrl} alt={`before-${slot.label}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 py-0.5 text-[8px] font-black text-white">
                      ONCE
                    </span>
                  </div>
                  <div
                    className="relative overflow-hidden rounded-xl ring-2 ring-purple-200 transition-all group-hover:ring-purple-500"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {afterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={afterUrl} alt={`after-${slot.label}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-purple-50 text-purple-400">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 py-0.5 text-[8px] font-black text-white">
                      SONRA
                    </span>
                  </div>
                  <p className="text-center text-[9px] text-slate-300 transition-colors group-hover:text-purple-400">
                    <span className="inline-flex items-center gap-1">
                      <Expand className="h-3 w-3" />
                      Buyut
                    </span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {modalAngle !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setModalAngle(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-[#0F0F0F] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-black text-white">{PHOTO_SLOTS[modalAngle].label} Fotograf</p>
                <p className="text-[11px] text-white/50">
                  {fmt(oldest.date)} {"->"} {fmt(newest.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAngle(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "ONCE", url: oldest[PHOTO_SLOTS[modalAngle].key], date: oldest.date },
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
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-900">
                        <Camera className="h-6 w-6 text-white/50" />
                        <span className="text-[11px] text-white/30">Fotograf yok</span>
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

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setModalAngle((modalAngle + 2) % 3)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-4 w-4" />
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
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="overflow-hidden rounded-[20px] bg-white shadow-sm"
        style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-[13px] font-black text-slate-800">Tum Kayitlar</p>
          <p className="text-[11px] text-slate-400">{logs.length} check-in</p>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {logs.slice(0, 20).map((log, index) => {
            const prev = logs[index + 1];

            return (
              <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{fmt(log.date)}</p>
                    <p className="text-[11px] text-slate-500">Check-in kaydi</p>
                  </div>
                  {log.frontPhotoUrl || log.sidePhotoUrl || log.backPhotoUrl ? (
                    <button
                      type="button"
                      onClick={() => setModalAngle(0)}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Foto
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {tableCols.map((col) => {
                    const value = getBodyMetric(log, col);
                    const prevValue = prev ? getBodyMetric(prev, col) : null;
                    const delta = value !== null && prevValue !== null ? +(value - prevValue).toFixed(1) : null;

                    return (
                      <div key={col} className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200/80">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{colLabels[col] ?? col}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-900">{value !== null ? value : "-"}</span>
                          {delta !== null && delta !== 0 ? (
                            <span
                              className="text-[10px] font-bold"
                              style={{
                                color:
                                  col === "weight" || DECREASE_IS_GOOD.has(col)
                                    ? delta < 0
                                      ? "#22C55E"
                                      : "#EF4444"
                                    : delta > 0
                                      ? "#22C55E"
                                      : "#EF4444",
                              }}
                            >
                              {formatDelta(delta)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="sticky left-0 bg-slate-50 px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Tarih
                </th>
                {tableCols.map((col) => (
                  <th key={col} className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {colLabels[col] ?? col}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Foto
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map((log, index) => {
                const prev = logs[index + 1];

                return (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-2.5 text-[12px] font-semibold text-slate-600">
                      {fmt(log.date)}
                    </td>
                    {tableCols.map((col) => {
                      const value = getBodyMetric(log, col);
                      const prevValue = prev ? getBodyMetric(prev, col) : null;
                      const delta = value !== null && prevValue !== null ? +(value - prevValue).toFixed(1) : null;

                      return (
                        <td key={col} className="whitespace-nowrap px-4 py-2.5">
                          {value !== null ? (
                            <span className="flex items-center gap-1">
                              <span className="text-[13px] font-black text-slate-800">{value}</span>
                              {delta !== null && delta !== 0 ? (
                                <span
                                  className="text-[10px] font-bold"
                                  style={{
                                    color:
                                      col === "weight" || DECREASE_IS_GOOD.has(col)
                                        ? delta < 0
                                          ? "#22C55E"
                                          : "#EF4444"
                                        : delta > 0
                                          ? "#22C55E"
                                          : "#EF4444",
                                  }}
                                >
                                  {formatDelta(delta)}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-[12px] text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-[14px]">
                      {log.frontPhotoUrl || log.sidePhotoUrl || log.backPhotoUrl ? (
                        <button type="button" onClick={() => setModalAngle(0)} className="text-purple-500 hover:text-purple-700">
                          <Camera className="h-4 w-4" />
                        </button>
                      ) : (
                        "-"
                      )}
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



