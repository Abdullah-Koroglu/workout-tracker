"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const MEASUREMENT_LABELS: Record<string, string> = {
  shoulder: "Omuz (cm)",
  chest: "Göğüs (cm)",
  waist: "Bel (cm)",
  hips: "Kalça (cm)",
  arm: "Kol (cm)",
  leg: "Bacak (cm)",
};

type Status = {
  required: boolean;
  alreadyLoggedToday: boolean;
  requiresWeight: boolean;
  requiresMeasurements: boolean;
  requiresPhotos: boolean;
  activeMeasurements: string[];
  totalLogs: number;
};

const ADVANCED_FIELDS: { name: string; label: string; step: string; min: string; max: string }[] = [
  { name: "bodyFatPercent", label: "Vücut Yağ %", step: "0.1", min: "1", max: "70" },
  { name: "muscleMassKg", label: "Kas Kütlesi (kg)", step: "0.1", min: "10", max: "120" },
  { name: "waterPercent", label: "Su %", step: "0.1", min: "20", max: "80" },
  { name: "boneMassKg", label: "Kemik (kg)", step: "0.1", min: "1", max: "10" },
  { name: "visceralFat", label: "Viseral Yağ", step: "1", min: "1", max: "60" },
  { name: "sleepHours", label: "Uyku (sa)", step: "0.1", min: "0", max: "24" },
  { name: "restingHR", label: "Dinlenme NB", step: "1", min: "30", max: "200" },
  { name: "hrv", label: "HRV (ms)", step: "1", min: "0", max: "300" },
  { name: "neckMeasurement", label: "Boyun (cm)", step: "0.1", min: "20", max: "60" },
  { name: "forearm", label: "Önkol (cm)", step: "0.1", min: "15", max: "50" },
  { name: "calf", label: "Baldır (cm)", step: "0.1", min: "20", max: "70" },
];

export function BodyCheckInCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch("/api/client/body-tracking-status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  if (!status) return null;
  if (!status.required && status.totalLogs === 0) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    setSubmitting(true);
    setError(null);

    const fd = new FormData(formRef.current);

    try {
      const res = await fetch("/api/client/body-log", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      setDone(true);
      setOpen(false);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Card (collapsed) — only shown when action required today */}
      {status.required && !done && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full rounded-[20px] p-5 text-left text-white shadow-sm transition hover:opacity-95"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
            boxShadow: "0 12px 30px rgba(124,58,237,0.32)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/75">
                Bugünün Görevi
              </p>
              <h3 className="mt-1 text-[22px] font-black leading-tight">
                📏 Fiziksel Takip
              </h3>
              <p className="mt-1.5 text-sm font-semibold text-white/90">
                {[
                  status.requiresWeight && "Kilo",
                  status.requiresMeasurements && "Ölçüm",
                  status.requiresPhotos && "Fotoğraf",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="rounded-full bg-white/20 px-4 py-2 text-[12px] font-black uppercase tracking-wider shrink-0">
              Gir →
            </div>
          </div>
        </button>
      )}

      {/* Inline form (expanded) — only when action required */}
      {status.required && !done && open && (
        <div
          className="rounded-[20px] bg-white p-5 shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,0.06)", borderTop: "4px solid #7C3AED" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-black text-slate-800">📏 Fiziksel Takip</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 text-[13px] font-semibold"
            >
              İptal
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Weight */}
            {status.requiresWeight && (
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1">
                  Kilo (kg)
                </label>
                <input
                  name="weight"
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  placeholder="ör. 75.5"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] text-slate-800 focus:border-purple-400 focus:outline-none"
                />
              </div>
            )}

            {/* Measurements */}
            {status.requiresMeasurements && status.activeMeasurements.length > 0 && (
              <div>
                <p className="text-[12px] font-bold text-slate-600 mb-2">Vücut Ölçüleri</p>
                <div className="grid grid-cols-2 gap-2">
                  {status.activeMeasurements.map((key) => (
                    <div key={key}>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        {MEASUREMENT_LABELS[key] ?? key}
                      </label>
                      <input
                        name={key}
                        type="number"
                        step="0.1"
                        min="1"
                        max="300"
                        placeholder="cm"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-800 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {status.requiresPhotos && (
              <div>
                <p className="text-[12px] font-bold text-slate-600 mb-2">Check-in Fotoğrafları</p>
                <div className="flex flex-col gap-2">
                  {[
                    { name: "frontPhoto", label: "Ön" },
                    { name: "sidePhoto", label: "Yan" },
                    { name: "backPhoto", label: "Arka" },
                  ].map((photo) => (
                    <div key={photo.name}>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        {photo.label} Fotoğraf
                      </label>
                      <input
                        name={photo.name}
                        type="file"
                        accept="image/*"
                        className="w-full text-[13px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-50 file:px-3 file:py-1.5 file:text-[12px] file:font-bold file:text-purple-700"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced metrics (optional) */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-[12px] font-black text-slate-600 hover:bg-slate-100"
              >
                {showAdvanced ? "▾" : "▸"} Detaylı Metrikler (opsiyonel)
              </button>
              {showAdvanced && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ADVANCED_FIELDS.map((f) => (
                    <div key={f.name}>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        {f.label}
                      </label>
                      <input
                        name={f.name}
                        type="number"
                        step={f.step}
                        min={f.min}
                        max={f.max}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-800 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-12 rounded-xl text-[14px] font-black text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
            >
              {submitting ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </form>
        </div>
      )}
      {/* History link — shown when previous logs exist */}
      {status.totalLogs > 0 && (
        <Link
          href="/client/body-progress"
          className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[18px]">📊</span>
            <div>
              <p className="text-[13px] font-black text-slate-800">Dönüşüm Radarım</p>
              <p className="text-[11px] text-slate-400">{status.totalLogs} kayıt · kilo, ölçüm, fotoğraf</p>
            </div>
          </div>
          <span className="text-[12px] font-semibold text-purple-600">Gör →</span>
        </Link>
      )}
    </>
  );
}
