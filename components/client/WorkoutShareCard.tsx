"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";

import { useNotificationContext } from "@/contexts/NotificationContext";

type WorkoutShareCardProps = {
  title: string;
  durationMinutes: number | null;
  totalVolumeKg: number;
  prExerciseNames: string[];
  workoutDate?: Date;
  totalSets?: number;
};

/* ── Mini spark-bar (inline SVG, no external deps) ── */
function SparkBars({ value, max }: { value: number; max: number }) {
  const bars = 12;
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 20 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars;
        const filled    = value / max >= threshold;
        return (
          <div
            key={i}
            style={{
              width: 4,
              borderRadius: 2,
              height: `${30 + (i / bars) * 70}%`,
              background: filled
                ? `rgba(249,115,22,${0.4 + (i / bars) * 0.6})`
                : "rgba(255,255,255,0.12)",
              transition: "background 0.3s",
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Stat tile used inside the card ── */
function StatTile({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 16,
        padding: "12px 14px",
        background: accent ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.07)",
        border: accent
          ? "1px solid rgba(249,115,22,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase" as const,
          color: accent ? "rgba(251,146,60,0.9)" : "rgba(255,255,255,0.45)",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 3,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1,
            color: accent ? "#FB923C" : "#fff",
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: accent ? "rgba(251,146,60,0.7)" : "rgba(255,255,255,0.4)",
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function WorkoutShareCard({
  title,
  durationMinutes,
  totalVolumeKg,
  prExerciseNames,
  workoutDate,
  totalSets,
}: WorkoutShareCardProps) {
  const { success, error } = useNotificationContext();
  const cardRef  = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: "#0D1B2E",
    });
  };

  const handleDownload = async () => {
    setBusy("download");
    try {
      const dataUrl = await generateImage();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.download = "fitcoach-workout.png";
      a.href = dataUrl;
      a.click();
      success("Paylaşım kartı indirildi.");
    } catch {
      error("Kart oluşturulamadı.");
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) { await handleDownload(); return; }
    setBusy("share");
    try {
      const dataUrl = await generateImage();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "fitcoach-workout.png", { type: "image/png" });
      await navigator.share({
        title: `FitCoach — ${title}`,
        text: `Antrenmanı tamamladım! ${totalVolumeKg.toLocaleString("tr-TR")} kg hacim${prExerciseNames.length ? ` · ${prExerciseNames.length} PR` : ""} #FitCoach`,
        files: [file],
      });
    } catch { /* cancelled */ }
    finally { setBusy(null); }
  };

  const dateLabel = workoutDate?.toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });

  /* normalized progress for spark bars (cap at 200 sets) */
  const setsMax = Math.max(totalSets ?? 0, 20);

  return (
    <section
      className="rounded-[18px] bg-white p-4 shadow-sm"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* ── Header ── */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="mb-0.5 block text-[10px] font-black uppercase tracking-widest text-orange-500">
            Workout Story
          </span>
          <h3 className="text-[15px] font-bold text-slate-800">Paylaşım Kartı</h3>
          <p className="mt-0.5 text-[12px] text-slate-400">
            Antrenman kartını indir ve paylaş
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={handleShare}
              disabled={!!busy}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-50"
              style={{
                background: "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.2)",
              }}
              title="Paylaş"
            >
              <Share2 className="h-4 w-4 text-orange-500" />
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!!busy}
            className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
          >
            <Download className="h-3.5 w-3.5" />
            {busy === "download" ? "Hazırlanıyor..." : "İndir"}
          </button>
        </div>
      </div>

      {/* ── Preview wrapper ── */}
      <div
        className="overflow-auto rounded-2xl p-3"
        style={{ background: "#0D1B2E", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* ═══════════════════════════════════════════
            THE CARD  (360 × 640) — exported as PNG
            ═══════════════════════════════════════════ */}
        <div
          ref={cardRef}
          style={{
            width: 360,
            height: 640,
            margin: "0 auto",
            borderRadius: 28,
            overflow: "hidden",
            position: "relative",
            background: "linear-gradient(170deg, #0D1B2E 0%, #0F2645 45%, #0D1B2E 100%)",
            display: "flex",
            flexDirection: "column",
            padding: "28px 26px 24px",
            boxSizing: "border-box" as const,
            fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          }}
        >
          {/* ── Geometric accent shapes ── */}
          {/* Large arc top-right */}
          <div
            style={{
              position: "absolute",
              top: -70,
              right: -70,
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: "32px solid rgba(249,115,22,0.12)",
              pointerEvents: "none",
            }}
          />
          {/* Small filled circle bottom-left */}
          <div
            style={{
              position: "absolute",
              bottom: 80,
              left: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(37,99,235,0.12)",
              pointerEvents: "none",
            }}
          />
          {/* Tiny accent dot top-left */}
          <div
            style={{
              position: "absolute",
              top: 42,
              left: 26,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#FB923C",
              pointerEvents: "none",
            }}
          />
          {/* Orange diagonal stripe bottom-right */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 160,
              height: 4,
              background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.6))",
              pointerEvents: "none",
            }}
          />

          {/* ── TOP: Brand bar ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 22,
              position: "relative",
            }}
          >
            {/* Logo + wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Logo.png rendered via <img> so html-to-image can capture it */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="FitCoach"
                width={28}
                height={28}
                style={{
                  width: 28,
                  height: 28,
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.2px",
                    lineHeight: 1,
                  }}
                >
                  FitCoach
                </div>
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.35)",
                    marginTop: 2,
                  }}
                >
                  Performance
                </div>
              </div>
            </div>

            {/* Date */}
            {dateLabel && (
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.05em",
                }}
              >
                {dateLabel}
              </div>
            )}
          </div>

          {/* ── MIDDLE: Title + PR badge ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
            {/* Completed badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
                alignSelf: "flex-start",
                borderRadius: 100,
                padding: "5px 12px",
                background: "rgba(249,115,22,0.15)",
                border: "1px solid rgba(249,115,22,0.3)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#FB923C",
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.18em",
                  color: "#FB923C",
                }}
              >
                Antrenman Tamamlandı
              </span>
            </div>

            {/* Workout name */}
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.15,
                letterSpacing: "-0.6px",
                marginBottom: 6,
                maxHeight: 100,
                overflow: "hidden",
              }}
            >
              {title}
            </div>

            {/* Spark bars + PR count row */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <SparkBars value={totalSets ?? 0} max={setsMax} />

              {prExerciseNames.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#FB923C",
                      lineHeight: 1,
                      letterSpacing: "-1px",
                    }}
                  >
                    {prExerciseNames.length}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase" as const,
                      color: "rgba(251,146,60,0.7)",
                      marginTop: 2,
                    }}
                  >
                    PR Kırıldı 🏆
                  </div>
                </div>
              )}
            </div>

            {/* PR exercise names */}
            {prExerciseNames.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(251,146,60,0.65)",
                  letterSpacing: "0.02em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {prExerciseNames.join(" · ")}
              </div>
            )}
          </div>

          {/* ── BOTTOM: Stats row ── */}
          <div style={{ marginTop: 20, position: "relative" }}>
            {/* Thin separator */}
            <div
              style={{
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                marginBottom: 14,
              }}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <StatTile label="Süre" value={durationMinutes ?? 0} unit="dk" />
              <StatTile label="Hacim" value={totalVolumeKg.toLocaleString("tr-TR")} unit="kg" accent />
              <StatTile label="Set" value={totalSets ?? "—"} />
            </div>

            {/* Hashtags */}
            <div
              style={{
                marginTop: 14,
                textAlign: "center",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.2)",
              }}
            >
              #FitCoach #Progress #Fitness
            </div>
          </div>
        </div>
        {/* end card */}
      </div>
    </section>
  );
}
