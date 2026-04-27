"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, ChevronLeft, ChevronRight, X, Dumbbell, Timer, CalendarCheck, Utensils, Info } from "lucide-react";
import Link from "next/link";

type ExerciseItem = {
  id: string;
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  durationMinutes: number | null;
  exercise: {
    name: string;
    type: "WEIGHT" | "CARDIO";
  };
};

type AssignmentItem = {
  id: string;
  templateName: string;
  scheduledFor: string;
  isOneTime: boolean;
  workoutStatuses: Array<"IN_PROGRESS" | "COMPLETED" | "ABANDONED">;
  exercises: ExerciseItem[];
};

function getStatus(item: AssignmentItem) {
  if (item.workoutStatuses.includes("COMPLETED")) return "COMPLETED" as const;
  if (item.workoutStatuses.includes("IN_PROGRESS")) return "IN_PROGRESS" as const;
  if (item.workoutStatuses.includes("ABANDONED")) return "ABANDONED" as const;
  return "SCHEDULED" as const;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const STATUS_CONFIG = {
  IN_PROGRESS: { bg: "rgba(249,115,22,0.12)", color: "#EA580C", label: "DEVAM EDİYOR", dot: "#F97316" },
  COMPLETED:   { bg: "rgba(34,197,94,0.12)",  color: "#16A34A", label: "TAMAMLANDI",   dot: "#22C55E" },
  ABANDONED:   { bg: "rgba(239,68,68,0.12)",  color: "#DC2626", label: "YARIDA BIRAKTI", dot: "#EF4444" },
  SCHEDULED:   { bg: "rgba(37,99,235,0.10)",  color: "#2563EB", label: "PLANLI",        dot: "#2563EB" },
} as const;

export function ClientAssignmentsCalendar({ assignments }: { assignments: AssignmentItem[] }) {
  const now = new Date();

  const [monthCursor, setMonthCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDayKey, setSelectedDayKey] = useState<string>(dayKey(now));
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (selectedAssignmentId) {
      const raf = requestAnimationFrame(() => setModalVisible(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [selectedAssignmentId]);

  function closeModal() {
    setModalVisible(false);
    setTimeout(() => setSelectedAssignmentId(null), 320);
  }

  const monthDate = useMemo(() => new Date(monthCursor.year, monthCursor.month, 1), [monthCursor]);
  const firstWeekday = (monthDate.getDay() + 6) % 7;

  const gridStart = useMemo(() => {
    const d = new Date(monthDate);
    d.setDate(1 - firstWeekday);
    return d;
  }, [monthDate, firstWeekday]);

  const byDay = useMemo(() => {
    const m = new Map<string, AssignmentItem[]>();
    for (const assignment of assignments) {
      const date = new Date(assignment.scheduledFor);
      const key = dayKey(date);
      const arr = m.get(key) || [];
      arr.push(assignment);
      m.set(key, arr);
    }
    return m;
  }, [assignments]);

  const calendarCells = useMemo(() => Array.from({ length: 35 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const key = dayKey(d);
    const items = byDay.get(key) || [];
    return {
      date: d,
      key,
      inMonth: d.getMonth() === monthDate.getMonth(),
      items,
      hasAny: items.length > 0,
      hasInProgress: items.some((item) => getStatus(item) === "IN_PROGRESS"),
      hasCompleted: items.some((item) => getStatus(item) === "COMPLETED"),
    };
  }), [gridStart, byDay, monthDate]);

  const todayKey = dayKey(now);

  const lastCompletedWorkout = useMemo(
    () =>
      assignments
        .filter((a) => getStatus(a) === "COMPLETED")
        .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())[0] ?? null,
    [assignments]
  );

  const selectedDayAssignments = byDay.get(selectedDayKey) || [];
  const selectedAssignment = selectedAssignmentId
    ? (assignments.find((a) => a.id === selectedAssignmentId) ?? null)
    : null;

  function prevMonth() {
    setMonthCursor((c) => ({
      year: c.month === 0 ? c.year - 1 : c.year,
      month: c.month === 0 ? 11 : c.month - 1,
    }));
  }

  function nextMonth() {
    setMonthCursor((c) => ({
      year: c.month === 11 ? c.year + 1 : c.year,
      month: c.month === 11 ? 0 : c.month + 1,
    }));
  }

  const agendaLabel = useMemo(() => {
    const [y, m, d] = selectedDayKey.split("-").map(Number);
    return new Date(y, m, d).toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedDayKey]);

  // weekly stats helpers
  const weekStart = useMemo(() => {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekAssignments = useMemo(
    () => assignments.filter((a) => new Date(a.scheduledFor) >= weekStart),
    [assignments, weekStart]
  );
  const weekCompleted = weekAssignments.filter((a) => getStatus(a) === "COMPLETED").length;
  const weekTotal    = weekAssignments.length;
  const weekProgress = weekTotal > 0 ? Math.min(100, (weekCompleted / weekTotal) * 100) : 0;

  return (
    <div className="mb-24 mx-auto max-w-6xl space-y-6 px-4 lg:px-0">

      {/* ══════════════════════════════════════════════════════
          TOP SECTION — Calendar  +  Selected-day detail panel
          Desktop: side-by-side │ Mobile: stacked
         ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">

        {/* ── Calendar card ── */}
        <div
          className="w-full xl:w-[420px] flex-shrink-0 bg-white rounded-2xl p-5"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
        >
          {/* Month header */}
          <div className="flex items-center justify-between mb-5">
            <div className="space-y-0.5">
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Antrenman Dönemi
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-800">
                {monthDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }).toUpperCase()}
              </h2>
            </div>
            <div className="flex gap-2">
              {[{ icon: ChevronLeft, fn: prevMonth }, { icon: ChevronRight, fn: nextMonth }].map(({ icon: Icon, fn }, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={fn}
                  className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-200 hover:text-orange-500 transition-all"
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
              <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const isToday    = cell.key === todayKey;
              const isSelected = cell.key === selectedDayKey;

              const dotColor = cell.hasCompleted ? "#2563EB"
                : cell.hasInProgress             ? "#F97316"
                : "#94A3B8";

              return (
                <button
                  type="button"
                  key={cell.key}
                  className={`
                    relative h-10 w-full rounded-xl flex flex-col items-center justify-center gap-0.5
                    transition-all duration-150 font-bold text-sm
                    ${isToday
                      ? "text-white shadow-lg"
                      : isSelected
                        ? "bg-slate-800 text-white shadow-md"
                        : cell.inMonth
                          ? "bg-slate-50 text-slate-700 hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
                          : "text-slate-200 cursor-default"
                    }
                  `}
                  style={isToday ? {
                    background: "linear-gradient(135deg, #FB923C, #EA580C)",
                    boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
                  } : undefined}
                  onClick={() => cell.inMonth && setSelectedDayKey(cell.key)}
                >
                  <span className="leading-none text-xs">{String(cell.date.getDate()).padStart(2, "0")}</span>
                  {cell.hasAny && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: isToday || isSelected ? "rgba(255,255,255,0.8)" : dotColor }}
                    />
                  )}
                  {cell.items.length > 1 && (
                    <span
                      className="absolute top-0.5 right-0.5 text-[7px] font-black w-3 h-3 rounded-full flex items-center justify-center"
                      style={{
                        background: isToday || isSelected ? "rgba(255,255,255,0.25)" : "rgba(249,115,22,0.15)",
                        color:      isToday || isSelected ? "#fff" : "#EA580C",
                      }}
                    >
                      {cell.items.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
            {[
              { color: "#94A3B8", label: "Planlandı" },
              { color: "#F97316", label: "Devam" },
              { color: "#2563EB", label: "Tamamlandı" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Selected-day detail panel ── */}
        <div className="flex-1 min-w-0">
          {/* Panel header */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-0.5">
                Günlük Ajanda
              </span>
              <h3 className="text-xl font-black tracking-tight text-slate-800 capitalize">
                {agendaLabel}
              </h3>
            </div>
            {selectedDayAssignments.length > 0 && (
              <span
                className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}
              >
                {selectedDayAssignments.length} antrenman
              </span>
            )}
          </div>

          {/* Workout cards for selected day */}
          {selectedDayAssignments.length > 0 ? (
            <div className="space-y-3">
              {selectedDayAssignments
                .slice()
                .sort((a, b) => {
                  const p = { IN_PROGRESS: 0, SCHEDULED: 1, ABANDONED: 2, COMPLETED: 3 } as const;
                  return p[getStatus(a)] - p[getStatus(b)];
                })
                .map((assignment) => {
                  const status = getStatus(assignment);
                  const cfg    = STATUS_CONFIG[status];

                  return (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => setSelectedAssignmentId(assignment.id)}
                      className="group w-full text-left bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md"
                      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      <div className="flex">
                        {/* Left accent bar */}
                        <div className="w-1 flex-shrink-0 rounded-l-2xl" style={{ background: cfg.dot }} />

                        <div className="flex-1 p-4 relative overflow-hidden">
                          {/* Decorative bg icon */}
                          <div className="absolute -right-3 -bottom-3 opacity-[0.04] pointer-events-none">
                            <Dumbbell className="w-20 h-20" />
                          </div>

                          <div className="relative z-10 flex items-center gap-4">
                            {/* Icon */}
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: cfg.bg }}
                            >
                              <Dumbbell className="h-5 w-5" style={{ color: cfg.color }} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span
                                  className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                  style={{ background: cfg.bg, color: cfg.color }}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-slate-800 truncate">{assignment.templateName}</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {assignment.exercises.length} egzersiz
                              </p>
                            </div>

                            {/* CTA */}
                            <div className="flex-shrink-0">
                              {status !== "COMPLETED" ? (
                                <span
                                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-2 rounded-xl text-white"
                                  style={{
                                    background: "linear-gradient(135deg, #FB923C, #EA580C)",
                                    boxShadow: "0 3px 8px rgba(249,115,22,0.3)",
                                  }}
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                  {status === "IN_PROGRESS" ? "Devam" : "Başlat"}
                                </span>
                              ) : (
                                <span
                                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl"
                                  style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}
                                >
                                  ✓ Tamam
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          ) : (
            <div
              className="bg-white rounded-2xl p-8 text-center"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: "rgba(249,115,22,0.08)" }}
              >
                <CalendarCheck className="h-6 w-6 text-orange-300" />
              </div>
              <p className="font-bold text-slate-600 text-sm">Bu gün için antrenman yok</p>
              <p className="text-xs text-slate-400 mt-1">Takvimden başka bir gün seçebilirsin</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          BOTTOM SECTION — Last completed  +  Weekly load  +  Reminders
         ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Last completed workout — wide bento card */}
        {lastCompletedWorkout && (
          <button
            type="button"
            onClick={() => setSelectedAssignmentId(lastCompletedWorkout.id)}
            className="md:col-span-7 group relative w-full text-left rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)" }}
            />
            <div
              className="absolute top-0 right-0 w-48 h-48 -mr-24 -mt-24 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)" }}
            />
            <div className="relative z-10 p-5 flex gap-5 items-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.2)" }}
              >
                <Dumbbell className="h-8 w-8 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(34,197,94,0.2)", color: "#4ADE80" }}
                  >
                    ✓ Son Tamamlanan
                  </span>
                </div>
                <h4 className="text-base font-black text-white truncate">{lastCompletedWorkout.templateName}</h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  {lastCompletedWorkout.exercises.length} egzersiz ·{" "}
                  {new Date(lastCompletedWorkout.scheduledFor).toLocaleDateString("tr-TR")}
                </p>
              </div>
              <div className="hidden sm:flex gap-5 flex-shrink-0">
                <div className="text-center">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Egzersiz</span>
                  <span className="text-xl font-black text-white">{lastCompletedWorkout.exercises.length}</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Durum</span>
                  <span className="text-sm font-black text-green-400">✓ Tamam</span>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Right side: Weekly Load + Reminders stacked */}
        <div className={`${lastCompletedWorkout ? "md:col-span-5" : "md:col-span-12"} space-y-6`}>

          {/* Weekly Load panel */}
          <div
            className="rounded-2xl p-5 space-y-4 overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-40 h-40 -mr-20 -mt-20 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)" }}
            />
            <h3 className="text-sm font-black tracking-widest text-white uppercase relative z-10">Haftalık Yük</h3>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bu Hafta</span>
                <span className="text-2xl font-black text-orange-400">
                  {weekTotal}{" "}
                  <span className="text-xs font-bold text-slate-400">SEANS</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ background: "linear-gradient(90deg, #FB923C, #EA580C)", width: `${weekProgress}%` }}
                />
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                {assignments.filter((a) => getStatus(a) === "COMPLETED").length} tamamlandı,{" "}
                {assignments.filter((a) => getStatus(a) === "SCHEDULED").length} planlandı.
              </p>
            </div>
          </div>

          {/* Reminders panel */}
          <div
            className="bg-white rounded-2xl p-5 space-y-4"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <h3 className="text-[11px] font-black tracking-widest text-slate-500 uppercase">Yaklaşan Hatırlatmalar</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <CalendarCheck className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Haftalık Performans Kontrolü</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Takvim üzerinden detaylandır</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Utensils className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Beslenme Takibi</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Gün sonuna kadar tamamla</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-orange-500 border-t border-slate-100 mt-1 hover:text-orange-600 transition-colors"
            >
              Tüm Programı Gör
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL — Workout Detail Sheet
         ══════════════════════════════════════════════════════ */}
      {selectedAssignment ? (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center !mt-0"
          onClick={closeModal}
        >
          <div
            className={`absolute inset-0 transition-[opacity,backdrop-filter] duration-300 ease-out ${
              modalVisible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-none"
            }`}
            style={{ background: "rgba(15,23,42,0.65)" }}
          />

          <div
            className={`relative w-full max-w-lg md:mx-6 bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden transition-all duration-300 ease-out ${
              modalVisible
                ? "translate-y-0 opacity-100 md:scale-100"
                : "translate-y-full opacity-0 md:translate-y-4 md:scale-95"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="px-6 pt-4 pb-5 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const s   = getStatus(selectedAssignment);
                      const cfg = {
                        COMPLETED:   { bg: "rgba(34,197,94,0.12)",  color: "#16A34A", label: "✓ Tamamlandı" },
                        IN_PROGRESS: { bg: "rgba(249,115,22,0.12)", color: "#EA580C", label: "● Devam Ediyor" },
                        ABANDONED:   { bg: "rgba(239,68,68,0.12)",  color: "#DC2626", label: "✗ Yarıda Bıraktı" },
                        SCHEDULED:   { bg: "rgba(37,99,235,0.10)",  color: "#2563EB", label: "○ Planlandı" },
                      }[s];
                      return (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      );
                    })()}
                    <span className="text-[10px] text-slate-400">
                      {new Date(selectedAssignment.scheduledFor).toLocaleDateString("tr-TR", {
                        weekday: "long", day: "numeric", month: "long",
                      })}
                    </span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-slate-800 leading-tight truncate">
                    {selectedAssignment.templateName}
                  </h2>
                  <p className="text-sm text-slate-400">{selectedAssignment.exercises.length} egzersiz</p>
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500"
                  onClick={closeModal}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100 flex-shrink-0 mx-6" />

            {/* Exercise list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {selectedAssignment.exercises
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: exercise.exercise.type === "CARDIO"
                          ? "rgba(37,99,235,0.10)"
                          : "rgba(249,115,22,0.10)",
                      }}
                    >
                      {exercise.exercise.type === "CARDIO" ? (
                        <Timer className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Dumbbell className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-700 truncate">
                        <span className="text-slate-300 mr-1 font-normal">{index + 1}.</span>
                        {exercise.exercise.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {exercise.exercise.type === "CARDIO" ? "Kardiyo" : "Kuvvet"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {exercise.exercise.type === "CARDIO" ? (
                        <p className="font-bold text-sm text-blue-500">{exercise.durationMinutes ?? "—"} dk</p>
                      ) : (
                        <>
                          <p className="font-bold text-sm text-orange-500">
                            {exercise.targetSets ?? "—"} × {exercise.targetReps ?? "—"}
                          </p>
                          <p className="text-[10px] text-slate-400">set × tekrar</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}

              <div className="flex gap-2.5 items-start p-3 rounded-2xl bg-blue-50 mt-1">
                <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Ağır setler öncesinde ısınmanı tamamla ve teknik formu koru.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 flex-shrink-0 border-t border-slate-100">
              {getStatus(selectedAssignment) !== "COMPLETED" ? (
                <a
                  href={`/client/workout/${selectedAssignment.id}/start`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-sm text-white uppercase tracking-widest active:scale-95 transition-transform"
                  style={{
                    background: "linear-gradient(135deg, #FB923C, #EA580C)",
                    boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
                  }}
                >
                  <Play className="h-4 w-4 fill-current" />
                  {getStatus(selectedAssignment) === "IN_PROGRESS" ? "Devam Et" : "Şimdi Başlat"}
                </a>
              ) : (
                <Link
                  href={`/client/workouts/${selectedAssignment.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <span className="font-bold text-sm text-green-600">✓ Bu seans tamamlandı</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
