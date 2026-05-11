"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Bell, MessageCircle, ChevronLeft, TrendingUp, TrendingDown,
  AlertTriangle, Leaf, Dumbbell, Calendar, ClipboardList,
  Activity, Flame, User, BarChart2, Play, CheckCircle2, X,
} from "lucide-react";
import type { TimelineItem } from "@/lib/coach-timeline";
import { WorkoutHistoryPanel } from "@/components/coach/WorkoutHistoryPanel";
import { AssignmentList } from "@/components/coach/AssignmentList";
import { AssignTemplateModal } from "@/components/coach/AssignTemplateModal";
import { NutritionPlanManager } from "@/components/coach/NutritionPlanManager";
import { MealLogFeed } from "@/components/coach/MealLogFeed";
import { BodyTrackingSettings } from "@/components/coach/BodyTrackingSettings";
import { MovementVideoDetailModal } from "@/components/coach/MovementVideoDetailModal";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { TIER_CONFIG } from "@/lib/tier-limits";
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
  { key: "feedback", label: "Videolar", icon: Play },
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
type BodyLogEntry = {
  id: string; date: string; weight: number | null;
  shoulder: number | null; chest: number | null; waist: number | null;
  hips: number | null; arm: number | null; leg: number | null;
  frontPhotoUrl: string | null; sidePhotoUrl: string | null; backPhotoUrl: string | null;
};

const PHOTO_SLOTS = [
  { key: "frontPhotoUrl" as const, label: "Ön" },
  { key: "sidePhotoUrl" as const, label: "Yan" },
  { key: "backPhotoUrl" as const, label: "Arka" },
];

