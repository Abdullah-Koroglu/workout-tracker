"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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
      body: JSON.stringify({ content })
    });
    setLoading(false);

    if (!response.ok) {
      push("Yorum gönderilemedi.");
      return;
    }

    setContent("");
    push("Yorum eklendi.");
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full rounded-md border bg-background p-3 text-sm"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Yorum ekle"
      />
      <Button type="button" onClick={submit} disabled={loading}>
        Yorum Gönder
      </Button>
    </div>
  );
}
