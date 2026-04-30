"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Bell, MessageCircle, ChevronLeft, TrendingUp, TrendingDown,
  AlertTriangle, Leaf, Dumbbell, Calendar, ClipboardList,
  Activity, Flame, User, BarChart2, Play, CheckCircle2,
} from "lucide-react";
import type { TimelineItem } from "@/lib/coach-timeline";
import { WorkoutHistoryPanel } from "@/components/coach/WorkoutHistoryPanel";
import { AssignmentList } from "@/components/coach/AssignmentList";
import { AssignTemplateModal } from "@/components/coach/AssignTemplateModal";
import { PaginationControls } from "@/components/shared/PaginationControls";

// ─── Types ────────────────────────────────────────────────────────────────────
export type StrengthPoint = { week: string; benchPress: number; squat: number; deadlift: number };
export type TonnageWeek = { current: number; prev: number };
export type HeatCell = { date: string; status: "completed" | "missed" | "rest" };

type Assignment = {
  id: string; templateId: string; templateName: string;
  createdAt: string; scheduledFor: string; workoutsCount: number;
};

export type ClientHub360Props = {
  clientId: string;
  name: string;
  email: string;
  age: number | null;
  weightKg: number | null;
  goal: string | null;
  fitnessLevel: string | null;
  completedWorkouts: number;
  totalWorkouts: number;
  complianceScore: number | null;
  subscriptionTier: string;
  assignments: Assignment[];
  timelineItems: TimelineItem[];
  currentPage: number;
  totalPages: number;
  strengthTrend: StrengthPoint[];
  weeklyTonnage: TonnageWeek;
  heatmap: HeatCell[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cColor(s: number) {
  return s >= 80 ? "#22C55E" : s >= 50 ? "#F59E0B" : "#EF4444";
}

function AvatarRing({ name, compliance, size = 56 }: { name: string; compliance: number | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const r = 20; const circ = 2 * Math.PI * r;
  const offset = compliance !== null ? circ * (1 - compliance / 100) : circ;
  const color = compliance !== null ? cColor(compliance) : "#CBD5E1";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {compliance !== null && (
        <svg className="absolute inset-0" width={size} height={size} viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="24" cy="24" r={r} fill="none" stroke="#E2E8F0" strokeWidth="4" />
          <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
        </svg>
      )}
      <div className="absolute flex items-center justify-center rounded-full text-white font-black"
        style={{ inset: 5, fontSize: (size - 10) * 0.33, background: "linear-gradient(135deg,#1A365D,#2D4A7A)" }}>
        {initials}
      </div>
    </div>
  );
}

// ─── Gauge (Circular progress for compliance) ─────────────────────────────────
function ComplianceGauge({ score }: { score: number }) {
  const color = cColor(score);
  const r = 54; const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const label = score >= 80 ? "Low Churn Risk" : score >= 50 ? "At Risk" : "High Churn Risk";
  const badgeColor = score >= 80 ? "#22C55E" : score >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#F1F5F9" strokeWidth="12" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{score}%</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uyumluluk</span>
        </div>
      </div>
      <span className="rounded-full px-3 py-1 text-[11px] font-black text-white" style={{ background: badgeColor }}>
        {label}
      </span>
    </div>
  );
}

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2.5 shadow-lg ring-1 ring-black/8" style={{ minWidth: 160 }}>
      <p className="mb-1.5 text-xs font-black text-slate-700">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-slate-500">{p.name}</span>
          <span className="text-[11px] font-bold" style={{ color: p.color }}>{p.value} kg</span>
        </div>
      ))}
    </div>
  );
};

// ─── Tab bar ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "overview", label: "Özet", icon: Activity },
  { key: "performance", label: "Performans", icon: BarChart2 },
  { key: "body", label: "Vücut", icon: User },
  { key: "history", label: "Geçmiş", icon: Calendar },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// ─── TAB 1: Overview ─────────────────────────────────────────────────────────
