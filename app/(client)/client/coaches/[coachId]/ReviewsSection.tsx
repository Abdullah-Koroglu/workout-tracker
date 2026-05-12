"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, MessageSquarePlus, ChevronDown, ChevronUp } from "lucide-react";
import { ReviewCard, type ReviewData } from "@/components/coach/ReviewCard";
import { ReviewForm } from "@/components/coach/ReviewForm";

interface Props {
  coachId: string;
  isConnected: boolean; // client has or had a relation with this coach
}

function AverageStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-4 w-4"
          fill={i <= Math.round(rating) ? "#F97316" : "none"}
          stroke={i <= Math.round(rating) ? "#F97316" : "#CBD5E1"}
        />
      ))}
    </div>
  );
}

export function ReviewsSection({ coachId, isConnected }: Props) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?coachId=${coachId}`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => { load(); }, [load]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const displayed = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "rgba(249,115,22,0.1)" }}
          >
            <Star className="h-4 w-4 text-orange-500" />
          </div>
          <h2 className="text-base font-black text-slate-800">Yorumlar</h2>
          {reviews.length > 0 && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-black"
              style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}
            >
              {reviews.length}
            </span>
          )}
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <AverageStars rating={avgRating} />
            <span className="text-sm font-black text-slate-700">{avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Write review button */}
      {isConnected && (
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-2.5 text-sm font-bold text-orange-600 transition-all hover:bg-orange-100"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {showForm ? "Formu Kapat" : "Yorum Yaz"}
        </button>
      )}

      {/* Review form */}
      {showForm && (
        <div
          className="rounded-2xl bg-white p-5 border border-slate-100"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <ReviewForm
            coachId={coachId}
            onSuccess={() => {
              setShowForm(false);
              load();
            }}
          />
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div
          className="rounded-2xl bg-gradient-to-br from-white to-slate-50 p-8 text-center border border-slate-100"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "rgba(249,115,22,0.1)" }}
          >
            <Star className="h-6 w-6 text-orange-400" />
          </div>
          <p className="font-bold text-slate-600">Henüz yorum yok</p>
          {isConnected && (
            <p className="mt-1 text-xs text-slate-400">
              İlk yorumu siz yapın!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((r) => (
            <ReviewCard key={r.id} review={r} canDelete={false} />
          ))}
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 py-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-700"
            >
              {showAll ? (
                <><ChevronUp className="h-4 w-4" /> Daha az göster</>
              ) : (
                <><ChevronDown className="h-4 w-4" /> Tüm yorumları gör ({reviews.length})</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
