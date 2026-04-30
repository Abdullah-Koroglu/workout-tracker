"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useNotificationContext } from "@/contexts/NotificationContext";

type Plan = {
  id: string;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFats: number | null;
  dietDocumentUrl: string | null;
  instructions: string | null;
};

type FormState = {
  targetCalories: string;
  targetProtein: string;
  targetCarbs: string;
  targetFats: string;
  dietDocumentUrl: string;
  instructions: string;
};

const EMPTY: FormState = {
  targetCalories: "",
  targetProtein: "",
  targetCarbs: "",
  targetFats: "",
  dietDocumentUrl: "",
  instructions: "",
};

function planToForm(plan: Plan | null): FormState {
  if (!plan) return EMPTY;
  return {
    targetCalories: plan.targetCalories?.toString() ?? "",
    targetProtein: plan.targetProtein?.toString() ?? "",
    targetCarbs: plan.targetCarbs?.toString() ?? "",
    targetFats: plan.targetFats?.toString() ?? "",
    dietDocumentUrl: plan.dietDocumentUrl ?? "",
    instructions: plan.instructions ?? "",
  };
}

export function NutritionPlanManager({ clientId }: { clientId: string }) {
  const { success, error } = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch(`/api/coach/clients/${clientId}/nutrition-plan`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        error(data.error || "Beslenme planı yüklenemedi.");
        setLoading(false);
        return;
      }
      setPlan(data.plan);
      setForm(planToForm(data.plan));
      setLoading(false);
    };
    void load();
  }, [clientId, error]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      targetCalories: form.targetCalories ? Number(form.targetCalories) : null,
      targetProtein: form.targetProtein ? Number(form.targetProtein) : null,
      targetCarbs: form.targetCarbs ? Number(form.targetCarbs) : null,
      targetFats: form.targetFats ? Number(form.targetFats) : null,
      dietDocumentUrl: form.dietDocumentUrl.trim() || null,
      instructions: form.instructions.trim() || null,
    };

    const response = await fetch(`/api/coach/clients/${clientId}/nutrition-plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      error(data.error?.formErrors?.[0] || "Plan kaydedilemedi.");
      return;
    }

    setPlan(data.plan);
    setForm(planToForm(data.plan));
    success("Beslenme planı güncellendi.");
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-black text-slate-800">Beslenme Planı</p>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600">
          {plan ? "Aktif" : "Tanımlı değil"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "targetCalories", label: "Kalori (kcal)", placeholder: "2800" },
          { key: "targetProtein", label: "Protein (g)", placeholder: "180" },
          { key: "targetCarbs", label: "Karbonhidrat (g)", placeholder: "340" },
          { key: "targetFats", label: "Yağ (g)", placeholder: "90" },
        ].map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{field.label}</span>
            <input
              type="number"
              min="0"
              value={form[field.key as keyof FormState]}
              onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
              placeholder={field.placeholder}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-orange-400 focus:bg-white focus:outline-none"
            />
          </label>
        ))}
      </div>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diyet PDF / Doküman URL</span>
        <input
          type="url"
          value={form.dietDocumentUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, dietDocumentUrl: event.target.value }))}
          placeholder="https://..."
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-orange-400 focus:bg-white focus:outline-none"
        />
      </label>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notlar / Talimat</span>
        <textarea
          value={form.instructions}
          onChange={(event) => setForm((prev) => ({ ...prev, instructions: event.target.value }))}
          rows={4}
          placeholder="Öğün zamanlaması, takviyeler, özel notlar..."
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-orange-400 focus:bg-white focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #1A365D, #2D4A7A)" }}
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        {saving ? "Kaydediliyor..." : "Planı Kaydet"}
      </button>
    </form>
  );
}
