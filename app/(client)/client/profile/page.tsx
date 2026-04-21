"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, User2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";

type ClientProfileData = {
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  fitnessLevel: string | null;
};

const GOALS = [
  { value: "kilo_verme", label: "Kilo Verme" },
  { value: "guc_kazanma", label: "Güç Kazanma" },
  { value: "hacim", label: "Hacim / Kas Kitlesi" },
  { value: "kondisyon", label: "Kondisyon & Dayanıklılık" },
  { value: "genel_saglik", label: "Genel Sağlık & Fit Kalmak" },
];

const FITNESS_LEVELS = [
  { value: "baslangic", label: "Başlangıç (0–1 yıl)" },
  { value: "orta", label: "Orta (1–3 yıl)" },
  { value: "ileri", label: "İleri (3+ yıl)" },
];

export default function ClientProfilePage() {
  const { success, error: notifyError } = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [birthDate, setBirthDate] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goal, setGoal] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) {
        const p = data.profile as ClientProfileData;
        setBirthDate(p.birthDate ? p.birthDate.slice(0, 10) : "");
        setHeightCm(p.heightCm != null ? String(p.heightCm) : "");
        setWeightKg(p.weightKg != null ? String(p.weightKg) : "");
        setGoal(p.goal ?? "");
        setFitnessLevel(p.fitnessLevel ?? "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthDate: birthDate || null,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        goal: goal || null,
        fitnessLevel: fitnessLevel || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      notifyError("Profil kaydedilemedi.");
      return;
    }
    success("Profil güncellendi.");
  };

  if (loading) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Hesabım</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">Profilim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Koçunuzun sizi daha iyi tanımasına yardımcı olacak bilgiler.
        </p>
      </div>

      <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-2">
          <User2 className="h-4 w-4 text-emerald-600" />
          <h2 className="text-base font-bold">Fiziksel Bilgiler</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Birth date */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Doğum Tarihi</label>
            <input
              type="date"
              value={birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setBirthDate(e.target.value)}
              className="h-10 w-full rounded-xl border bg-muted/30 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Height */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Boy (cm)</label>
            <input
              type="number"
              min={100}
              max={250}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="örn. 175"
              className="h-10 w-full rounded-xl border bg-muted/30 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Kilo (kg)</label>
            <input
              type="number"
              min={30}
              max={300}
              step={0.1}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="örn. 70"
              className="h-10 w-full rounded-xl border bg-muted/30 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Goal */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Fitness Hedefim</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {GOALS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setGoal(goal === value ? "" : value)}
                className={`rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition ${
                  goal === value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold"
                    : "border-border bg-card text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Fitness Level */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Fitness Seviyem</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {FITNESS_LEVELS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFitnessLevel(fitnessLevel === value ? "" : value)}
                className={`rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
                  fitnessLevel === value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold"
                    : "border-border bg-card text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* BMI display */}
        {heightCm && weightKg && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="text-xs font-semibold text-emerald-700">
              VKİ (BMI):{" "}
              <span className="text-base font-black">
                {(Number(weightKg) / Math.pow(Number(heightCm) / 100, 2)).toFixed(1)}
              </span>
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Kaydediliyor..." : "Profili Kaydet"}
        </Button>
      </section>
    </div>
  );
}
