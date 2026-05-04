"use client";

import { useState, useEffect } from "react";

type Frequency =
  | "OFF" | "DAILY" | "EVERY_2_DAYS" | "EVERY_3_DAYS"
  | "TWICE_A_WEEK" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "OFF", label: "Kapalı" },
  { value: "DAILY", label: "Her gün" },
  { value: "EVERY_2_DAYS", label: "2 günde bir" },
  { value: "EVERY_3_DAYS", label: "3 günde bir" },
  { value: "TWICE_A_WEEK", label: "Haftada 2 kez" },
  { value: "WEEKLY", label: "Haftada 1 kez" },
  { value: "BIWEEKLY", label: "2 haftada bir" },
  { value: "MONTHLY", label: "Ayda bir" },
];

const MEASUREMENTS = [
  { key: "shoulder", label: "Omuz" },
  { key: "chest", label: "Göğüs" },
  { key: "waist", label: "Bel" },
  { key: "hips", label: "Kalça" },
  { key: "arm", label: "Kol" },
  { key: "leg", label: "Bacak" },
];

export function BodyTrackingSettings({ clientId }: { clientId: string }) {
  const [weightFreq, setWeightFreq] = useState<Frequency>("OFF");
  const [measurementFreq, setMeasurementFreq] = useState<Frequency>("OFF");
  const [photoFreq, setPhotoFreq] = useState<Frequency>("OFF");
  const [activeMeasurements, setActiveMeasurements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/coach/clients/${clientId}/body-preferences`)
      .then((r) => r.json())
      .then((data) => {
        if (data.prefs) {
          setWeightFreq(data.prefs.weightFreq ?? "OFF");
          setMeasurementFreq(data.prefs.measurementFreq ?? "OFF");
          setPhotoFreq(data.prefs.photoFreq ?? "OFF");
          try {
            setActiveMeasurements(JSON.parse(data.prefs.activeMeasurements ?? "[]"));
          } catch {
            setActiveMeasurements([]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  function toggleMeasurement(key: string) {
    setActiveMeasurements((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/coach/clients/${clientId}/body-preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightFreq, measurementFreq, photoFreq, activeMeasurements }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Vücut Takip Ayarları</p>
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4">Vücut Takip Ayarları</p>

      <div className="flex flex-col gap-4">
        {/* Weight Frequency */}
        <div>
          <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Kilo Takibi</label>
          <select
            value={weightFreq}
            onChange={(e) => setWeightFreq(e.target.value as Frequency)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 focus:border-orange-400 focus:outline-none"
          >
            {FREQ_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Measurement Frequency */}
        <div>
          <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Ölçüm Takibi</label>
          <select
            value={measurementFreq}
            onChange={(e) => setMeasurementFreq(e.target.value as Frequency)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 focus:border-orange-400 focus:outline-none"
          >
            {FREQ_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Active Measurements (shown only if measurementFreq != OFF) */}
        {measurementFreq !== "OFF" && (
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-2">Aktif Ölçüm Bölgeleri</label>
            <div className="flex flex-wrap gap-2">
              {MEASUREMENTS.map((m) => {
                const active = activeMeasurements.includes(m.key);
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleMeasurement(m.key)}
                    className="rounded-xl px-3 py-1.5 text-[12px] font-bold transition-colors"
                    style={{
                      background: active ? "#F97316" : "#F1F5F9",
                      color: active ? "#fff" : "#64748B",
                      border: active ? "1px solid #EA580C" : "1px solid #E2E8F0",
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Photo Frequency */}
        <div>
          <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Fotoğraf Takibi</label>
          <select
            value={photoFreq}
            onChange={(e) => setPhotoFreq(e.target.value as Frequency)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 focus:border-orange-400 focus:outline-none"
          >
            {FREQ_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-1 h-10 rounded-xl text-[13px] font-black text-white transition-opacity disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
        >
          {saving ? "Kaydediliyor…" : saved ? "✓ Kaydedildi" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
