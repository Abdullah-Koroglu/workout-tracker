"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, X, Loader2, CheckCircle2 } from "lucide-react";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const SESSION_TYPES = [
  { value: "consultation", label: "İlk Görüşme" },
  { value: "follow_up", label: "Takip Seansı" },
  { value: "check_in", label: "İlerleme Kontrolü" },
];

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Props {
  coachId: string;
  coachName: string;
  onClose: () => void;
}

export function SessionBookingModal({ coachId, coachName, onClose }: Props) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("consultation");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/marketplace/coaches/${coachId}`)
      .then((r) => r.json())
      .then(async () => {
        // Load coach availability
        const res = await fetch(`/api/coach/availability/public?coachId=${coachId}`);
        if (res.ok) {
          const d = await res.json();
          setAvailability(d.slots ?? []);
        }
      })
      .finally(() => setLoadingSlots(false));
  }, [coachId]);

  const selectedDayOfWeek = date
    ? (new Date(date).getDay() + 6) % 7 // Convert JS Sunday=0 to Monday=0
    : null;

  const daySlot =
    selectedDayOfWeek !== null
      ? availability.find((s) => s.dayOfWeek === selectedDayOfWeek)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) {
      setError("Tarih ve saat seçiniz");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const scheduledFor = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId, scheduledFor, duration, type, notes: notes || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Bir hata oluştu");
        return;
      }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
        style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "rgba(249,115,22,0.1)" }}
            >
              <Calendar className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Seans Planla</p>
              <p className="text-xs text-slate-400">{coachName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-base font-black text-slate-800">Seans Talep Edildi!</p>
            <p className="text-sm text-slate-500">
              Koçunuz talebi onayladıktan sonra size bildirim gelecektir.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl px-6 py-2.5 text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
            >
              Kapat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Availability hint */}
            {!loadingSlots && availability.length > 0 && (
              <div className="rounded-xl bg-orange-50 border border-orange-100 px-3 py-2.5">
                <p className="text-[11px] font-bold text-orange-700 mb-1">Müsaitlik Saatleri</p>
                <div className="flex flex-wrap gap-1.5">
                  {availability.map((s) => (
                    <span
                      key={s.dayOfWeek}
                      className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-orange-200"
                    >
                      {DAYS[s.dayOfWeek]} {s.startTime}–{s.endTime}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tarih
              </label>
              <input
                type="date"
                required
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              {date && daySlot && (
                <p className="mt-1 text-[11px] text-green-600 font-bold">
                  ✓ Koç bu gün {daySlot.startTime}–{daySlot.endTime} saatleri arası müsait
                </p>
              )}
              {date && selectedDayOfWeek !== null && !daySlot && availability.length > 0 && (
                <p className="mt-1 text-[11px] text-amber-600 font-bold">
                  ⚠ Koç bu gün için müsaitlik belirtmemiş
                </p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Clock className="mr-1 inline h-3 w-3" />Saat
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Type */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Seans Türü
              </label>
              <div className="flex flex-wrap gap-2">
                {SESSION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                    style={{
                      background: type === t.value ? "rgba(249,115,22,0.12)" : "#F8FAFC",
                      color: type === t.value ? "#EA580C" : "#64748B",
                      border: type === t.value ? "1px solid rgba(249,115,22,0.3)" : "1px solid #E2E8F0",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Süre (dakika)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400"
              >
                {[30, 45, 60, 90].map((d) => (
                  <option key={d} value={d}>{d} dakika</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Not (İsteğe bağlı)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Seans hakkında not ekleyin..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                Planla
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