function OverviewTab({
  complianceScore, subscriptionTier, assignments, goal, fitnessLevel
}: Pick<ClientHub360Props, "complianceScore" | "subscriptionTier" | "assignments" | "goal" | "fitnessLevel"> & { clientId: string }) {
  const TIER_LABEL: Record<string, string> = {
    FREE: "Starter", TIER_1: "Pro", TIER_2: "Elite", AGENCY: "Agency",
  };
  return (
    <div className="flex flex-col gap-4">
      {/* Compliance + Package row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Compliance gauge */}
        <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Sadakat Skoru</p>
          {complianceScore !== null
            ? <ComplianceGauge score={complianceScore} />
            : <div className="flex h-32 items-center justify-center text-xs text-slate-400">Veri yok</div>}
        </div>
        {/* Package */}
        <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Plan Durumu</p>
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-sm font-black text-slate-800">{TIER_LABEL[subscriptionTier] ?? subscriptionTier}</p>
              <p className="text-xs text-slate-400">Aktif plan</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold text-slate-500">Mevcut Bağlantı</p>
              <p className="mt-1 text-[13px] font-black text-slate-700">Aktif Danışan</p>
            </div>
            <Link href="/coach/subscription"
              className="flex h-8 items-center justify-center rounded-xl text-xs font-black text-white"
              style={{ background: "#1A365D" }}>
              Planı Yönet
            </Link>
          </div>
        </div>
      </div>

      {/* Red Flags / Notes */}
      <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Önemli Notlar</p>
        <div className="flex flex-col gap-2">
          {/* Goal */}
          {goal && (
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <Dumbbell className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
              <div>
                <p className="text-[11px] font-black text-blue-700">Hedef</p>
                <p className="text-xs text-blue-600">{goal}</p>
              </div>
            </div>
          )}
          {/* Fitness level */}
          {fitnessLevel && (
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <div>
                <p className="text-[11px] font-black text-green-700">Fitness Seviyesi</p>
                <p className="text-xs text-green-600">{fitnessLevel}</p>
              </div>
            </div>
          )}
          {/* Dummy injury note */}
          <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
            style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
            <div>
              <p className="text-[11px] font-black text-orange-700">Sakatlık Geçmişi</p>
              <p className="text-xs text-orange-600">Sağ omuz rotator cuff hassasiyeti — overhead hareketlerde dikkat</p>
            </div>
          </div>
          {/* Dummy diet note */}
          <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
            style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <Leaf className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
            <div>
              <p className="text-[11px] font-black text-green-700">Beslenme Tercihi</p>
              <p className="text-xs text-green-600">Yüksek protein odaklı beslenme · Gluten hassasiyeti</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming assignments */}
      {assignments.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Atanmış Programlar</p>
          <AssignmentList assignments={assignments} />
        </div>
      )}
    </div>
  );
}

