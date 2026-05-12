"use client";

import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Star, Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";

interface Session {
  id: string;
  scheduledFor: string;
  duration: number;
  type: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  meetingUrl: string | null;
  agenda: string | null;
  summary: string | null;
  clientFeedback: string | null;
  rating: number | null;
  isPaid: boolean;
  coach: { id: string; name: string };
  client: { id: string; name: string };
}

export function SessionsPanel({ role }: { role: "COACH" | "CLIENT" }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<Session>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/sessions");
    const d = await res.json();
    setSessions(d.sessions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(id: string) {
    setSaving(id);
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edits[id] ?? {}),
    });
    setSaving(null);
    setEdits((p) => ({ ...p, [id]: {} }));
    await load();
  }

  function setField(id: string, key: keyof Session, value: unknown) {
    setEdits((p) => ({ ...p, [id]: { ...(p[id] ?? {}), [key]: value } }));
  }

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />;
  if (sessions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
          <Calendar className="h-4 w-4 text-indigo-600" />
        </div>
        <h2 className="text-base font-black text-slate-800">Oturumlar</h2>
      </div>

      {sessions.map((s) => {
        const isExpanded = expanded === s.id;
        const e = edits[s.id] ?? {};
        const merged = { ...s, ...e };
        const other = role === "COACH" ? s.client.name : s.coach.name;
        const date = new Date(s.scheduledFor);
        return (
          <div key={s.id} className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : s.id)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50"
            >
              <div className="flex h-10 w-12 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <span className="text-[9px] font-black uppercase">
                  {date.toLocaleDateString("tr-TR", { month: "short" })}
                </span>
                <span className="text-sm font-black leading-none">{date.getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{other}</p>
                <p className="text-xs text-slate-400">
                  {date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} · {s.duration} dk · {s.type}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                s.status === "COMPLETED" ? "bg-emerald-100 text-emerald-600" :
                s.status === "CANCELLED" ? "bg-rose-100 text-rose-600" :
                "bg-indigo-100 text-indigo-600"
              }`}>
                {s.status === "COMPLETED" ? "Tamam" : s.status === "CANCELLED" ? "İptal" : "Planlı"}
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 p-4 space-y-3">
                {/* Meeting URL */}
                {role === "COACH" ? (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Toplantı Linki</label>
                    <input
                      type="url"
                      placeholder="https://zoom.us/..."
                      value={merged.meetingUrl ?? ""}
                      onChange={(ev) => setField(s.id, "meetingUrl", ev.target.value)}
                      className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ) : (
                  merged.meetingUrl && (
                    <a
                      href={merged.meetingUrl}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-black text-white hover:bg-indigo-600"
                    >
                      <ExternalLink className="h-3 w-3" /> Toplantıya Katıl
                    </a>
                  )
                )}

                {/* Agenda (coach editable) */}
                {role === "COACH" && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gündem</label>
                    <textarea
                      rows={2}
                      placeholder="Bu oturumda neleri konuşacaksınız?"
                      value={merged.agenda ?? ""}
                      onChange={(ev) => setField(s.id, "agenda", ev.target.value)}
                      className="mt-1 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                  </div>
                )}
                {role === "CLIENT" && merged.agenda && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gündem</p>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">{merged.agenda}</p>
                  </div>
                )}

                {/* Summary - coach side */}
                {role === "COACH" && s.status === "COMPLETED" && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Oturum Özeti</label>
                    <textarea
                      rows={3}
                      value={merged.summary ?? ""}
                      onChange={(ev) => setField(s.id, "summary", ev.target.value)}
                      className="mt-1 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                  </div>
                )}

                {/* Client feedback + rating */}
                {role === "CLIENT" && s.status === "COMPLETED" && (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Oturum Puanı</label>
                      <div className="mt-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setField(s.id, "rating", n)}
                            className="h-8 w-8"
                          >
                            <Star
                              className="h-6 w-6"
                              fill={n <= (merged.rating ?? 0) ? "#F59E0B" : "none"}
                              stroke={n <= (merged.rating ?? 0) ? "#F59E0B" : "#CBD5E1"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Geri Bildirim</label>
                      <textarea
                        rows={2}
                        value={merged.clientFeedback ?? ""}
                        onChange={(ev) => setField(s.id, "clientFeedback", ev.target.value)}
                        className="mt-1 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                      />
                    </div>
                  </>
                )}

                {role === "COACH" && (
                  <label className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="text-sm font-bold text-slate-700">Ödendi olarak işaretle</span>
                    <input
                      type="checkbox"
                      checked={!!merged.isPaid}
                      onChange={(ev) => setField(s.id, "isPaid", ev.target.checked)}
                      className="h-4 w-4 accent-emerald-500"
                    />
                  </label>
                )}

                <button
                  onClick={() => save(s.id)}
                  disabled={saving === s.id || Object.keys(e).length === 0}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500 py-2.5 text-xs font-black text-white hover:bg-indigo-600 disabled:opacity-40"
                >
                  {saving === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Kaydet
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
