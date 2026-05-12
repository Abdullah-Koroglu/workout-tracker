"use client";

import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";

interface Props {
  coachId: string;
  onSuccess?: () => void;
  existingReview?: {
    rating: number;
    title: string | null;
    content: string;
    isAnon: boolean;
  } | null;
}

export function ReviewForm({ coachId, onSuccess, existingReview }: Props) {
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [isAnon, setIsAnon] = useState(existingReview?.isAnon ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length < 10) {
      setError("Yorum en az 10 karakter olmalıdır.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId, rating, title: title.trim() || undefined, content, isAnon }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Bir hata oluştu");
        return;
      }
      setSuccess(true);
      onSuccess?.();
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-5 text-center space-y-2">
        <p className="text-sm font-bold text-green-700">Yorumunuz kaydedildi!</p>
        <p className="text-xs text-green-600">Geri bildiriminiz için teşekkürler.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star rating */}
      <div>
        <p className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Puanınız</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className="h-7 w-7"
                fill={i <= (hovered || rating) ? "#F97316" : "none"}
                stroke={i <= (hovered || rating) ? "#F97316" : "#CBD5E1"}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-bold text-slate-600">{rating}/5</span>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Başlık (İsteğe bağlı)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Örn: Harika bir koç!"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
        />
      </div>

      {/* Content */}
      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Yorumunuz <span className="text-red-400">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          placeholder="Deneyiminizi paylaşın..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
        />
        <p className="mt-1 text-right text-[11px] text-slate-400">{content.length}/1000</p>
      </div>

      {/* Anon toggle */}
      <label className="flex cursor-pointer items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            checked={isAnon}
            onChange={(e) => setIsAnon(e.target.checked)}
            className="sr-only"
          />
          <div
            className="h-5 w-9 rounded-full transition-colors"
            style={{ background: isAnon ? "#F97316" : "#E2E8F0" }}
          >
            <div
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: isAnon ? "translateX(16px)" : "translateX(2px)" }}
            />
          </div>
        </div>
        <span className="text-sm text-slate-600">Anonim yorum yap</span>
      </label>

      {error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || content.trim().length < 10}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #FB923C, #EA580C)",
          boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
        }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {existingReview ? "Yorumu Güncelle" : "Yorum Gönder"}
      </button>
    </form>
  );
}
