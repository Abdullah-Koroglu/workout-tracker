"use client";

import { Star, Trash2 } from "lucide-react";

export interface ReviewData {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  isAnon: boolean;
  authorName: string;
  createdAt: string;
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
}: {
  review: ReviewData;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}) {
  const date = new Date(review.createdAt).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
            <p className="text-sm font-bold text-slate-800">{review.authorName}</p>
            <p className="text-[11px] text-slate-400">{date}</p>
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
    </div>
  );
}
