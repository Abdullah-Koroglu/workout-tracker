"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, Trash2, Save, Loader2 } from "lucide-react";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function AvailabilityManager() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coach/availability")
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoading(false));
  }, []);

  function addSlot() {
    setSlots((prev) => [...prev, { dayOfWeek: 0, startTime: "09:00", endTime: "17:00" }]);
  }

  function removeSlot(idx: number) {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateSlot(idx: number, field: keyof Slot, value: string | number) {
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Kayıt başarısız");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "rgba(249,115,22,0.1)" }}
          >
            <Calendar className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800">Müsaitlik Takvimi</p>
            <p className="text-xs text-slate-400">Danışanların seans rezerve edebileceği saatleri belirleyin</p>
          </div>
        </div>
        <button
          onClick={addSlot}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Gün Ekle
        </button>
      </div>

      {slots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">Henüz müsaitlik saati eklenmedi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
            >
              <select
                value={slot.dayOfWeek}
                onChange={(e) => updateSlot(idx, "dayOfWeek", Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-orange-400"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>

              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateSlot(idx, "startTime", e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-orange-400"
              />
              <span className="text-xs font-bold text-slate-400">—</span>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateSlot(idx, "endTime", e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-orange-400"
              />

              <button
                onClick={() => removeSlot(idx)}
                className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: saved ? "#16A34A" : "linear-gradient(135deg, #1A365D, #2D4A7A)" }}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saved ? "Kaydedildi!" : "Kaydet"}
      </button>
    </div>
  );
}
