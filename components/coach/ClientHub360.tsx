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
  complianceScore,
  subscriptionTier,
  assignments,
  goal,
  fitnessLevel,
  heatmap,
  completedWorkouts,
  totalWorkouts,
}: Pick<ClientHub360Props, "complianceScore" | "subscriptionTier" | "assignments" | "goal" | "fitnessLevel" | "heatmap" | "completedWorkouts" | "totalWorkouts"> & { clientId: string }) {
  const TIER_LABEL: Record<string, string> = {
    FREE: "Starter", TIER_1: "Pro", TIER_2: "Elite", AGENCY: "Agency",
  };

  const last7 = heatmap.slice(-7);
  const completedLast7 = last7.filter((item) => item.status === "completed").length;
  const completedLast30 = heatmap.filter((item) => item.status === "completed").length;

  let currentStreak = 0;
  for (let index = heatmap.length - 1; index >= 0; index -= 1) {
    if (heatmap[index]?.status !== "completed") break;
    currentStreak += 1;
  }

  let longestStreak = 0;
  let workingStreak = 0;
  for (const cell of heatmap) {
    if (cell.status === "completed") {
      workingStreak += 1;
      longestStreak = Math.max(longestStreak, workingStreak);
    } else {
      workingStreak = 0;
    }
  }

  const completionPercent = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
  const packageProgress = Math.min(100, completionPercent || Math.round((completedLast30 / Math.max(1, heatmap.length)) * 100));
  const packageStatusColor = complianceScore !== null ? cColor(complianceScore) : "#CBD5E1";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Compliance gauge */}
        <div className="rounded-2xl bg-white p-4 shadow-sm xl:col-span-1" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Sadakat Skoru</p>
          {complianceScore !== null
            ? <ComplianceGauge score={complianceScore} />
            : <div className="flex h-32 items-center justify-center text-xs text-slate-400">Veri yok</div>}

          <div className="grid w-full grid-cols-2 gap-2.5">
              {[
                { label: "Son 7 Gün", value: `${completedLast7}/7` },
                { label: "Son 30 Gün", value: `${completedLast30}/${heatmap.length}` },
                { label: "Seri", value: `${currentStreak} gün` },
                { label: "En Uzun", value: `${longestStreak} gün` },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                  <div className="text-[15px] font-black text-slate-800">{metric.value}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{metric.label}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Package */}
        <div className="rounded-2xl p-4 shadow-sm xl:col-span-1" style={{ background: "linear-gradient(160deg, #1A365D 0%, #2D4A7A 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-white/45">Plan Durumu</p>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-black text-white">{TIER_LABEL[subscriptionTier] ?? subscriptionTier}</p>
              <p className="text-xs text-white/45">Aktif plan</p>
            </div>
            <div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-[26px] font-black text-white">%{packageProgress}</span>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-black" style={{ background: `${packageStatusColor}25`, color: packageStatusColor }}>
                  {complianceScore !== null && complianceScore >= 80 ? "Stabil" : complianceScore !== null && complianceScore >= 50 ? "Takip Gerekli" : "Riskli"}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/12">
                <div className="h-full rounded-full transition-all" style={{ width: `${packageProgress}%`, background: "linear-gradient(90deg, #FB923C, #EA580C)" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Tamamlanan", value: String(completedWorkouts) },
                { label: "Toplam", value: String(totalWorkouts) },
                { label: "Bekleyen", value: String(assignments.length) },
                { label: "Uyum", value: complianceScore !== null ? `%${complianceScore}` : "-" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-white/10 bg-white/8 px-3 py-2.5">
                  <div className="text-[14px] font-black text-white">{metric.value}</div>
                  <div className="mt-0.5 text-[10px] text-white/45">{metric.label}</div>
                </div>
              ))}
            </div>
            <Link href="/coach/billing"
              className="flex h-8 items-center justify-center rounded-xl text-xs font-black text-white"
              style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 6px 16px rgba(249,115,22,0.24)" }}>
              Planı Yönet
            </Link>
          </div>
        </div>

        {/* Red Flags / Notes */}
        <div className="rounded-2xl bg-white p-4 shadow-sm xl:col-span-1" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Uyarılar & Notlar</p>
          <div className="flex flex-col gap-2.5">
            {/* Injury */}
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderLeft: "3px solid #EF4444" }}>
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              <div>
                <p className="text-[12px] font-black text-red-700">🚨 Sağ Omuz Sorun</p>
                <p className="text-xs text-red-600 mt-0.5">Rotator cuff bölgesinde rahatsızlık. Overhead hareketlerde yük azaltılacak.</p>
              </div>
            </div>
            {/* Diet */}
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderLeft: "3px solid #F59E0B" }}>
              <Leaf className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-[12px] font-black text-amber-700">⚠️ Diyet Tercihi</p>
                <p className="text-xs text-amber-600 mt-0.5">Vegan beslenme. Protein kaynakları plant-based olacak şekilde planlandı.</p>
              </div>
            </div>
            {/* Sleep */}
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderLeft: "3px solid #F59E0B" }}>
              <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-[12px] font-black text-amber-700">⚠️ Uyku Düzeni</p>
                <p className="text-xs text-amber-600 mt-0.5">Hafta içi ortalama 5.5 saat uyku. Recovery etkilenebilir.</p>
              </div>
            </div>
            {/* Coach note */}
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: "#E0E7FF", border: "1px solid #C7D2FE", borderLeft: "3px solid #6366F1" }}>
              <span className="mt-0.5 text-lg">📝</span>
              <div>
                <p className="text-[12px] font-black text-indigo-700">Koç Notu</p>
                <p className="text-xs text-indigo-600 mt-0.5">Motivasyon yüksek, beklentileri gerçekçi. Sosyal medyada paylaşımları artırılabilir.</p>
              </div>
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
  const prCards = [
    { name: "Bench Press", value: Math.max(...chartData.map((item) => item.benchPress)), color: "#3B82F6" },
    { name: "Squat", value: Math.max(...chartData.map((item) => item.squat)), color: "#22C55E" },
    { name: "Deadlift", value: Math.max(...chartData.map((item) => item.deadlift)), color: "#8B5CF6" },
  ];

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
      <div className="flex flex-col gap-3">
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

      <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-black text-slate-800">Kişisel Rekorlar</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">Maksimum 1RM</span>
        </div>
        <div className="grid gap-2.5">
          {prCards.map((record) => (
            <div key={record.name} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${record.color}18` }}>
                <span className="text-base">🏆</span>
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-bold text-slate-700">{record.name}</div>
                <div className="text-[10px] text-slate-400">Tahmini zirve</div>
              </div>
              <div className="text-right">
                <div className="text-[16px] font-black" style={{ color: record.color }}>{record.value} kg</div>
              </div>
            </div>
          ))}
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
function BodyTab({ weightKg, goal, fitnessLevel }: { weightKg: number | null; goal: string | null; fitnessLevel: string | null }) {
  const MACROS = [
    { label: "Kalori", current: 2420, target: 2800, unit: "kcal", color: "#FB923C" },
    { label: "Protein", current: 162, target: 180, unit: "g", color: "#22C55E" },
    { label: "Karbonhidrat", current: 280, target: 340, unit: "g", color: "#F59E0B" },
    { label: "Yağ", current: 72, target: 90, unit: "g", color: "#8B5CF6" },
  ];
  const BODY_METRICS_HISTORY = [
    { date: "24 Nis", weight: 82.4, fat: 16.2, waist: 84 },
    { date: "17 Nis", weight: 83.1, fat: 16.8, waist: 85 },
    { date: "10 Nis", weight: 83.8, fat: 17.2, waist: 86 },
    { date: "03 Nis", weight: 84.2, fat: 17.6, waist: 86 },
  ];
  const proteinTarget = weightKg ? Math.round(weightKg * 2) : 170;
  const hydrationTarget = weightKg ? Math.round(weightKg * 35) / 1000 : 2.8;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Macros */}
        <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-black text-slate-800">Günlük Makrolar</p>
            <span className="text-[10px] text-slate-400">30 Nisan 2026</span>
          </div>
          <div className="flex flex-col gap-3.5">
            {MACROS.map((m) => {
              const pct = Math.round((m.current / m.target) * 100);
              return (
                <div key={m.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{m.label}</span>
                    <span className="text-xs font-bold" style={{ color: m.color }}>
                      {m.current}
                      <span className="text-slate-400 font-normal">/{m.target} {m.unit}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg, ${m.color}cc, ${m.color})`, boxShadow: `0 0 8px ${m.color}44` }} />
                  </div>
                  <div className="mt-0.5 text-right text-[10px] text-slate-400">%{pct} tamamlandı</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body Measurements History */}
        <div className="rounded-2xl bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-[13px] font-black text-slate-800">Vücut Ölçümleri</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Tarih", "Kilo", "Yağ %", "Bel (cm)"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BODY_METRICS_HISTORY.map((row, i) => {
                  const prev = BODY_METRICS_HISTORY[i + 1];
                  const weightDiff = prev ? (row.weight - prev.weight).toFixed(1) : null;
                  const fatDiff = prev ? (row.fat - prev.fat).toFixed(1) : null;
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs font-semibold text-slate-600">{row.date}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-black text-slate-800">{row.weight}</span>
                        {weightDiff && (
                          <span className="text-[10px] font-bold ml-1.5" style={{ color: parseFloat(weightDiff) < 0 ? "#22C55E" : "#EF4444" }}>
                            {parseFloat(weightDiff) < 0 ? "↓" : "↑"}{Math.abs(parseFloat(weightDiff))}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-black text-slate-800">{row.fat}%</span>
                        {fatDiff && (
                          <span className="text-[10px] font-bold ml-1.5" style={{ color: parseFloat(fatDiff) < 0 ? "#22C55E" : "#EF4444" }}>
                            {parseFloat(fatDiff) < 0 ? "↓" : "↑"}{Math.abs(parseFloat(fatDiff))}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-black text-slate-800">{row.waist}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-3 rounded-xl px-4 py-2.5 mx-4 mb-3" style={{ background: "#22C55E15", border: "1px solid #22C55E26" }}>
              <div className="text-[12px] font-bold text-green-700">📉 Aylık Özet: −1.8 kg · −1.4% yağ</div>
              <div className="text-[10px] text-slate-400 mt-1">Hedefle uyumlu ilerleme. Devam et!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition Notes */}
      <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-black text-slate-800">Beslenme Notları</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">Türetilmiş</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Diyet Türü", value: "Yüksek Protein", icon: "🌱", color: "#22C55E" },
            { label: "Öğün Sayısı", value: "4 / gün", icon: "🍽️", color: "#FB923C" },
            { label: "Su Tüketimi", value: `${hydrationTarget.toFixed(1)} L`, icon: "💧", color: "#3B82F6" },
            { label: "Takviye", value: goal ? "Kreatin, B12" : "Önerilmemiş", icon: "💊", color: "#8B5CF6" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl px-3 py-3" style={{ background: `${item.color}12`, border: `1px solid ${item.color}26` }}>
              <div className="mb-2 text-lg">{item.icon}</div>
              <div className="text-[13px] font-black text-slate-800">{item.value}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">{item.label}</div>
            </div>
          ))}
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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
          <div className="overflow-x-auto  p-4">
            <div className="flex gap-0.5 ">
              {/* Day labels */}
              <div className="mr-1 flex flex-col gap-0.5 ">
                {DAY_LABELS.map((d, i) => (
                  <div key={i} className="flex h-14 w-6 items-center" style={{ fontSize: 9, color: "#94A3B8" }}>{d}</div>
                ))}
              </div>
              {/* Columns (each week) */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((cell, di) => {
                    const bg = cell.status === "completed" ? "#4ADE80"
                      : cell.status === "missed" ? "#F87171"
                      : "#E2E8F0";
                    return (
                      <div key={di} className="rounded cursor-pointer transition-all duration-150" title={`${cell.date}: ${cell.status}`}
                        style={{ width: 54, height: 54, background: bg }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.transform = "scale(1.25)";
                          (e.target as HTMLElement).style.boxShadow = `0 4px 12px #ffffff66`;
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.transform = "scale(1)";
                          (e.target as HTMLElement).style.boxShadow = "none";
                        }} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Tamamlanan", value: heatmap.filter(h => h.status === "completed").length, color: "#22C55E" },
              { label: "Kaçırılan", value: heatmap.filter(h => h.status === "missed").length, color: "#EF4444" },
              { label: "Dinlenme", value: heatmap.filter(h => h.status === "rest").length, color: "#94A3B8" },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-3 py-2.5" style={{ background: `${s.color}10`, border: `1px solid ${s.color}26` }}>
                <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
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
      <div className="sticky -top-4 z-20 -mx-4 bg-gradient-to-br from-[#1A365D] to-[#2D4A7A] px-4 pb-3 pt-2 shadow-[0_4px_24px_rgba(26,54,93,0.3)] lg:static lg:mx-0 lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:from-transparent lg:to-transparent lg:pb-2 lg:pt-3 lg:shadow-sm">
        {/* Back + actions */}
        <div className="mb-3 flex items-center justify-between">
          <Link href="/coach/clients"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/12 text-white lg:bg-slate-100 lg:text-slate-700">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex gap-2">
            <Link href="/coach/messages"
              className="flex h-8 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-black text-white lg:border lg:border-slate-200 lg:bg-white lg:text-slate-700">
              <MessageCircle className="h-3.5 w-3.5" />Mesaj
            </Link>
            <button className="flex h-8 items-center gap-1.5 rounded-xl bg-orange-500/80 px-3 text-xs font-black text-white lg:bg-orange-500">
              <Bell className="h-3.5 w-3.5" />Uyar
            </button>
          </div>
        </div>

        {/* Avatar + client info */}
        <div className="mb-3 flex items-center gap-3">
          <AvatarRing name={name} compliance={cScore} size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[18px] font-black leading-tight text-white lg:text-slate-800">{name}</h1>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {age && (
                <span className="rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-bold text-white/80 lg:bg-slate-100 lg:text-slate-500">{age} yaş</span>
              )}
              {weightKg && (
                <span className="rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-bold text-white/80 lg:bg-slate-100 lg:text-slate-500">{weightKg} kg</span>
              )}
              {goal && (
                <span className="rounded-full bg-orange-500/70 px-2 py-0.5 text-[10px] font-black text-white">{goal}</span>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/60 lg:text-slate-400">{completedWorkouts}/{totalWorkouts} tamamlandı</span>
              {cScore !== null && (
                <span className="text-[10px] font-black" style={{ color: cColor(cScore) }}>%{cScore} uyum</span>
              )}
            </div>
          </div>
          <AssignTemplateModal clientId={clientId} />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl bg-white/10 p-1 lg:gap-5 lg:rounded-none lg:bg-transparent lg:p-0">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 rounded-lg py-1.5 text-[11px] font-black transition-all lg:flex-none lg:rounded-none lg:px-0 lg:py-2 lg:text-xs ${activeTab === key
                ? "bg-white text-[#1A365D] lg:border-b-2 lg:border-orange-500 lg:bg-transparent lg:text-orange-500"
                : "bg-transparent text-white/60 lg:border-b-2 lg:border-transparent lg:text-slate-400 lg:hover:text-slate-600"}`}>
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
            heatmap={heatmap}
            completedWorkouts={completedWorkouts}
            totalWorkouts={totalWorkouts}
          />
        )}
        {activeTab === "performance" && (
          <PerformanceTab strengthTrend={strengthTrend} weeklyTonnage={weeklyTonnage} />
        )}
        {activeTab === "body" && <BodyTab weightKg={weightKg} goal={goal} fitnessLevel={fitnessLevel} />}
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
