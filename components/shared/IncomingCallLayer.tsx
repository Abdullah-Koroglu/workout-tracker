"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, PhoneOff, Video } from "lucide-react";

type IncomingCall = {
  id: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  mode: "AUDIO" | "VIDEO";
  status: "RINGING" | "ACCEPTED" | "REJECTED" | "MISSED" | "CANCELLED" | "ENDED" | "FAILED";
  expiresAt: string;
  sessionId?: string | null;
};

function buildWsUrl(token: string) {
  const explicitBase = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (explicitBase) {
    const normalized = explicitBase.startsWith("http://")
      ? explicitBase.replace("http://", "ws://")
      : explicitBase.startsWith("https://")
        ? explicitBase.replace("https://", "wss://")
        : explicitBase;

    const delimiter = normalized.includes("?") ? "&" : "?";
    return `${normalized}${delimiter}token=${encodeURIComponent(token)}`;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws?token=${encodeURIComponent(token)}`;
}

export function IncomingCallLayer() {
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [submitting, setSubmitting] = useState<"accept" | "reject" | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const refreshIncoming = useCallback(async () => {
    const response = await fetch("/api/calls/incoming", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) {
      return;
    }

    const data = await response.json().catch(() => ({}));
    const nextCall = (data.calls?.[0] ?? null) as IncomingCall | null;
    setIncomingCall(nextCall);
  }, []);

  useEffect(() => {
    void refreshIncoming();
    const pollId = window.setInterval(() => void refreshIncoming(), 5000);
    return () => window.clearInterval(pollId);
  }, [refreshIncoming]);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      const tokenRes = await fetch("/api/messages/ws-token", { cache: "no-store" }).catch(() => null);
      if (!tokenRes?.ok) {
        return;
      }

      const data = await tokenRes.json().catch(() => ({}));
      if (!data.token || cancelled) {
        return;
      }

      const ws = new WebSocket(buildWsUrl(data.token));
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type: string; call?: IncomingCall };
          if (payload.type === "call_incoming" && payload.call) {
            setIncomingCall(payload.call);
          }
          if (["call_cancelled", "call_ended", "call_rejected"].includes(payload.type) && payload.call?.id === incomingCall?.id) {
            setIncomingCall(null);
          }
        } catch {
          return;
        }
      };
    };

    void connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [incomingCall?.id]);

  const respondToCall = useCallback(async (action: "accept" | "reject") => {
    if (!incomingCall) return;

    setSubmitting(action);
    try {
      const response = await fetch(`/api/calls/${incomingCall.id}/${action}`, { method: "POST" });
      if (!response.ok) {
        throw new Error(action === "accept" ? "Cagri kabul edilemedi" : "Cagri reddedilemedi");
      }

      if (action === "accept") {
        router.push(`/calls/${incomingCall.id}`);
      } else {
        setIncomingCall(null);
      }
    } catch {
      setSubmitting(null);
    }
  }, [incomingCall, router]);

  if (!incomingCall) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          {incomingCall.mode === "AUDIO" ? <Phone className="h-7 w-7" /> : <Video className="h-7 w-7" />}
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-orange-500">Incoming Call</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">{incomingCall.callerName}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {incomingCall.mode === "AUDIO" ? "Sesli gorusme" : "Goruntulu gorusme"} daveti
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void respondToCall("reject")}
            disabled={submitting !== null}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white disabled:opacity-50"
          >
            {submitting === "reject" ? <Loader2 className="h-5 w-5 animate-spin" /> : <PhoneOff className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => void respondToCall("accept")}
            disabled={submitting !== null}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white disabled:opacity-50"
          >
            {submitting === "accept" ? <Loader2 className="h-5 w-5 animate-spin" /> : incomingCall.mode === "AUDIO" ? <Phone className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