function BodyTab({ clientId }: { clientId: string; weightKg: number | null; goal: string | null; fitnessLevel: string | null }) {
  const [logs, setLogs] = useState<BodyLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [modalAngle, setModalAngle] = useState<number | null>(null); // null = closed

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetch(`/api/coach/clients/${clientId}/body-logs`)
      .then((r) => r.json())
      .then((data) => setLogs(data.logs ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false));
  }, [clientId]);

  // Close modal on Escape
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

  const weightLogs = [...logs].reverse().filter((l) => l.weight !== null);
  const weightChartData = weightLogs.map((l) => ({
    date: new Date(l.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
    kg: l.weight,
  }));

  const newestLog = logs[0] ?? null;
  const oldestLog = logs[logs.length - 1] ?? null;
  const hasAnyPhoto = newestLog && (newestLog.frontPhotoUrl || newestLog.sidePhotoUrl || newestLog.backPhotoUrl
    || oldestLog?.frontPhotoUrl || oldestLog?.sidePhotoUrl || oldestLog?.backPhotoUrl);

  const firstWeight = weightLogs[0]?.weight ?? null;
  const lastWeight = weightLogs[weightLogs.length - 1]?.weight ?? null;
  const weightDelta = firstWeight !== null && lastWeight !== null
    ? +(lastWeight - firstWeight).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <NutritionPlanManager clientId={clientId} />
        <MealLogFeed clientId={clientId} />
      </div>
      <BodyTrackingSettings clientId={clientId} />

      {/* ── Kilo Trendi ────────────────────────────────────────────────────── */}
      {loadingLogs ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      ) : weightChartData.length >= 2 ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-black text-slate-800">Kilo Trendi</p>
              <p className="text-[10px] text-slate-400">{logs.length} kayıt · kg</p>
            </div>
            {weightDelta !== null && (
              <span className="rounded-full px-2.5 py-1 text-[11px] font-black text-white"
                style={{ background: weightDelta <= 0 ? "#22C55E" : "#EF4444" }}>
                {weightDelta > 0 ? "+" : ""}{weightDelta} kg
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightChartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="kg" name="Kilo" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3, fill: "#7C3AED" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* ── Before / After — 3-angle thumbnail grid ────────────────────────── */}
      {!loadingLogs && newestLog && oldestLog && newestLog.id !== oldestLog.id && hasAnyPhoto && (
        <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-black text-slate-800">Before / After</p>
              <p className="text-[10px] text-slate-400">
                {new Date(oldestLog.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                {" → "}
                {new Date(newestLog.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                {" · Büyütmek için tıkla"}
              </p>
            </div>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-black text-purple-600">
              3 açı
            </span>
          </div>

          {/* Thumbnail grid: 3 columns, each showing before+after stacked */}
          <div className="grid grid-cols-3 gap-2">
            {PHOTO_SLOTS.map((slot, idx) => {
              const beforeUrl = oldestLog[slot.key];
              const afterUrl = newestLog[slot.key];
              const hasPhoto = beforeUrl || afterUrl;
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
                  {/* Before thumb */}
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
                  {/* After thumb */}
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
                  {/* Zoom hint */}
                  {hasPhoto && (
                    <p className="text-center text-[9px] text-slate-300 group-hover:text-purple-400 transition-colors">
                      🔍 Büyüt
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Photo Modal ─────────────────────────────────────────────────────── */}
      {modalAngle !== null && newestLog && oldestLog && (
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
                  {new Date(oldestLog.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  {" → "}
                  {new Date(newestLog.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
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
                { label: "ÖNCE", url: oldestLog[PHOTO_SLOTS[modalAngle].key], date: oldestLog.date },
                { label: "SONRA", url: newestLog[PHOTO_SLOTS[modalAngle].key], date: newestLog.date },
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

            {/* Pagination — prev / dots / next */}
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

      {/* ── Body Metrics Log Table ──────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-[13px] font-black text-slate-800">Vücut Ölçümleri</p>
          <span className="text-[11px] text-slate-400">{logs.length} kayıt</span>
        </div>
        {loadingLogs ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <span className="text-3xl">📏</span>
            <p className="text-[13px] text-slate-400">Henüz ölçüm girilmemiş.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Tarih", "Kilo", "Omuz", "Göğüs", "Bel", "Kalça", "Kol", "Bacak", "Foto"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 15).map((row, i) => {
                  const prev = logs[i + 1];
                  const wDiff = prev?.weight != null && row.weight != null
                    ? +(row.weight - prev.weight).toFixed(1) : null;
                  return (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 text-[12px] font-semibold text-slate-600 whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {row.weight != null ? (
                          <span className="flex items-center gap-1">
                            <span className="text-[13px] font-black text-slate-800">{row.weight}</span>
                            {wDiff !== null && wDiff !== 0 && (
                              <span className="text-[10px] font-bold" style={{ color: wDiff < 0 ? "#22C55E" : "#EF4444" }}>
                                {wDiff < 0 ? "↓" : "↑"}{Math.abs(wDiff)}
                              </span>
                            )}
                          </span>
                        ) : <span className="text-slate-300 text-[12px]">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] font-black text-slate-800">{row.shoulder ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-2.5 text-[13px] font-black text-slate-800">{row.chest ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-2.5 text-[13px] font-black text-slate-800">{row.waist ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-2.5 text-[13px] font-black text-slate-800">{row.hips ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-2.5 text-[13px] font-black text-slate-800">{row.arm ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-2.5 text-[13px] font-black text-slate-800">{row.leg ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-2.5 text-[14px]">
                        {row.frontPhotoUrl || row.sidePhotoUrl || row.backPhotoUrl
                          ? <button type="button" onClick={() => setModalAngle(0)} className="text-purple-500 hover:text-purple-700">📸</button>
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

// ─── TAB 5: Feedback (Movement Videos) ───────────────────────────────────────
function FeedbackTab({ clientId }: { clientId: string }) {
  const [videos, setVideos] = useState<Array<{
    id: string;
    movementName: string;
    videoPath: string;
    watchedByCoach: boolean;
    createdAt: string;
    durationSeconds: number;
    commentCount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/coach/clients/${clientId}/movement-videos?limit=100`);
        if (!res.ok) throw new Error("Videolar yüklenemedi.");
        const data = await res.json();
        setVideos(data.videos);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [clientId]);

  if (loading) return <div className="p-4 text-center text-slate-500">Videolar yükleniyor...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Play className="mx-auto mb-3 h-8 w-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">Henüz video yok</p>
        <p className="mt-1 text-xs text-slate-500">İstemci antrenman sırasında hareketnin videosunu çektiğinde burada görünecektir.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {videos.map((video) => (
        <button
          key={video.id}
          onClick={() => setSelectedVideo(video.id)}
          className="w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:shadow-md"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
            {/* Thumbnail */}
            <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden rounded-lg bg-black md:w-32">
              <video
                src={video.videoPath}
                className="h-full w-full object-cover"
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                <Play className="h-6 w-6 text-white opacity-60" />
              </div>
              {!video.watchedByCoach && (
                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-orange-500" title="Yeni video" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {video.movementName}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {new Date(video.createdAt).toLocaleDateString("tr-TR")} • {video.durationSeconds}s
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}>
                  {video.commentCount} yorum
                </span>
                {!video.watchedByCoach && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}>
                    YENİ
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}

      {selectedVideo && (
        <MovementVideoDetailModal
          videoId={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
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
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-20 -mx-4 bg-gradient-to-br from-[#1A365D] to-[#2D4A7A] px-4 pb-3 pt-2 shadow-[0_4px_24px_rgba(26,54,93,0.3)] lg:static lg:mx-0 lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:from-transparent lg:to-transparent lg:pb-2 lg:pt-3 lg:shadow-sm">
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
          {TABS.map(({ key, label }) => {
            const isLocked =
              (key === "performance" && !TIER_CONFIG[subscriptionTier as keyof typeof TIER_CONFIG]?.analytics) ||
              (key === "body" && !TIER_CONFIG[subscriptionTier as keyof typeof TIER_CONFIG]?.bodyTracking);
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-black transition-all lg:flex-none lg:rounded-none lg:px-0 lg:py-2 lg:text-xs ${activeTab === key
                  ? "bg-white text-[#1A365D] lg:border-b-2 lg:border-orange-500 lg:bg-transparent lg:text-orange-500"
                  : "bg-transparent text-white/60 lg:border-b-2 lg:border-transparent lg:text-slate-400 lg:hover:text-slate-600"}`}>
                {label}
                {isLocked && <span className="ml-0.5 text-[9px]">🔒</span>}
              </button>
            );
          })}
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
          <FeatureGate feature="analytics" tier={subscriptionTier as import("@prisma/client").SubscriptionTier}>
            <PerformanceTab strengthTrend={strengthTrend} weeklyTonnage={weeklyTonnage} />
          </FeatureGate>
        )}
        {activeTab === "body" && (
          <FeatureGate feature="bodyTracking" tier={subscriptionTier as import("@prisma/client").SubscriptionTier}>
            <BodyTab clientId={clientId} weightKg={weightKg} goal={goal} fitnessLevel={fitnessLevel} />
          </FeatureGate>
        )}
        {activeTab === "history" && (
          <HistoryTab
            heatmap={heatmap}
            timelineItems={timelineItems}
            currentPage={currentPage}
            totalPages={totalPages}
            clientId={clientId}
          />
        )}
        {activeTab === "feedback" && (
          <FeedbackTab clientId={clientId} />
        )}
      </div>
    </div>
  );
}
