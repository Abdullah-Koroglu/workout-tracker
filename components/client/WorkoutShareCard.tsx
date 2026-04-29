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
  exercises?: Array<{ name: string; maxWeightKg: number | null }>;
  clientName?: string;
  coachName?: string;
};

/* Volume formatter: 7900 → "7.9t", 450 → "450kg" */
function fmtVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace(".", ",")}t`;
  return `${kg}kg`;
}

const ACCENT_COLORS = ["#F97316", "#2563EB", "#F97316", "#2563EB", "#22C55E", "#A855F7"];

export function WorkoutShareCard({
  title,
  durationMinutes,
  totalVolumeKg,
  prExerciseNames,
  workoutDate,
  totalSets,
  exercises = [],
  clientName,
  coachName,
}: WorkoutShareCardProps) {
  const { success, error } = useNotificationContext();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: "#0B1929",
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
        text: `Antrenmanı tamamladım! ${fmtVolume(totalVolumeKg)} hacim${prExerciseNames.length ? ` · ${prExerciseNames.length} PR` : ""} #FitCoach`,
        files: [file],
      });
    } catch { /* cancelled */ }
    finally { setBusy(null); }
  };

  const dateLabel = workoutDate?.toLocaleDateString("tr-TR", {
    day: "numeric", month: "short", year: "numeric",
  })?.toUpperCase();

  const stats = [
    { value: durationMinutes ? `${durationMinutes}dk` : "—", label: "SÜRE" },
    { value: String(totalSets ?? "—"), label: "SET" },
    { value: String(exercises.length || "—"), label: "EGZERSİZ" },
    { value: fmtVolume(totalVolumeKg), label: "HACİM" },
  ];

  /* Card height: base 480 + 52px per exercise + 56px for bottom row if names present */
  const cardHeight = 480
    + exercises.length * 52
    + (clientName || coachName ? 56 : 0);

  return (
    <div
      className="rounded-[18px] overflow-hidden"
      style={{
        background: "#fff",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Header bar ── */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid #F1F5F9" }}
      >
        <div>
          <span className="block text-[10px] font-black uppercase tracking-widest" style={{ color: "#F97316" }}>
            Workout Story
          </span>
          <h3 className="text-[15px] font-bold mt-0.5" style={{ color: "#1E293B" }}>
            Paylaşım Kartı
          </h3>
          <p className="text-[12px] mt-0.5" style={{ color: "#94A3B8" }}>
            Antrenman kartını indir ve paylaş
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={handleShare}
              disabled={!!busy}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-50"
              style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}
              title="Paylaş"
            >
              <Share2 className="h-4 w-4" style={{ color: "#F97316" }} />
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!!busy}
            className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #FB923C, #EA580C)",
              boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
              border: "none",
            }}
          >
            <Download className="h-3.5 w-3.5" />
            {busy === "download" ? "Hazırlanıyor..." : "İndir"}
          </button>
        </div>
      </div>

      {/* ── Preview wrapper ── */}
      <div className="p-3" style={{ background: "#0B1929" }}>

        {/* ═══ THE CARD — exported as PNG ═══ */}
        <div
          ref={cardRef}
          style={{
            width: 360,
            height: cardHeight,
            margin: "0 auto",
            borderRadius: 24,
            overflow: "hidden",
            position: "relative",
            background: "linear-gradient(170deg, #0B1929 0%, #0F2645 55%, #0B1929 100%)",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box" as const,
            fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          }}
        >
          {/* Subtle background accents */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 180, height: 180, borderRadius: "50%", border: "28px solid rgba(249,115,22,0.08)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 60, left: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(37,99,235,0.07)", pointerEvents: "none" }} />

          {/* ── TOP BAR: Logo + date ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Logo circle */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="" className="w-full" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.2px" }}>FitCoach</div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>WORKOUT SUMMARY</div>
              </div>
            </div>
            {dateLabel && (
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
                {dateLabel}
              </div>
            )}
          </div>

          {/* ── WORKOUT NAME ── */}
          <div style={{ padding: "18px 20px 0" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#F97316", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
              ANTRENMAN{prExerciseNames.length > 0 ? ` · ${prExerciseNames.length} PR 🏆` : ""}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.8px", wordBreak: "break-word" as const }}>
              {title}
            </div>
          </div>

          {/* ── STATS ROW ── */}
          <div style={{ margin: "16px 20px 0", padding: "12px 8px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex" }}>
              {stats.map((s, i) => (
                <div key={s.label} style={{
                  flex: 1,
                  textAlign: "center",
                  borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  padding: "0 4px",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── EXERCISES ── */}
          {exercises.length > 0 && (
            <div style={{ margin: "16px 20px 0" }}>
              {/* Section label */}
              <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                HAREKETLER
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Exercise rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {exercises.map((ex, i) => (
                  <div key={ex.name} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    borderLeft: `3px solid ${ACCENT_COLORS[i % ACCENT_COLORS.length]}`,
                  }}>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.1px" }}>
                      {ex.name}
                    </div>
                    {prExerciseNames.includes(ex.name) && (
                      <div style={{ fontSize: 9, fontWeight: 800, color: "#F59E0B", background: "rgba(245,158,11,0.15)", borderRadius: 6, padding: "2px 6px", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                        PR
                      </div>
                    )}
                    {ex.maxWeightKg !== null && (
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#FB923C", letterSpacing: "-0.3px", flexShrink: 0 }}>
                        {ex.maxWeightKg}kg
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BOTTOM: Danışan / Koç ── */}
          {(clientName || coachName) && (
            <div style={{
              margin: "16px 20px 20px",
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
            }}>
              {clientName && (
                <div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 3 }}>DANIŞAN</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{clientName}</div>
                </div>
              )}
              {coachName && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 3 }}>KOÇ</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{coachName}</div>
                </div>
              )}
            </div>
          )}

          {/* Bottom accent line */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #F97316, transparent)" }} />
        </div>
      </div>
    </div>
  );
}