// ─── TAB 2: Performance ───────────────────────────────────────────────────────
function PerformanceTab({ strengthTrend, weeklyTonnage }: Pick<ClientHub360Props, "strengthTrend" | "weeklyTonnage">) {
  const change = weeklyTonnage.prev > 0
    ? Math.round(((weeklyTonnage.current - weeklyTonnage.prev) / weeklyTonnage.prev) * 100)
    : null;
  const hasStrength = strengthTrend.length > 0;

  const MOCK_TREND: StrengthPoint[] = [
    { week: "H1", benchPress: 85, squat: 110, deadlift: 140 },
    { week: "H2", benchPress: 87, squat: 112, deadlift: 142 },
    { week: "H3", benchPress: 87, squat: 115, deadlift: 145 },
    { week: "H4", benchPress: 90, squat: 117, deadlift: 148 },
    { week: "H5", benchPress: 90, squat: 120, deadlift: 150 },
    { week: "H6", benchPress: 92, squat: 120, deadlift: 152 },
    { week: "H7", benchPress: 92, squat: 122, deadlift: 155 },
    { week: "H8", benchPress: 95, squat: 125, deadlift: 157 },
    { week: "H9", benchPress: 97, squat: 127, deadlift: 160 },
    { week: "H10", benchPress: 97, squat: 130, deadlift: 162 },
    { week: "H11", benchPress: 100, squat: 132, deadlift: 165 },
    { week: "H12", benchPress: 102, squat: 135, deadlift: 168 },
  ];

  const chartData = hasStrength ? strengthTrend : MOCK_TREND;

  return (
    <div className="flex flex-col gap-4">
      {/* 1RM Trend */}
      <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-black text-slate-800">Tahmini 1RM Trendi</p>
            <p className="text-[10px] text-slate-400">12 haftalık ilerleme</p>
          </div>
          {!hasStrength && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
              Demo Veri
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line dataKey="benchPress" name="Bench Press" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
            <Line dataKey="squat" name="Squat" stroke="#8B5CF6" strokeWidth={2.5} dot={false} />
            <Line dataKey="deadlift" name="Deadlift" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Tonnage */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bu Hafta</p>
          <p className="mt-1 text-2xl font-black text-slate-800">
            {weeklyTonnage.current > 0 ? `${Math.round(weeklyTonnage.current / 1000 * 10) / 10}t` : "—"}
          </p>
          <p className="text-xs text-slate-400">toplam tonaj</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Değişim</p>
          {change !== null ? (
            <div className="flex items-center gap-1 mt-1">
              {change >= 0
                ? <TrendingUp className="h-5 w-5 text-green-500" />
                : <TrendingDown className="h-5 w-5 text-red-500" />}
              <p className="text-2xl font-black" style={{ color: change >= 0 ? "#22C55E" : "#EF4444" }}>
                {change >= 0 ? "+" : ""}{change}%
              </p>
            </div>
          ) : (
            <p className="mt-1 text-2xl font-black text-slate-300">—</p>
          )}
          <p className="text-xs text-slate-400">geçen haftaya göre</p>
        </div>
      </div>

      {/* Mock tonnage bar chart */}
      <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <p className="mb-3 text-[13px] font-black text-slate-800">Haftalık Tonaj Karşılaştırması</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={[
            { week: "H8", current: 4200, prev: 3900 },
            { week: "H9", current: 4800, prev: 4200 },
            { week: "H10", current: 4500, prev: 4800 },
            { week: "H11", current: 5200, prev: 4500 },
            { week: "H12", current: weeklyTonnage.current || 5600, prev: weeklyTonnage.prev || 5200 },
          ]} barCategoryGap="30%" barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={40}
              tickFormatter={(v) => `${Math.round(v / 1000 * 10) / 10}t`} />
            <Tooltip formatter={(v: number) => [`${Math.round(v / 1000 * 10) / 10}t`]} />
            <Bar dataKey="prev" name="Önceki" fill="#E2E8F0" radius={[3, 3, 0, 0]} />
            <Bar dataKey="current" name="Bu Hafta" fill="#1A365D" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── TAB 3: Body & Nutrition ──────────────────────────────────────────────────
function BodyTab({ weightKg }: { weightKg: number | null }) {
  const MACROS = [
    { label: "Kalori", current: 2420, target: 2800, unit: "kcal", color: "#F59E0B" },
    { label: "Protein", current: 162, target: 180, unit: "g", color: "#3B82F6" },
    { label: "Karbonhidrat", current: 280, target: 340, unit: "g", color: "#8B5CF6" },
    { label: "Yağ", current: 72, target: 90, unit: "g", color: "#22C55E" },
  ];
  const BODY_METRICS = [
    { metric: "Ağırlık", week1: weightKg ? `${weightKg} kg` : "85.2 kg", week2: "84.8 kg", week3: "84.5 kg", week4: "84.1 kg", trend: "down" },
    { metric: "Vücut Yağı", week1: "18.4%", week2: "18.1%", week3: "17.9%", week4: "17.6%", trend: "down" },
    { metric: "Bel Çevresi", week1: "84 cm", week2: "83.5 cm", week3: "83 cm", week4: "82.5 cm", trend: "down" },
    { metric: "Göğüs", week1: "104 cm", week2: "104 cm", week3: "105 cm", week4: "105 cm", trend: "up" },
  ];
  return (
    <div className="flex flex-col gap-4">
      {/* Macros */}
      <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-black text-slate-800">Günlük Makrolar</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">Demo</span>
        </div>
        <div className="flex flex-col gap-3.5">
          {MACROS.map((m) => {
            const pct = Math.round((m.current / m.target) * 100);
            return (
              <div key={m.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{m.label}</span>
                  <span className="text-xs text-slate-500">
                    <span className="font-black" style={{ color: m.color }}>{m.current}</span>
                    <span className="text-slate-300"> / {m.target} {m.unit}</span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, pct)}%`, background: m.color }} />
                </div>
                <div className="mt-0.5 text-right text-[10px] text-slate-400">%{pct}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body metrics table */}
      <div className="rounded-2xl bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-[13px] font-black text-slate-800">Vücut Metrikleri</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">4 Hafta</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Metrik</th>
                <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">H1</th>
                <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">H2</th>
                <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">H3</th>
                <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">H4</th>
              </tr>
            </thead>
            <tbody>
              {BODY_METRICS.map((row, i) => (
                <tr key={row.metric} className={i < BODY_METRICS.length - 1 ? "border-b border-slate-50" : ""}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {row.trend === "down"
                        ? <TrendingDown className="h-3 w-3 text-green-500" />
                        : <TrendingUp className="h-3 w-3 text-blue-500" />}
                      <span className="text-xs font-bold text-slate-700">{row.metric}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-slate-500">{row.week1}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-slate-500">{row.week2}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-slate-500">{row.week3}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-black text-slate-800">{row.week4}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 4: History & Media ───────────────────────────────────────────────────
function HistoryTab({
  heatmap, timelineItems, currentPage, totalPages, clientId,
}: Pick<ClientHub360Props, "heatmap" | "timelineItems" | "currentPage" | "totalPages" | "clientId">) {
  const FORM_CHECKS = [
    { id: 1, exercise: "Back Squat - Ağır Set 3", note: "Paralel altı iniş yok, gözden geçir", date: "28 Nis" },
    { id: 2, exercise: "Romanian Deadlift - Set 2", note: "Sırt düzlüğü kontrol et", date: "26 Nis" },
    { id: 3, exercise: "Overhead Press - Set 4", note: "Dirsek pozisyonu", date: "24 Nis" },
  ];

  const DAY_LABELS = ["Pzt", "", "Çrş", "", "Cum", "", "Paz"];

  // Group heatmap into weeks (7-day rows)
  const weeks: HeatCell[][] = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Consistency Heatmap */}
      <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-black text-slate-800">30 Günlük Tutarlılık</p>
            <p className="text-[10px] text-slate-400">Her kare = 1 gün</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="h-3 w-3 rounded bg-green-400" /> Tamam
            <span className="h-3 w-3 rounded bg-red-400" /> Kaçırıldı
            <span className="h-3 w-3 rounded bg-slate-200" /> Dinlenme
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="flex h-5 w-6 items-center" style={{ fontSize: 9, color: "#94A3B8" }}>{d}</div>
              ))}
            </div>
            {/* Columns (each week) */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((cell, di) => {
                  const bg = cell.status === "completed" ? "#4ADE80"
                    : cell.status === "missed" ? "#F87171"
                    : "#E2E8F0";
                  return (
                    <div key={di} className="rounded" title={`${cell.date}: ${cell.status}`}
                      style={{ width: 18, height: 18, background: bg }} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* Stats */}
        <div className="mt-3 flex gap-3">
          {[
            { label: "Tamamlanan", value: heatmap.filter(h => h.status === "completed").length, color: "#22C55E" },
            { label: "Kaçırılan", value: heatmap.filter(h => h.status === "missed").length, color: "#EF4444" },
            { label: "Dinlenme", value: heatmap.filter(h => h.status === "rest").length, color: "#94A3B8" },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-xl bg-slate-50 p-2 text-center">
              <p className="text-base font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Check Inbox */}
      <div className="rounded-2xl bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-slate-400" />
            <p className="text-[13px] font-black text-slate-800">Form Kontrol Gelen Kutusu</p>
          </div>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-600">
            {FORM_CHECKS.length} bekleyen
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {FORM_CHECKS.map((fc) => (
            <div key={fc.id} className="flex items-center gap-3 px-4 py-3">
              {/* Video thumb placeholder */}
              <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80">
                    <Play className="h-3.5 w-3.5 text-slate-600 ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{fc.exercise}</p>
                <p className="text-xs text-slate-400 truncate">{fc.note}</p>
                <p className="text-[10px] text-slate-300 mt-0.5">{fc.date}</p>
              </div>
              <button className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-black text-white transition hover:opacity-90"
                style={{ background: "#1A365D" }}>
                İncele
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Full workout timeline */}
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Antrenman Geçmişi</p>
        <WorkoutHistoryPanel items={timelineItems} />
        <div className="mt-3">
          <PaginationControls
            basePath={`/coach/clients/${clientId}?tab=history`}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ClientHub360(props: ClientHub360Props) {
  const { clientId, name, email, age, weightKg, goal, fitnessLevel,
    completedWorkouts, totalWorkouts, complianceScore, subscriptionTier,
    assignments, timelineItems, currentPage, totalPages,
    strengthTrend, weeklyTonnage, heatmap } = props;

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const cScore = complianceScore;

  return (
    <div className="flex flex-col gap-0">
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-2 pb-3"
        style={{ background: "linear-gradient(160deg,#1A365D,#2D4A7A)", boxShadow: "0 4px 24px rgba(26,54,93,0.3)" }}>
        {/* Back + actions */}
        <div className="mb-3 flex items-center justify-between">
          <Link href="/coach/clients"
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <ChevronLeft className="h-4 w-4 text-white" />
          </Link>
          <div className="flex gap-2">
            <Link href="/coach/messages"
              className="flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-black text-white"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <MessageCircle className="h-3.5 w-3.5" />Mesaj
            </Link>
            <button className="flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-black text-white"
              style={{ background: "rgba(249,115,22,0.8)" }}>
              <Bell className="h-3.5 w-3.5" />Uyar
            </button>
          </div>
        </div>

        {/* Avatar + client info */}
        <div className="flex items-center gap-3 mb-3">
          <AvatarRing name={name} compliance={cScore} size={56} />
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-black text-white leading-tight truncate">{name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {age && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white/80"
                  style={{ background: "rgba(255,255,255,0.12)" }}>{age} yaş</span>
              )}
              {weightKg && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white/80"
                  style={{ background: "rgba(255,255,255,0.12)" }}>{weightKg} kg</span>
              )}
              {goal && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                  style={{ background: "rgba(249,115,22,0.7)" }}>{goal}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold text-white/60">{completedWorkouts}/{totalWorkouts} tamamlandı</span>
              {cScore !== null && (
                <span className="text-[10px] font-black" style={{ color: cColor(cScore) }}>%{cScore} uyum</span>
              )}
            </div>
          </div>
          <AssignTemplateModal clientId={clientId} />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.1)" }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex-1 rounded-lg py-1.5 text-[11px] font-black transition-all"
              style={activeTab === key
                ? { background: "#fff", color: "#1A365D" }
                : { background: "transparent", color: "rgba(255,255,255,0.6)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="pt-4">
        {activeTab === "overview" && (
          <OverviewTab
            clientId={clientId}
            complianceScore={cScore}
            subscriptionTier={subscriptionTier}
            assignments={assignments}
            goal={goal}
            fitnessLevel={fitnessLevel}
          />
        )}
        {activeTab === "performance" && (
          <PerformanceTab strengthTrend={strengthTrend} weeklyTonnage={weeklyTonnage} />
        )}
        {activeTab === "body" && <BodyTab weightKg={weightKg} />}
        {activeTab === "history" && (
          <HistoryTab
            heatmap={heatmap}
            timelineItems={timelineItems}
            currentPage={currentPage}
            totalPages={totalPages}
            clientId={clientId}
          />
        )}
      </div>
    </div>
  );
}
