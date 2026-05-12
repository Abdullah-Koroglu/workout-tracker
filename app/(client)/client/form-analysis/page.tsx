"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronLeft, Upload, Video } from "lucide-react";

export default function FormAnalysisPage() {
  const [movementName, setMovementName] = useState("");
  const [question, setQuestion] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const canSubmit = useMemo(() => {
    return movementName.trim().length >= 2 && question.trim().length >= 5 && !!videoFile && durationSeconds >= 2;
  }, [durationSeconds, movementName, question, videoFile]);

  const onVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    setSuccess(null);
    setVideoFile(file);
    setDurationSeconds(0);
  };

  const onLoadedMetadata = () => {
    if (!videoPreviewRef.current) return;
    const raw = Math.round(videoPreviewRef.current.duration || 0);
    setDurationSeconds(Number.isFinite(raw) ? raw : 0);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!videoFile) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const form = new FormData();
      form.append("video", videoFile);
      form.append("durationSeconds", String(durationSeconds));
      form.append("movementName", movementName.trim());
      form.append("question", question.trim());

      const res = await fetch("/api/client/form-analysis", {
        method: "POST",
        body: form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Gönderim başarısız.");
      }

      setSuccess("Form analizi isteğin koçuna gönderildi.");
      setMovementName("");
      setQuestion("");
      setVideoFile(null);
      setDurationSeconds(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-10">
      <Link href="/client/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700">
        <ChevronLeft className="h-4 w-4" />
        Dashboard'a dön
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-black text-slate-800">Serbest Form Analizi</h1>
        <p className="mt-1 text-sm text-slate-500">Antrenman ekranına girmeden videonu yükle, açıklama/sorunu yaz ve koçuna gönder.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Hareket</label>
            <input
              value={movementName}
              onChange={(e) => setMovementName(e.target.value)}
              maxLength={80}
              placeholder="Örn: Squat"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Açıklama / Soru</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={800}
              rows={4}
              placeholder="Örn: İnişte dizlerim içe kaçıyor mu? Bel açım doğru mu?"
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Video</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              <Upload className="h-4 w-4" />
              Video seç veya kamera ile çek
              <input type="file" accept="video/*" capture="environment" onChange={onVideoChange} className="hidden" required />
            </label>
          </div>

          {videoFile ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
              <video
                ref={videoPreviewRef}
                src={URL.createObjectURL(videoFile)}
                controls
                onLoadedMetadata={onLoadedMetadata}
                className="aspect-video w-full"
              />
              <div className="flex items-center justify-between bg-white px-3 py-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700"><Video className="h-3.5 w-3.5" />{videoFile.name}</span>
                <span>{durationSeconds > 0 ? `${durationSeconds} sn` : "Süre okunuyor..."}</span>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{success}</div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-sm font-black text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Gönderiliyor..." : "Koça Form Analizi Gönder"}
          </button>
        </form>
      </div>
    </div>
  );
}
