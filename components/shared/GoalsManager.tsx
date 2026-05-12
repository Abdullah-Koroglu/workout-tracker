"use client";

import { useEffect, useState } from "react";
import { Target, Plus, Check, X, Loader2, Calendar, Trash2 } from "lucide-react";

interface Milestone {
  id?: string;
  title: string;
  achievedAt: string | null;
  order: number;
}

interface Goal {
  id: string;
  title: string;
  type: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  targetDate: string | null;
  status: "active" | "achieved" | "abandoned";
  milestones: Milestone[];
}

const GOAL_TYPES = [
  { value: "weight_loss", label: "Kilo Verme" },
  { value: "muscle_gain", label: "Kas Kazanma" },
  { value: "strength", label: "Güç" },
  { value: "endurance", label: "Dayanıklılık" },
  { value: "habit", label: "Alışkanlık" },
  { value: "other", label: "Diğer" },
];

interface Props {
  clientId?: string;
  readOnly?: boolean;
}

export function GoalsManager({ clientId, readOnly = false }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "weight_loss",
    targetValue: "",
    currentValue: "",
    unit: "kg",
    targetDate: "",
  });

  const qs = clientId ? `?clientId=${clientId}` : "";

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/goals${qs}`);
    const d = await res.json();
    setGoals(d.goals ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [clientId]);

  async function createGoal() {
    if (!form.title.trim()) return;
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(clientId ? { clientId } : {}),
        title: form.title,
        type: form.type,
        targetValue: form.targetValue ? parseFloat(form.targetValue) : null,
        currentValue: form.currentValue ? parseFloat(form.currentValue) : null,
        unit: form.unit || null,
        targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
      }),
    });
    setForm({ title: "", type: "weight_loss", targetValue: "", currentValue: "", unit: "kg", targetDate: "" });
    setCreating(false);
    await load();
  }

  async function updateGoal(id: string, patch: Partial<Goal>) {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  }

  async function deleteGoal(id: string) {
    if (!confirm("Bu hedefi silmek istiyor musunuz?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
            <Target className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="text-base font-black text-slate-800">Hedefler</h2>
        </div>
        {!readOnly && !creating && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-600"
          >
            <Plus className="h-3.5 w-3.5" /> Yeni Hedef
          </button>
        )}
      </div>

      {creating && (
        <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-2">
          <input
            placeholder="Hedef başlığı (ör. 5kg ver)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="h-10 w-full rounded-xl bg-slate-50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="h-10 rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              className="h-10 rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="Mevcut"
              value={form.currentValue}
              onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
              className="h-10 rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              type="number"
              placeholder="Hedef"
              value={form.targetValue}
              onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
              className="h-10 rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              placeholder="Birim"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="h-10 rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={createGoal} className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-black text-white hover:bg-emerald-600">
              Oluştur
            </button>
            <button onClick={() => setCreating(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
              İptal
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 && !creating && (
        <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">
          Henüz hedef yok.
        </div>
      )}

      {goals.map((g) => {
        const progress =
          g.targetValue != null && g.currentValue != null && g.targetValue !== 0
            ? Math.min(100, Math.max(0, (g.currentValue / g.targetValue) * 100))
            : null;
        return (
          <div key={g.id} className="rounded-2xl bg-white border border-slate-100 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800">{g.title}</p>
                <p className="text-xs text-slate-400">
                  {GOAL_TYPES.find((t) => t.value === g.type)?.label ?? g.type}
                  {g.targetDate && (
                    <> · <Calendar className="inline h-3 w-3" /> {new Date(g.targetDate).toLocaleDateString("tr-TR")}</>
                  )}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                g.status === "achieved" ? "bg-emerald-100 text-emerald-600" :
                g.status === "abandoned" ? "bg-slate-100 text-slate-400" :
                "bg-orange-100 text-orange-600"
              }`}>
                {g.status === "achieved" ? "Başarıldı" : g.status === "abandoned" ? "Bırakıldı" : "Aktif"}
              </span>
            </div>

            {progress != null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-600">
                    {g.currentValue}/{g.targetValue} {g.unit}
                  </span>
                  <span className="font-black text-emerald-600">%{Math.round(progress)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {!readOnly && g.status === "active" && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => updateGoal(g.id, { status: "achieved" })}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-100"
                >
                  <Check className="h-3 w-3" /> Tamamlandı
                </button>
                <button
                  onClick={() => updateGoal(g.id, { status: "abandoned" })}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-3 w-3" /> Bırak
                </button>
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-500 hover:bg-rose-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
