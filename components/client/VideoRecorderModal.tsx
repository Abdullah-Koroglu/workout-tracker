"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, AlertCircle, X, Play } from "lucide-react";

interface VideoRecorderModalProps {
  workoutId: string;
  movementId: string;
  movementName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function VideoRecorderModal({
  workoutId,
  movementId,
  movementName,
  isOpen,
  onClose,
  onSuccess,
}: VideoRecorderModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [state, setState] = useState<"initial" | "recording" | "preview" | "uploading">("initial");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const MAX_DURATION = 30;

  // Start camera on mount
  useEffect(() => {
    if (!isOpen) return;

    const startCamera = async () => {
      try {
        setError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Kamera erişimi reddedildi.";
        setError(`Kamera hatası: ${message}`);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const startRecording = () => {
    if (!stream) {
      setError("Kamera henüz başlatılmadı.");
      return;
    }

    try {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        setState("preview");
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setState("recording");
      setDuration(0);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kayıt başlatılamadı."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleUpload = async () => {
    if (!recordedBlob) return;

    setState("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("video", recordedBlob, `${movementId}.webm`);
      formData.append("durationSeconds", String(duration));
      formData.append("movementName", movementName);

      const res = await fetch(
        `/api/workouts/${workoutId}/movements/${movementId}/video`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Yükleme başarısız.");
      }

      // Success
      setState("initial");
      setRecordedBlob(null);
      setDuration(0);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme hatası.");
      setState("preview");
    }
  };

  const handleCancel = () => {
    if (state === "recording") {
      stopRecording();
    }
    setState("initial");
    setRecordedBlob(null);
    setDuration(0);
    setError(null);
    onClose();
  };

  // Timer for recording duration
  useEffect(() => {
    if (state !== "recording") return;

    const interval = setInterval(() => {
      setDuration((d) => {
        if (d >= MAX_DURATION) {
          stopRecording();
          return d;
        }
        return d + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800">Video Çek</h2>
            <p className="mt-1 text-xs text-slate-500">{movementName}</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 transition hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex gap-2 rounded-lg bg-red-50 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Video Preview / Recording */}
        <div className="mb-4 overflow-hidden rounded-xl bg-black">
          {state === "preview" && recordedBlob ? (
            <video
              src={URL.createObjectURL(recordedBlob)}
              controls
              className="aspect-video w-full"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="aspect-video w-full"
            />
          )}
        </div>

        {/* Duration / Timer */}
        {state === "recording" && (
          <div className="mb-4 text-center">
            <p className="text-2xl font-black text-slate-800">
              {String(Math.floor(duration / 60)).padStart(2, "0")}:
              {String(duration % 60).padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Maksimum {MAX_DURATION} saniye
            </p>
          </div>
        )}

        {state === "preview" && (
          <div className="mb-4 text-center">
            <p className="text-sm font-bold text-slate-700">
              {String(Math.floor(duration / 60)).padStart(2, "0")}:
              {String(duration % 60).padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {(recordedBlob?.size || 0) / 1024 / 1024 < 1
                ? `${((recordedBlob?.size || 0) / 1024).toFixed(0)} KB`
                : `${((recordedBlob?.size || 0) / 1024 / 1024).toFixed(1)} MB`}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {state === "initial" && (
            <>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
              >
                Kapat
              </button>
              <button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-black text-white transition hover:bg-red-700"
              >
                <Camera className="h-4 w-4" />
                Kayıt Başlat
              </button>
            </>
          )}

          {state === "recording" && (
            <>
              <button
                onClick={stopRecording}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-black text-white transition hover:bg-black"
              >
                Durdur
              </button>
            </>
          )}

          {(state === "preview" || state === "uploading") && (
            <>
              <button
                onClick={() => {
                  setState("initial");
                  setRecordedBlob(null);
                  setDuration(0);
                }}
                disabled={state === "uploading"}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Yeniden Çek
              </button>
              <button
                onClick={handleUpload}
                disabled={state === "uploading"}
                className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-2.5 text-xs font-black text-white transition hover:shadow-lg disabled:opacity-50"
              >
                {state === "uploading" ? "Yükleniyor..." : "Yükle"}
              </button>
            </>
          )}
        </div>

        {/* Validation message */}
        {state === "preview" && duration < 2 && (
          <p className="mt-3 text-xs text-amber-600">
            ⚠️ Video en az 2 saniye olmalıdır.
          </p>
        )}
      </div>
    </div>
  );
}
