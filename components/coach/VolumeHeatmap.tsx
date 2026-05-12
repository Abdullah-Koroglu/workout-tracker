"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart2, Target } from "lucide-react";

type DataPoint = {
  muscle: string;
  currentPeriod: number;
  prevPeriod: number;
  currentSetCount: number;
  prevSetCount: number;
  change: number;
};

type Props = { clientId: string };

const WINDOWS = [
  { label: "7 Gün", value: 7 },
  { label: "14 Gün", value: 14 },
  { label: "30 Gün", value: 30 },
];

type ChartMode = "bar" | "radar";

const CURRENT_COLOR = "#1A365D";
const PREV_COLOR = "#CBD5E1";

function ChangeChip({ change }: { change: number }) {
  if (change === 0) return <span className="text-xs text-slate-400 flex items-center gap-0.5"><Minus className="h-3 w-3" />—</span>;
  const up = change > 0;
  return (
    <span
      className="flex items-center gap-0.5 text-xs font-bold"
      style={{ color: up ? "#22C55E" : "#EF4444" }}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{change}%
    </span>
  );
}

function formatKg(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}t` : `${value}kg`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p: any) => p.dataKey === "currentPeriod")?.value ?? 0;
  const prev = payload.find((p: any) => p.dataKey === "prevPeriod")?.value ?? 0;
  const point = payload[0]?.payload as DataPoint | undefined;
  const change = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0;
  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-black/8" style={{ minWidth: 160 }}>
      <p className="mb-2 text-[13px] font-black text-slate-800">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-slate-500">Bu dönem</span>
          <span className="text-xs font-bold text-slate-800">{formatKg(cur)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-slate-500">Önceki</span>
          <span className="text-xs font-bold text-slate-400">{formatKg(prev)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-slate-500">Set</span>
          <span className="text-xs font-bold text-slate-800">{point?.currentSetCount ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-slate-500">Önceki Set</span>
          <span className="text-xs font-bold text-slate-400">{point?.prevSetCount ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-6 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">Değişim</span>
          <ChangeChip change={change} />
        </div>
      </div>
    </div>
  );
};

export function VolumeHeatmap({ clientId }: Props) {
  const [windowDays, setWindowDays] = useState(7);
  const [mode, setMode] = useState<ChartMode>("bar");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/coach/clients/${clientId}/analytics/volume?window=${windowDays}`);
    if (!res.ok) { setError("Veri alınamadı."); setLoading(false); return; }
    const json = await res.json();
    setData(json.data ?? []);
    setLoading(false);
  }, [clientId, windowDays]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const totalCurrent = data.reduce((s, d) => s + d.currentPeriod, 0);
  const totalPrev = data.reduce((s, d) => s + d.prevPeriod, 0);
  const totalCurrentSets = data.reduce((s, d) => s + d.currentSetCount, 0);
  const totalPrevSets = data.reduce((s, d) => s + d.prevSetCount, 0);
  const overallChange = totalPrev > 0 ? Math.round(((totalCurrent - totalPrev) / totalPrev) * 100) : null;

  return (
    <div className="rounded-2xl bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-slate-500" />
          <h2 className="text-[15px] font-black text-slate-800">Hacim & Tonaj Analizi</h2>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Chart mode toggle */}
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            {(["bar", "radar"] as ChartMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="rounded-md px-3 py-1 text-xs font-black transition-all"
                style={mode === m ? { background: "#fff", color: "#1A365D", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#94A3B8" }}
              >
                {m === "bar" ? "Bar" : "Radar"}
              </button>
            ))}
          </div>

          {/* Window selector */}
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            {WINDOWS.map((w) => (
              <button
                key={w.value}
                onClick={() => setWindowDays(w.value)}
                className="rounded-md px-3 py-1 text-xs font-black transition-all"
                style={windowDays === w.value ? { background: "#1A365D", color: "#fff" } : { color: "#94A3B8" }}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary row */}
      {!loading && data.length > 0 && (
        <div className="flex gap-4 border-b border-slate-100 px-5 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bu Dönem</p>
            <p className="text-lg font-black text-slate-800">{formatKg(totalCurrent)}</p>
            <p className="text-xs font-semibold text-slate-500">{totalCurrentSets} set</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Önceki Dönem</p>
            <p className="text-lg font-black text-slate-400">{formatKg(totalPrev)}</p>
            <p className="text-xs font-semibold text-slate-400">{totalPrevSets} set</p>
          </div>
          {overallChange !== null && (
            <div className="ml-auto flex flex-col items-end justify-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Değişim</p>
              <ChangeChip change={overallChange} />
            </div>
          )}
        </div>
      )}

      {/* Chart area */}
      <div className="px-4 py-5">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-sm text-red-400">{error}</div>
        ) : data.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-300">
            <Target className="h-10 w-10" />
            <p className="text-sm">Bu dönemde veri bulunamadı.</p>
            <p className="text-xs text-slate-400">Egzersizlere kas grubu atandığında gösterilecek.</p>
          </div>
        ) : mode === "bar" ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barCategoryGap="30%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="muscle"
                tick={{ fontSize: 11, fontWeight: 700, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatKg}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(v) => (v === "currentPeriod" ? "Bu Dönem" : "Önceki Dönem")}
              />
              <Bar dataKey="prevPeriod" fill={PREV_COLOR} radius={[4, 4, 0, 0]} />
              <Bar dataKey="currentPeriod" fill={CURRENT_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarGrid stroke="#F1F5F9" />
              <PolarAngleAxis
                dataKey="muscle"
                tick={{ fontSize: 11, fontWeight: 700, fill: "#64748B" }}
              />
              <PolarRadiusAxis
                tickFormatter={formatKg}
                tick={{ fontSize: 9, fill: "#CBD5E1" }}
                axisLine={false}
              />
              <Radar
                name="Önceki Dönem"
                dataKey="prevPeriod"
                stroke={PREV_COLOR}
                fill={PREV_COLOR}
                fillOpacity={0.25}
              />
              <Radar
                name="Bu Dönem"
                dataKey="currentPeriod"
                stroke={CURRENT_COLOR}
                fill={CURRENT_COLOR}
                fillOpacity={0.35}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(v) => (v === "currentPeriod" ? "Bu Dönem" : "Önceki Dönem")}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-muscle change table (bar mode only) */}
      {!loading && data.length > 0 && mode === "bar" && (
        <div className="border-t border-slate-100 px-5 pb-4 pt-3">
          <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Kas Grubu Detayı</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {data.map((d) => (
              <div
                key={d.muscle}
                className="rounded-xl bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">{d.muscle}</span>
                  <ChangeChip change={d.change} />
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  {d.currentSetCount} set • {formatKg(d.currentPeriod)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
