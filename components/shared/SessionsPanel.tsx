"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Loader2, Mic, Radio, Save, Star, Video } from "lucide-react";

import {
  getRecordingStatusLabel,
  getRtcProviderLabel,
  getSessionCallModeLabel,
  getSessionCallStatusMeta,
  isJoinWindowOpen,
} from "@/lib/rtc-session";

interface Session {
  id: string;
  scheduledFor: string;
  duration: number;
  type: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  rtcProvider?: string | null;
  providerRoomCode?: string | null;
  providerHostUserId?: string | null;
  callMode: "AUDIO" | "VIDEO";
  callStatus: "SCHEDULED" | "PROVISIONING" | "READY" | "LIVE" | "ENDED" | "FAILED";
  syncState?: "PENDING" | "SYNCED" | "ERROR";
  recordingStatus?: "NOT_REQUESTED" | "PENDING" | "READY" | "FAILED";
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
  const [provisioningId, setProvisioningId] = useState<string | null>(null);

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

  async function provision(id: string) {
    setProvisioningId(id);
    await fetch(`/api/sessions/${id}/rtc/provision`, { method: "POST" });
    setProvisioningId(null);
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
        const callStatus = getSessionCallStatusMeta(merged.callStatus);
        const joinOpen = isJoinWindowOpen(session.scheduledFor);

        return (
          <div key={session.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : session.id)}
              className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50 sm:items-center"
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
                  {sessionDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} - {session.duration} dk - {session.type}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${callStatus.className}`}>
                    {callStatus.label}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{getSessionCallModeLabel(merged.callMode)}</span>
                  {merged.rtcProvider ? (
                    <span className="text-[10px] font-bold text-slate-400">{getRtcProviderLabel(merged.rtcProvider)}</span>
                  ) : null}
                </div>
              </div>

              <span
                className={`mt-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase sm:mt-0 ${
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
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {role === "COACH" && !merged.providerRoomCode ? (
                    <button
                      type="button"
                      onClick={() => provision(session.id)}
                      disabled={provisioningId === session.id}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white disabled:opacity-50 sm:w-auto"
                    >
                      {provisioningId === session.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
                      Odayi hazirla
                    </button>
                  ) : null}

                  {joinOpen && merged.callStatus !== "ENDED" && merged.callStatus !== "FAILED" ? (
                    <Link
                      href={`/sessions/${session.id}/call`}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-black text-white hover:bg-indigo-600 sm:w-auto"
                    >
                      {merged.callMode === "AUDIO" ? <Mic className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                      {merged.callMode === "AUDIO" ? "Sesli gorusmeye katil" : "Goruntulu gorusmeye katil"}
                    </Link>
                  ) : (
                    <span className="w-full rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-500 sm:w-auto">
                      {merged.callStatus === "FAILED"
                        ? "RTC baglantisi tekrar hazirlanmali"
                        : merged.callStatus === "ENDED"
                          ? "Oturum kapandi"
                          : "Henuz join penceresi acilmadi"}
                    </span>
                  )}
                </div>

                {merged.rtcProvider || merged.providerRoomCode ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <Radio className="h-3 w-3" />
                      RTC Oturumu
                    </div>
                    <div className="mt-2 space-y-1">
                      <div>Provider: {getRtcProviderLabel(merged.rtcProvider)}</div>
                      {merged.providerRoomCode ? <div>Room: {merged.providerRoomCode}</div> : null}
                      <div>Mod: {getSessionCallModeLabel(merged.callMode)}</div>
                      <div>Kayit: {merged.rtcProvider === "link" && !merged.recordingUrl ? "Provider desteklemiyor" : getRecordingStatusLabel(merged.recordingStatus)}</div>
                      {merged.recordingUrl ? (
                        <a href={merged.recordingUrl} target="_blank" className="inline-flex font-bold text-indigo-600 hover:text-indigo-700">
                          Kayit baglantisi
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
                          <button key={value} type="button" onClick={() => setField(session.id, "rating", value)} className="h-8 w-8">
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
