"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Mic, PhoneOff, Radio, Video } from "lucide-react";

type CallStatus = "RINGING" | "ACCEPTED" | "REJECTED" | "MISSED" | "CANCELLED" | "ENDED" | "FAILED";

type CallInviteScreenProps = {
  callId: string;
  currentUserId: string;
  fallbackPath: string;
};

type CallStatusResponse = {
  actorRole: "CALLER" | "CALLEE";
  call: {
    id: string;
    callerId: string;
    calleeId: string;
    type: "AUDIO" | "VIDEO";
    status: CallStatus;
    expiresAt: string;
    caller: { id: string; name: string; role: "COACH" | "CLIENT" };
    callee: { id: string; name: string; role: "COACH" | "CLIENT" };
  };
};

export function CallInviteScreen({ callId, currentUserId, fallbackPath }: CallInviteScreenProps) {
  const [statusPayload, setStatusPayload] = useState<CallStatusResponse | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [responding, setResponding] = useState<"accept" | "reject" | null>(null);

  const peerName = useMemo(() => {
    if (!statusPayload) return "";
    return statusPayload.call.callerId === currentUserId
      ? statusPayload.call.callee.name
      : statusPayload.call.caller.name;
  }, [currentUserId, statusPayload]);

  useEffect(() => {
    let active = true;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const loadStatus = async () => {
      const response = await fetch(`/api/calls/${callId}/status`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Cagri durumu alinamadi");
      }

      if (!active) return;
      setStatusPayload(data);

      if (data.call.status === "ACCEPTED" && !joinUrl) {
        const joinResponse = await fetch(`/api/calls/${callId}/join`, { method: "POST" });
        const joinData = await joinResponse.json().catch(() => ({}));
        if (!joinResponse.ok) {
          throw new Error(joinData.error ?? "Cagriya katilim saglanamadi");
        }
        if (active) {
          setJoinUrl(joinData.joinUrl ?? null);
        }
      }

      if (!["RINGING", "ACCEPTED"].includes(data.call.status) && pollId) {
        clearInterval(pollId);
      }
    };

    setLoading(true);
    void loadStatus()
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Cagri yuklenemedi");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    pollId = setInterval(() => {
      void loadStatus().catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Cagri guncellenemedi");
      });
    }, 2000);

    return () => {
      active = false;
      if (pollId) clearInterval(pollId);
    };
  }, [callId, joinUrl]);

  async function closeCall() {
    setClosing(true);

    const action =
      statusPayload?.actorRole === "CALLER" && statusPayload.call.status === "RINGING"
        ? "cancel"
        : "end";

    await fetch(`/api/calls/${callId}/${action}`, { method: "POST" }).catch(() => null);
    window.location.href = fallbackPath;
  }

  async function respondToCall(action: "accept" | "reject") {
    setResponding(action);
    try {
      const response = await fetch(`/api/calls/${callId}/${action}`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Cagri durumu guncellenemedi");
      }

      if (action === "reject") {
        window.location.href = fallbackPath;
        return;
      }

      const joinResponse = await fetch(`/api/calls/${callId}/join`, { method: "POST" });
      const joinData = await joinResponse.json().catch(() => ({}));
      if (!joinResponse.ok) {
        throw new Error(joinData.error ?? "Cagriya katilim saglanamadi");
      }

      setStatusPayload((prev) =>
        prev
          ? {
              ...prev,
              call: {
                ...prev.call,
                status: "ACCEPTED",
              },
            }
          : prev,
      );
      setJoinUrl(joinData.joinUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cagri guncellenemedi");
    } finally {
      setResponding(null);
    }
  }

  const callMode = statusPayload?.call.type ?? "VIDEO";
  const statusMessage =
    statusPayload?.call.status === "RINGING"
      ? {
          title: "Karsi taraf cevap bekleniyor",
          body: "Kabul geldigi anda oturum burada acilacak.",
        }
      : statusPayload?.call.status === "REJECTED"
        ? {
            title: "Cagri reddedildi",
            body: "Karsi taraf bu aramayi kabul etmedi.",
          }
        : statusPayload?.call.status === "MISSED"
          ? {
              title: "Cagri kacti",
              body: "Arama cevap gelmeden zaman asimina ugradi.",
            }
          : statusPayload?.call.status === "CANCELLED"
            ? {
                title: "Arama iptal edildi",
                body: "Bu cagri artik aktif degil.",
              }
            : statusPayload?.call.status === "ENDED"
              ? {
                  title: "Cagri tamamlandi",
                  body: "Gorusme sonlandirildi.",
                }
              : {
                  title: "Cagri kapandi",
                  body: "Bu cagri artik aktif degil.",
                };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/45">FitCoach Call</p>
            <h1 className="mt-1 text-xl font-black">{peerName || "Gorusme"}</h1>
            <p className="mt-1 text-sm text-white/60">
              {callMode === "AUDIO" ? "Sesli" : "Goruntulu"} arama
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/80">
              {callMode === "AUDIO" ? <Mic className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
              {callMode === "AUDIO" ? "Audio" : "Video"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-200">
              <Radio className="h-3.5 w-3.5" />
              Roster locked
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 text-sm font-bold text-white/70">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cagri hazirlaniyor
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4">
            <p className="text-sm font-bold text-rose-100">{error}</p>
            <Link href={fallbackPath} className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-900">
              Geri don
            </Link>
          </div>
        ) : joinUrl ? (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            <iframe
              src={joinUrl}
              allow="camera; microphone; display-capture; autoplay; clipboard-read; clipboard-write"
              className={`w-full border-0 ${callMode === "AUDIO" ? "h-[70vh]" : "h-[78vh]"}`}
            />
          </div>
        ) : (
          <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 text-center">
            <div className="text-lg font-black">{statusMessage.title}</div>
            <p className="mt-2 text-sm text-white/60">{statusMessage.body}</p>
            {statusPayload?.actorRole === "CALLEE" && statusPayload.call.status === "RINGING" ? (
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void respondToCall("reject")}
                  disabled={responding !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                >
                  {responding === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}
                  Reddet
                </button>
                <button
                  type="button"
                  onClick={() => void respondToCall("accept")}
                  disabled={responding !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                >
                  {responding === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : callMode === "AUDIO" ? <Mic className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  Katil
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-sm text-white/55">
            Sadece aktif iliski icindeki coach ve client bu gorusmeye katilabilir.
          </p>
          <button
            onClick={closeCall}
            disabled={closing}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
          >
            {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}
            {statusPayload?.actorRole === "CALLER" && statusPayload.call.status === "RINGING" ? "Aramayi iptal et" : "Cagiriyi bitir"}
          </button>
        </div>
      </div>
    </div>
  );
}
