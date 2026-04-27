"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  Calendar,
  ChevronRight,
  Loader2,
  LogOut,
  Ruler,
  Save,
  Scale,
  Target,
  User2,
  Zap,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useNotificationContext } from "@/contexts/NotificationContext";

/* ─── Types & constants ─────────────────────────────── */
type ClientProfileData = {
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  fitnessLevel: string | null;
};

const GOALS = [
  { value: "kilo_verme",    label: "Kilo Verme",            emoji: "🔥" },
  { value: "guc_kazanma",   label: "Güç Kazanma",           emoji: "💪" },
  { value: "hacim",         label: "Hacim / Kas Kitlesi",   emoji: "🏋️" },
  { value: "kondisyon",     label: "Kondisyon & Dayanıklılık", emoji: "🏃" },
  { value: "genel_saglik",  label: "Genel Sağlık & Fit",    emoji: "✨" },
];

const FITNESS_LEVELS = [
  { value: "baslangic", label: "Başlangıç", sub: "0–1 yıl" },
  { value: "orta",      label: "Orta",      sub: "1–3 yıl" },
  { value: "ileri",     label: "İleri",     sub: "3+ yıl"  },
];

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2);
}

function bmi(h: string, w: string) {
  const hm = Number(h) / 100;
  const kg = Number(w);
  if (!hm || !kg) return null;
  const val = kg / (hm * hm);
  const label =
    val < 18.5 ? "Zayıf" :
    val < 25   ? "Normal" :
    val < 30   ? "Fazla Kilolu" : "Obez";
  const color =
    val < 18.5 ? "#2563EB" :
    val < 25   ? "#22C55E" :
    val < 30   ? "#F59E0B" : "#EF4444";
  return { val: val.toFixed(1), label, color };
}

