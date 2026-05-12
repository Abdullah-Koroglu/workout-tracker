"use client";

import { useState } from "react";
import { Star, Trash2, ShieldCheck, ThumbsUp, MessageCircle, Send } from "lucide-react";

export interface ReviewData {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  isAnon: boolean;
  authorName: string;
  createdAt: string;
  helpfulCount?: number;
  coachReply?: string | null;
  coachReplyAt?: string | null;
  verifiedPurchase?: boolean;
  durationWithCoach?: number | null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i <= rating ? "#F97316" : "none"}
          stroke={i <= rating ? "#F97316" : "#CBD5E1"}
        />
      ))}
    </div>
  );
}

export function ReviewCard({
  review,
  canDelete,
  onDelete,
  canReply,
  onReplied,
}: {
  review: ReviewData;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  canReply?: boolean;
  onReplied?: () => void;
}) {
  const [helpful, setHelpful] = useState(review.helpfulCount ?? 0);
  const [marked, setMarked] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const date = new Date(review.createdAt).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function markHelpful() {
    if (marked) return;
    setMarked(true);
    setHelpful(helpful + 1);
    await fetch(`/api/reviews/${review.id}/helpful`, { method: "POST" }).catch(() => null);
  }

  async function submitReply() {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (res.ok) {
        setReplyOpen(false);
        setReplyText("");
        onReplied?.();
      }
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <div
      className="rounded-2xl bg-white p-5 space-y-3 border border-slate-100"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
          >
            {review.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-slate-800">{review.authorName}</p>
              {review.verifiedPurchase && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-600">
                  <ShieldCheck className="h-3 w-3" /> Doğrulandı
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {date}
              {review.durationWithCoach ? <> · {review.durationWithCoach} hafta koçluk aldı</> : null}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} />
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(review.id)}
              className="ml-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Yorumu sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {review.title && (
        <p className="text-sm font-bold text-slate-700">{review.title}</p>
      )}
      <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>

      {review.coachReply && (
        <div className="rounded-xl bg-slate-50 border-l-4 border-orange-400 p-3 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-orange-500">
            Koç Yanıtı
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">{review.coachReply}</p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={markHelpful}
          disabled={marked}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-colors ${
            marked ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          <ThumbsUp className="h-3 w-3" /> {helpful}
        </button>
        {canReply && !review.coachReply && (
          <button
            onClick={() => setReplyOpen((s) => !s)}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-xs font-bold text-orange-600 hover:bg-orange-100"
          >
            <MessageCircle className="h-3 w-3" /> Yanıtla
          </button>
        )}
      </div>

      {replyOpen && (
        <div className="space-y-2">
          <textarea
            placeholder="Yanıtınızı yazın..."
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
          <button
            onClick={submitReply}
            disabled={submittingReply || !replyText.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-black text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Send className="h-3 w-3" /> Gönder
          </button>
        </div>
      )}
    </div>
  );
}
