"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, MessageSquare, Send, X } from "lucide-react";

interface Comment {
  id: string;
  coachName: string;
  content: string;
  createdAt: Date | string;
}

interface MovementVideoDetailModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MovementVideoDetailModal({
  videoId,
  isOpen,
  onClose,
}: MovementVideoDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<{
    id: string;
    clientName: string;
    clientEmail: string;
    movementName: string;
    videoPath: string;
    durationSeconds: number;
    watchedByCoach: boolean;
    createdAt: Date | string;
    comments: Comment[];
  } | null>(null);
  const [comment, setComment] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !videoId) return;

    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/movement-videos/${videoId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Video yüklenemedi.");
        }
        const data = await res.json();
        setVideo(data.video);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [isOpen, videoId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [video?.comments]);

  const handleSubmitComment = async () => {
    if (!comment.trim() || !videoId || submitLoading) return;

    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/movement-videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Yorum eklenemedi.");
      }

      const data = await res.json();
      setVideo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...prev.comments, data.comment],
        };
      });
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yorum eklenirken hata.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 md:p-6">
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-800">Video Gözden Geçir</h2>
            {video && (
              <p className="mt-1 text-xs text-slate-500">
                {video.movementName} • {video.clientName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 transition hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-slate-600">Video yükleniyor...</div>
            </div>
          ) : error ? (
            <div className="m-4 flex gap-2 rounded-lg bg-red-50 p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          ) : video ? (
            <div className="space-y-4 p-4 md:p-6">
              {/* Video Player */}
              <div className="overflow-hidden rounded-xl bg-black">
                <video
                  src={video.videoPath}
                  controls
                  className="aspect-video w-full"
                />
              </div>

              {/* Video Info */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                      Adı
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {video.clientName}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                      Hareket
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {video.movementName}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                      Süre
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {video.durationSeconds}s
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                      Tarih
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {new Date(video.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t pt-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                  <MessageSquare className="h-4 w-4" />
                  Yorumlar ({video.comments.length})
                </h3>

                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {video.comments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      Henüz yorum yok. İlk yorum yapan sen ol!
                    </p>
                  ) : (
                    video.comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-800">
                              {c.coachName}
                            </p>
                            <p className="mt-1 text-xs text-slate-600 whitespace-pre-wrap">
                              {c.content}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-500 flex-shrink-0">
                            {new Date(c.createdAt).toLocaleDateString("tr-TR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Comment Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    placeholder="Yorum yaz..."
                    maxLength={2000}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs placeholder-slate-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    disabled={submitLoading}
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!comment.trim() || submitLoading}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