/* ─── Component ──────────────────────────────────────── */
export default function ClientProfilePage() {
  const { success, error: notifyError } = useNotificationContext();
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [name, setName]             = useState("Kullanıcı");

  const [birthDate,    setBirthDate]    = useState("");
  const [heightCm,     setHeightCm]     = useState("");
  const [weightKg,     setWeightKg]     = useState("");
  const [goal,         setGoal]         = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res  = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) {
        const p = data.profile as ClientProfileData & { name?: string };
        setBirthDate(p.birthDate ? p.birthDate.slice(0, 10) : "");
        setHeightCm(p.heightCm != null ? String(p.heightCm) : "");
        setWeightKg(p.weightKg != null ? String(p.weightKg) : "");
        setGoal(p.goal ?? "");
        setFitnessLevel(p.fitnessLevel ?? "");
        if (p.name) setName(p.name);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthDate:    birthDate    || null,
        heightCm:     heightCm    ? Number(heightCm) : null,
        weightKg:     weightKg    ? Number(weightKg) : null,
        goal:         goal        || null,
        fitnessLevel: fitnessLevel || null,
      }),
    });
    setSaving(false);
    if (!res.ok) { notifyError("Profil kaydedilemedi."); return; }
    success("Profil güncellendi.");
  };

  const bmiInfo = bmi(heightCm, weightKg);

  if (loading) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  /* ─── Input class ─────────────────────────────────────── */
  const inputCls =
    "h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm font-medium text-slate-700 " +
    "focus:outline-none focus:ring-2 focus:ring-orange-400 transition placeholder:text-slate-300";

  return (
    <div className="space-y-6 pb-16">

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)" }}
      >
        {/* glow */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white"
              style={{
                background: "linear-gradient(135deg, #FB923C, #EA580C)",
                boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
              }}
            >
              {getInitials(name)}
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-0.5">
                Danışan
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white">{name}</h1>
              <p className="text-sm text-slate-400">
                {GOALS.find((g) => g.value === goal)?.label ?? "Hedef belirlenmedi"}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Ruler, label: "Boy", value: heightCm ? `${heightCm} cm` : "—" },
              { icon: Scale, label: "Kilo", value: weightKg ? `${weightKg} kg` : "—" },
              ...(bmiInfo
                ? [{ icon: Activity, label: "BMI", value: bmiInfo.val, valueColor: bmiInfo.color }]
                : []),
            ].map(({ icon: Icon, label, value, valueColor }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-xl px-4 py-2.5 text-center"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Icon className="mb-1 h-3.5 w-3.5 text-slate-400" />
                <span
                  className="text-lg font-black leading-none"
                  style={{ color: valueColor ?? "#fff" }}
                >
                  {value}
                </span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop 2-col layout ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── LEFT: physical info + goal + level ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Physical info card */}
          <div
            className="rounded-2xl bg-white p-6"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="mb-5 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "rgba(249,115,22,0.1)" }}
              >
                <User2 className="h-4 w-4 text-orange-500" />
              </div>
              <h2 className="text-base font-black text-slate-800">Fiziksel Bilgiler</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Doğum Tarihi",
                  icon: Calendar,
                  content: (
                    <input
                      type="date"
                      value={birthDate}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className={inputCls}
                    />
                  ),
                },
                {
                  label: "Boy (cm)",
                  icon: Ruler,
                  content: (
                    <input
                      type="number"
                      min={100}
                      max={250}
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="örn. 175"
                      className={inputCls}
                    />
                  ),
                },
                {
                  label: "Kilo (kg)",
                  icon: Scale,
                  content: (
                    <input
                      type="number"
                      min={30}
                      max={300}
                      step={0.1}
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="örn. 70"
                      className={inputCls}
                    />
                  ),
                },
              ].map(({ label, icon: Icon, content }) => (
                <div key={label} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </label>
                  {content}
                </div>
              ))}
            </div>

            {/* BMI bar */}
            {bmiInfo && (
              <div
                className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: `${bmiInfo.color}12`, border: `1px solid ${bmiInfo.color}30` }}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">VKİ (BMI)</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black" style={{ color: bmiInfo.color }}>{bmiInfo.val}</span>
                    <span className="text-xs font-bold" style={{ color: bmiInfo.color }}>{bmiInfo.label}</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 opacity-20" style={{ color: bmiInfo.color }} />
              </div>
            )}
          </div>

          {/* Fitness Goal card */}
          <div
            className="rounded-2xl bg-white p-6"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="mb-5 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "rgba(37,99,235,0.1)" }}
              >
                <Target className="h-4 w-4 text-blue-500" />
              </div>
              <h2 className="text-base font-black text-slate-800">Fitness Hedefim</h2>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {GOALS.map(({ value, label, emoji }) => {
                const active = goal === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGoal(active ? "" : value)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-150"
                    style={
                      active
                        ? {
                            background: "linear-gradient(135deg, #FB923C, #EA580C)",
                            boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
                            color: "#fff",
                          }
                        : {
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            color: "#475569",
                          }
                    }
                  >
                    <span className="text-xl leading-none">{emoji}</span>
                    <span className="text-sm font-bold">{label}</span>
                    {active && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fitness Level card */}
          <div
            className="rounded-2xl bg-white p-6"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="mb-5 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <Zap className="h-4 w-4 text-green-500" />
              </div>
              <h2 className="text-base font-black text-slate-800">Fitness Seviyem</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {FITNESS_LEVELS.map(({ value, label, sub }, i) => {
                const active = fitnessLevel === value;
                const colors = [
                  { bg: "rgba(37,99,235,0.1)",  active: "#2563EB", glow: "rgba(37,99,235,0.3)"  },
                  { bg: "rgba(249,115,22,0.1)", active: "#EA580C", glow: "rgba(249,115,22,0.3)" },
                  { bg: "rgba(34,197,94,0.1)",  active: "#16A34A", glow: "rgba(34,197,94,0.3)"  },
                ][i];
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFitnessLevel(active ? "" : value)}
                    className="flex flex-col items-center rounded-xl p-4 transition-all duration-150"
                    style={
                      active
                        ? {
                            background: colors.active,
                            boxShadow: `0 4px 12px ${colors.glow}`,
                            color: "#fff",
                          }
                        : { background: colors.bg, color: "#64748B" }
                    }
                  >
                    <span className="text-lg font-black leading-none">{i + 1}</span>
                    <span className="mt-1 text-sm font-bold">{label}</span>
                    <span className={`mt-0.5 text-[10px] font-medium ${active ? "opacity-80" : "text-slate-400"}`}>
                      {sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #FB923C, #EA580C)",
              boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Kaydediliyor..." : "Profili Kaydet"}
          </button>
        </div>

        {/* ── RIGHT: quick links ── */}
        <div className="space-y-4">

          {/* Coach connections card */}
          <div
            className="rounded-2xl bg-white p-5"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Hızlı Erişim</h3>
            <div className="space-y-2">
              <Link
                href="/client/coaches"
                className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: "rgba(26,54,93,0.1)" }}
                  >
                    <User2 className="h-4 w-4" style={{ color: "#1A365D" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Koç Bağlantıları</p>
                    <p className="text-[11px] text-slate-400">Koçlarını yönet ve keşfet</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>

              <Link
                href="/client/calendar"
                className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: "rgba(37,99,235,0.1)" }}
                  >
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Takvim</p>
                    <p className="text-[11px] text-slate-400">Antrenman programın</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>
            </div>
          </div>

          {/* Danger zone */}
          <div
            className="rounded-2xl bg-white p-5"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Hesap</h3>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-red-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 flex-shrink-0">
                <LogOut className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-600">Çıkış Yap</p>
                <p className="text-[11px] text-slate-400">Oturumu kapat</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
