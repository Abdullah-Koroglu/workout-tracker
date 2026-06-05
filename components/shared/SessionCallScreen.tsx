"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Mic, PhoneOff, Radio, Video } from "lucide-react";

type SessionCallScreenProps = {
  sessionId: string;
  title: string;
  peerName: string;
  callMode: "AUDIO" | "VIDEO";
  canEnd: boolean;
  fallbackPath?: string;
};

export function SessionCallScreen({ sessionId, title, peerName, callMode, canEnd, fallbackPath = "/client/dashboard" }: SessionCallScreenProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    let active = true;

    const loadJoinData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/sessions/${sessionId}/rtc/join`, { method: "POST" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error ?? "RTC oturumu hazirlanamadi");
        }

        if (active) {
          setEmbedUrl(data.joinUrl ?? null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "RTC oturumu hazirlanamadi");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadJoinData();

    return () => {
      active = false;
      void fetch(`/api/sessions/${sessionId}/rtc/leave`, { method: "POST" });
    };
  }, [sessionId]);

  async function handleEnd() {
    setEnding(true);
    try {
      await fetch(`/api/sessions/${sessionId}/rtc/end`, { method: "POST" });
      window.location.href = "/coach/dashboard";
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-950 px-4 pb-[calc(var(--app-mobile-nav-height)+1.5rem)] pt-4 text-white md:px-6 md:pb-8 md:pt-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/45">FitCoach RTC</p>
            <h1 className="mt-1 text-xl font-black">{title}</h1>
            <p className="mt-1 text-sm text-white/60">{peerName} ile {callMode === "AUDIO" ? "sesli" : "goruntulu"} oturum</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-white/10 bg-white/5 md:min-h-[60vh]">
            <div className="flex items-center gap-3 text-sm font-bold text-white/70">
              <Loader2 className="h-5 w-5 animate-spin" />
              RTC oturumu hazirlaniyor
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4">
            <p className="text-sm font-bold text-rose-100">{error}</p>
            <Link href={fallbackPath} className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-900">
              Geri don
            </Link>
          </div>
        ) : embedUrl ? (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            <iframe
              src={embedUrl}
              allow="camera; microphone; display-capture; autoplay; clipboard-read; clipboard-write"
              className={`w-full border-0 ${callMode === "AUDIO" ? "h-[52dvh] md:h-[70vh]" : "h-[60dvh] md:h-[78vh]"}`}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
          <p className="max-w-3xl text-sm leading-6 text-white/55">
            Session roster disindaki kullanicilar token alamaz. Oturum FitCoach backend uzerinden kilitli.
          </p>
          {canEnd ? (
            <button
              onClick={handleEnd}
              disabled={ending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50 md:w-auto md:py-2"
            >
              {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}
              Oturumu bitir
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
