"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Camera, Loader2, RefreshCw } from "lucide-react";
import { useNotificationContext } from "@/contexts/NotificationContext";

type AdherenceTag = "GREEN" | "YELLOW" | "RED";

const TAGS: Array<{
  tag: AdherenceTag;
  emoji: string;
  title: string;
  subtitle: string;
  bg: string;
  ring: string;
}> = [
  { tag: "GREEN", emoji: "🟢", title: "Plana Tam Uydum", subtitle: "Hedef makrolar tutturuldu", bg: "linear-gradient(135deg, #22C55E, #15803D)", ring: "#22C55E" },
  { tag: "YELLOW", emoji: "🟡", title: "Hafif Sapma", subtitle: "Küçük bir kayma oldu", bg: "linear-gradient(135deg, #F59E0B, #B45309)", ring: "#F59E0B" },
  { tag: "RED", emoji: "🔴", title: "Cheat Meal", subtitle: "Plan dışıydı, yine de paylaş", bg: "linear-gradient(135deg, #EF4444, #B91C1C)", ring: "#EF4444" },
];

export default function NutritionLogPage() {
  const router = useRouter();
  const { success, error, warning } = useNotificationContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tag, setTag] = useState<AdherenceTag | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      warning("Sadece görsel dosyası yükleyebilirsin.");
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      warning("Görsel 8MB'den büyük olamaz.");
      return;
    }
    setFile(next);
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async () => {
    if (!tag) {
      warning("Bir uyum etiketi seç.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("adherenceTag", tag);
    if (note.trim()) formData.append("clientNote", note.trim());

    let response: Response;
    try {
      response = await fetch("/api/client/nutrition-log", {
        method: "POST",
        body: formData,
      });
    } catch (uploadError) {
      console.error(uploadError);
      setSubmitting(false);
      error("Bağlantı hatası. Tekrar dene.");
      return;
    }

    const data = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      error(typeof data.error === "string" ? data.error : "Öğün kaydedilemedi.");
      return;
    }

    success("Öğün kaydedildi. Koçun bilgilendirildi.");
    router.push("/client/dashboard");
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-32 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-[20px] font-black leading-tight text-slate-800">Öğün Kaydet</h1>
          <p className="text-xs text-slate-400">Saniyeler içinde, kalori sayma yok.</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        id="photo-upload"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
          <Image src={previewUrl} alt="Öğün önizleme" fill className="object-cover" sizes="100vw" unoptimized />
          <button
            type="button"
            onClick={triggerPicker}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-slate-700 shadow-lg backdrop-blur"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tekrar Çek
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerPicker}
          className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl bg-slate-50 transition active:scale-[0.99]"
          style={{ border: "2px dashed #CBD5E1" }}
        >
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <Camera className="h-7 w-7" />
            </div>
            <span className="text-sm font-black text-slate-600">Öğün fotoğrafı çek</span>
            <span className="text-[11px] text-slate-400">Dokun → kamera açılır</span>
          </div>
        </button>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bugün nasıldın?</p>
        <div className="flex flex-col gap-2.5">
          {TAGS.map((item) => {
            const active = tag === item.tag;
            return (
              <button
                key={item.tag}
                type="button"
                onClick={() => setTag(item.tag)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-white transition-all"
                style={{
                  background: item.bg,
                  boxShadow: active ? `0 8px 24px ${item.ring}66` : `0 4px 12px ${item.ring}33`,
                  transform: active ? "scale(1.02)" : "scale(1)",
                  outline: active ? `3px solid ${item.ring}` : "none",
                }}
              >
                <span className="text-3xl">{item.emoji}</span>
                <div>
                  <p className="text-sm font-black leading-tight">{item.title}</p>
                  <p className="text-[11px] opacity-80">{item.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sesli not / İtiraf</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder="Bugün biraz stresliyim, akşam yemekte bir dilim pizza yedim..."
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 focus:border-orange-400 focus:bg-white focus:outline-none"
        />
        <span className="text-[10px] text-slate-300">Yakında: tek dokunuşla sesli kayıt.</span>
      </label>

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={submitting || !tag}
        className="mt-2 flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 12px 24px rgba(234,88,12,0.35)" }}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitting ? "Yükleniyor..." : "Öğünü Gönder"}
      </button>
    </div>
  );
}
