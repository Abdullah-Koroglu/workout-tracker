"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useNotificationContext } from "@/contexts/NotificationContext";

export function CommentBox({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const { push } = useNotificationContext();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    const response = await fetch(`/api/coach/workouts/${workoutId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setLoading(false);
    if (!response.ok) { push("Yorum gönderilemedi."); return; }
    setContent("");
    push("Yorum eklendi.");
    router.refresh();
  };

  return (
    <div>
      <div
        className="text-[10px] font-bold uppercase tracking-wider mb-2"
        style={{ color: "#94A3B8" }}
      >
        Yorum Ekle
      </div>
      <textarea
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Antrenman hakkında yorumun..."
        className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none resize-none"
        style={{
          border: "1.5px solid #E2E8F0",
          background: "#F8FAFC",
          color: "#1E293B",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />
      <button
        onClick={submit}
        disabled={loading || !content.trim()}
        className="mt-2 w-full rounded-xl py-2.5 text-[13px] font-bold text-white transition-opacity disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #FB923C, #EA580C)",
          boxShadow: "0 4px 14px #F9731644",
          border: "none",
          cursor: loading || !content.trim() ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Gönderiliyor..." : "Yorumu Gönder"}
      </button>
    </div>
  );
}
