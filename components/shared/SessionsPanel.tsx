"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, ExternalLink, Loader2, Radio, Save, Star } from "lucide-react";

import { getRtcCallStatusMeta, getRtcProviderLabel, RTC_CALL_STATUS_OPTIONS, RTC_PROVIDER_OPTIONS } from "@/lib/rtc-session";

interface Session {
  id: string;
  scheduledFor: string;
  duration: number;
  type: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  meetingUrl: string | null;
  rtcProvider?: string | null;
  rtcRoomId?: string | null;
  rtcCallStatus?: "NOT_CONFIGURED" | "READY" | "LIVE" | "ENDED";
  agenda: string | null;
  summary: string | null;
  clientFeedback: string | null;
  rating: number | null;
  recordingUrl?: string | null;
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
    const response = await fetch("/api/sessions");
    const data = await response.json();
    setSessions(data.sessions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(id: string) {
    setSaving(id);
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edits[id] ?? {}),
    });
    setSaving(null);
    setEdits((current) => ({ ...current, [id]: {} }));
    await load();
  }

  function setField(id: string, key: keyof Session, value: unknown) {
    setEdits((current) => ({ ...current, [id]: { ...(current[id] ?? {}), [key]: value } }));
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

      {sessions.map((session) => {
        const isExpanded = expanded === session.id;
        const localEdits = edits[session.id] ?? {};
        const merged = { ...session, ...localEdits };
        const otherPartyName = role === "COACH" ? session.client.name : session.coach.name;
        const sessionDate = new Date(session.scheduledFor);
        const rtcStatus = getRtcCallStatusMeta(merged.rtcCallStatus);

        return (
          <div key={session.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <button
              onClick={() => setExpanded(isExpanded ? null : session.id)}
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50"
            >
              <div className="flex h-10 w-12 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <span className="text-[9px] font-black uppercase">
                  {sessionDate.toLocaleDateString("tr-TR", { month: "short" })}
                </span>
                <span className="text-sm font-black leading-none">{sessionDate.getDate()}</span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-800">{otherPartyName}</p>
                <p className="text-xs text-slate-400">
                  {sessionDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} · {session.duration} dk · {session.type}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${rtcStatus.className}`}>
                    RTC {rtcStatus.label}
                  </span>
                  {merged.rtcProvider ? (
                    <span className="text-[10px] font-bold text-slate-400">{getRtcProviderLabel(merged.rtcProvider)}</span>
                  ) : null}
                </div>
              </div>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                  session.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-600"
                    : session.status === "CANCELLED"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-indigo-100 text-indigo-600"
                }`}
              >
                {session.status === "COMPLETED" ? "Tamam" : session.status === "CANCELLED" ? "Iptal" : "Planli"}
              </span>

              {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>

            {isExpanded ? (
              <div className="space-y-3 border-t border-slate-100 p-4">
                {role === "COACH" ? (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Toplanti Linki</label>
                    <input
                      type="url"
                      placeholder="https://zoom.us/..."
                      value={merged.meetingUrl ?? ""}
                      onChange={(event) => setField(session.id, "meetingUrl", event.target.value)}
                      className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ) : merged.meetingUrl ? (
                  <a
                    href={merged.meetingUrl}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-black text-white hover:bg-indigo-600"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Toplantiya Katil
                  </a>
                ) : null}

                {role === "COACH" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">RTC Provider</label>
                      <select
                        value={merged.rtcProvider ?? ""}
                        onChange={(event) => setField(session.id, "rtcProvider", event.target.value || null)}
                        className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="">Secilmedi</option>
                        {RTC_PROVIDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">RTC Durumu</label>
                      <select
                        value={merged.rtcCallStatus ?? "NOT_CONFIGURED"}
                        onChange={(event) => setField(session.id, "rtcCallStatus", event.target.value)}
                        className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {RTC_CALL_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">RTC Room ID</label>
                      <input
                        type="text"
                        placeholder="rtc-room-123"
                        value={merged.rtcRoomId ?? ""}
                        onChange={(event) => setField(session.id, "rtcRoomId", event.target.value)}
                        className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recording URL</label>
                      <input
                        type="url"
                        placeholder="https://storage.example.com/recording.mp4"
                        value={merged.recordingUrl ?? ""}
                        onChange={(event) => setField(session.id, "recordingUrl", event.target.value)}
                        className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                ) : merged.rtcProvider || merged.rtcRoomId ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <Radio className="h-3 w-3" />
                      RTC Hazirligi
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      <div>Provider: {getRtcProviderLabel(merged.rtcProvider)}</div>
                      {merged.rtcRoomId ? <div>Room ID: {merged.rtcRoomId}</div> : null}
                      {merged.recordingUrl ? (
                        <a href={merged.recordingUrl} target="_blank" className="mt-1 inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700">
                          <ExternalLink className="h-3 w-3" />
                          Kayit
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {role === "COACH" ? (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gundem</label>
                    <textarea
                      rows={2}
                      placeholder="Bu oturumda neleri konusacaksiniz?"
                      value={merged.agenda ?? ""}
                      onChange={(event) => setField(session.id, "agenda", event.target.value)}
                      className="mt-1 w-full resize-none rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ) : merged.agenda ? (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gundem</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{merged.agenda}</p>
                  </div>
                ) : null}

                {role === "COACH" && session.status === "COMPLETED" ? (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Oturum Ozeti</label>
                    <textarea
                      rows={3}
                      value={merged.summary ?? ""}
                      onChange={(event) => setField(session.id, "summary", event.target.value)}
                      className="mt-1 w-full resize-none rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ) : null}

                {role === "CLIENT" && session.status === "COMPLETED" ? (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Oturum Puani</label>
                      <div className="mt-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button key={value} onClick={() => setField(session.id, "rating", value)} className="h-8 w-8">
                            <Star
                              className="h-6 w-6"
                              fill={value <= (merged.rating ?? 0) ? "#F59E0B" : "none"}
                              stroke={value <= (merged.rating ?? 0) ? "#F59E0B" : "#CBD5E1"}
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
                        onChange={(event) => setField(session.id, "clientFeedback", event.target.value)}
                        className="mt-1 w-full resize-none rounded-xl bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </>
                ) : null}

                {role === "COACH" ? (
                  <label className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="text-sm font-bold text-slate-700">Odendi olarak isaretle</span>
                    <input
                      type="checkbox"
                      checked={!!merged.isPaid}
                      onChange={(event) => setField(session.id, "isPaid", event.target.checked)}
                      className="h-4 w-4 accent-emerald-500"
                    />
                  </label>
                ) : null}

                <button
                  onClick={() => save(session.id)}
                  disabled={saving === session.id || Object.keys(localEdits).length === 0}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-500 py-2.5 text-xs font-black text-white hover:bg-indigo-600 disabled:opacity-40"
                >
                  {saving === session.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Kaydet
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
