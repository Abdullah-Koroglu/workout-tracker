"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";

type CheckIn = {
  id: string;
  message: string | null;
  createdAt: string;
  coach: { id: string; name: string };
};

const SCORES = [1, 2, 3, 4, 5] as const;
const LABELS = { 1: "Çok Kötü", 2: "Kötü", 3: "Orta", 4: "İyi", 5: "Çok İyi" };
const COLORS = { 1: "#EF4444", 2: "#F97316", 3: "#F59E0B", 4: "#84CC16", 5: "#22C55E" };

function ScoreSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
      <div className="flex gap-1.5">
        {SCORES.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white transition hover:opacity-90"
            style={{
              background: value === s ? COLORS[s] : "#F1F5F9",
              color: value === s ? "#fff" : "#94A3B8",
            }}
          >
            {s}
          </button>
        ))}
      </div>
      {value && (
        <p className="mt-1 text-[11px] font-bold" style={{ color: COLORS[value as keyof typeof COLORS] }}>
          {LABELS[value as keyof typeof LABELS]}
        </p>
      )}
    </div>
  );
}

export function CheckInWidget() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/client/checkins")
      .then((r) => r.json())
      .then((d) => setCheckIns(d.checkIns ?? []))
      .finally(() => setLoading(false));
  }, []);

  const pending = checkIns.filter((c) => !done.has(c.id));

  if (loading || pending.length === 0) return null;

  const current = activeId ? checkIns.find((c) => c.id === activeId) : pending[0];

  const submit = async () => {
    if (!sleep || !stress || !motivation || !current) return;
    setSubmitting(true);
    const res = await fetch(`/api/client/checkins/${current.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sleepScore: sleep, stressScore: stress, motivationScore: motivation, notes: notes || undefined }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone((prev) => new Set([...prev, current.id]));
      setSleep(null); setStress(null); setMotivation(null); setNotes("");
      setActiveId(null);
    }
  };

  if (!current) return null;

  return (
    <div
      className="rounded-[18px] bg-white shadow-sm"
      style={{ border: "1px solid rgba(0,0,0,0.06)", borderLeft: "4px solid #3B82F6" }}
    >
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-blue-500" />
          <p className="text-[14px] font-black text-slate-800">Check-in Formu</p>
          <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-black text-blue-700">
            {pending.length} bekliyor
          </span>
        </div>

        <p className="mb-1 text-sm font-bold text-slate-600">
          {current.coach.name} koçundan
        </p>
        {current.message && (
          <p className="mb-3 text-xs italic text-slate-400">"{current.message}"</p>
        )}

        <div className="space-y-4">
          <ScoreSelector label="Uyku Kalitesi" value={sleep} onChange={setSleep} />
          <ScoreSelector label="Stres Seviyesi" value={stress} onChange={setStress} />
          <ScoreSelector label="Motivasyon" value={motivation} onChange={setMotivation} />

          <div>
            <p className="mb-1.5 text-xs font-black uppercase tracking-wider text-slate-500">Not (opsiyonel)</p>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bu hafta nasıl geçti?"
              className="w-full resize-none rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 ring-1 ring-black/8 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!sleep || !stress || !motivation || submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black text-white transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yanıtla →"}
        </button>
      </div>
    </div>
  );
}
