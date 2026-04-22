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

export function ClientAssignmentsCalendar({ assignments }: { assignments: AssignmentItem[] }) {
  const now = new Date();

  const [monthCursor, setMonthCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDayKey, setSelectedDayKey] = useState<string>(dayKey(now));
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Animate in when modal opens
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
      hasCompleted: items.some((item) => getStatus(item) === "COMPLETED")
    };
  }), [gridStart, byDay, monthDate]);

  const todayKey = dayKey(now);

  // Always show the globally most recent completed workout in the TAMAMLANDI card
  const lastCompletedWorkout = useMemo(
    () =>
      assignments
        .filter((a) => getStatus(a) === "COMPLETED")
        .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())[0] ?? null,
    [assignments]
  );

  // Selected day assignments
  const selectedDayAssignments = byDay.get(selectedDayKey) || [];

  // Selected assignment for modal — ONLY when explicitly clicked
  const selectedAssignment = selectedAssignmentId ? (assignments.find((a) => a.id === selectedAssignmentId) ?? null) : null;

  function prevMonth() {
    setMonthCursor((c) => {
      const m = c.month === 0 ? 11 : c.month - 1;
      const y = c.month === 0 ? c.year - 1 : c.year;
      return { year: y, month: m };
    });
  }

  function nextMonth() {
    setMonthCursor((c) => {
      const m = c.month === 11 ? 0 : c.month + 1;
      const y = c.month === 11 ? c.year + 1 : c.year;
      return { year: y, month: m };
    });
  }

  const agendaLabel = useMemo(() => {
    const key = selectedDayKey.split("-").map(Number);
    const d = new Date(key[0], key[1], key[2]);
    return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  }, [selectedDayKey]);

  return (
    <div className="mb-24 mx-auto max-w-5xl space-y-8 px-0">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-label text-xs font-bold uppercase tracking-widest text-secondary">
              Antreman Donemi
            </span>
            <h2 className="text-3xl font-black tracking-tight text-on-surface">
              {monthDate
                .toLocaleDateString("tr-TR", { month: "long", year: "numeric" })
                .toUpperCase()}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              className="h-10 w-10 rounded-lg bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
              type="button"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="h-10 w-10 rounded-lg bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
              type="button"
              onClick={nextMonth}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-lg p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"].map((day) => (
              <div
                key={day}
                className="text-center font-label text-[10px] font-bold text-slate-400 uppercase tracking-tighter"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell) => {
              const isToday = cell.key === todayKey;
              const isSelected = cell.key === selectedDayKey && !isToday;
              const bgClass = isToday
                ? "bg-primary text-white shadow-lg ring-4 ring-primary/20 cursor-pointer"
                : isSelected
                  ? "bg-secondary text-white shadow-md cursor-pointer"
                  : cell.inMonth
                    ? "bg-surface-container-lowest rounded-lg hover:bg-surface-container-high cursor-pointer transition-colors"
                    : "text-slate-300 opacity-20 cursor-default";

              return (
                <button
                  type="button"
                  key={cell.key}
                  className={`h-20 p-2 rounded-lg text-left ${bgClass}`}
                  onClick={() => cell.inMonth && setSelectedDayKey(cell.key)}
                >
                  <span className="text-sm font-bold">
                    {String(cell.date.getDate()).padStart(2, "0")}
                  </span>
                  {isToday ? (
                    <p className="text-[8px] mt-1 font-bold leading-none">
                      BUGUN
                    </p>
                  ) : null}
                  <div className="mt-2 flex gap-1">
                    {cell.hasAny &&
                    !cell.hasCompleted &&
                    !cell.hasInProgress ? (
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isToday || isSelected ? "bg-white" : "bg-primary"}`}
                      />
                    ) : null}
                    {cell.hasInProgress ? (
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isToday || isSelected ? "bg-white" : "bg-primary-container"}`}
                      />
                    ) : null}
                    {cell.hasCompleted ? (
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isToday || isSelected ? "bg-white" : "bg-tertiary"}`}
                      />
                    ) : null}
                  </div>
                  {cell.items.length > 1 ? (
                    <span className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-black ${isToday || isSelected ? "bg-white/25 text-white" : "bg-primary/15 text-primary"}`}>
                      {cell.items.length}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT: Daily agenda for selected day */}
        <div className="md:col-span-8 space-y-6">
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black tracking-tight">GUNLUK AJANDA</h3>
            <span className="font-label text-sm font-bold text-primary capitalize">{agendaLabel}</span>
          </div>

          {/* Last completed workout — always shown */}
          {lastCompletedWorkout ? (
            <button
              type="button"
              onClick={() => setSelectedAssignmentId(lastCompletedWorkout.id)}
              className="bg-surface-container-highest rounded-lg overflow-hidden relative w-full text-left"
            >
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded-full">SON TAMAMLANDI</span>
              </div>
              <div className="p-6 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-28 h-28 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <Dumbbell className="h-10 w-10 text-on-surface-variant/30" />
                </div>
                <div className="flex-grow space-y-3 pt-1">
                  <div>
                    <h4 className="text-lg font-bold pr-24">{lastCompletedWorkout.templateName}</h4>
                    <p className="text-secondary text-sm font-medium">
                      {lastCompletedWorkout.exercises.length} egzersiz • {new Date(lastCompletedWorkout.scheduledFor).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Egzersiz</span>
                      <span className="text-xl font-black">{lastCompletedWorkout.exercises.length}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Durum</span>
                      <span className="text-xl font-black text-tertiary">✓ Tamam</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ) : null}

          {selectedDayAssignments.length > 0 ? (
            <div className="space-y-3">
              {selectedDayAssignments
                .slice()
                .sort((a, b) => {
                  const priority = { IN_PROGRESS: 0, SCHEDULED: 1, ABANDONED: 2, COMPLETED: 3 } as const;
                  const statusA = getStatus(a);
                  const statusB = getStatus(b);
                  return priority[statusA] - priority[statusB];
                })
                .map((assignment) => {
                  const assignmentStatus = getStatus(assignment);

                  return (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => setSelectedAssignmentId(assignment.id)}
                      className="bg-primary/5 rounded-lg border-l-4 border-primary p-6 relative overflow-hidden w-full text-left"
                    >
                      <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${assignmentStatus === "IN_PROGRESS" ? "bg-primary-container text-white" : assignmentStatus === "COMPLETED" ? "bg-secondary text-white" : assignmentStatus === "ABANDONED" ? "bg-tertiary text-white" : "bg-primary text-white"}`}>
                              {assignmentStatus === "IN_PROGRESS" ? "DEVAM EDIYOR" : assignmentStatus === "COMPLETED" ? "TAMAMLANDI" : assignmentStatus === "ABANDONED" ? "YARIDA" : "PLANLI"}
                            </span>
                            <h4 className="text-xl font-black mt-2 truncate">{assignment.templateName}</h4>
                            <p className="text-slate-500 text-sm">
                              {assignment.exercises.length} egzersiz • {new Date(assignment.scheduledFor).toLocaleDateString("tr-TR")}
                            </p>
                          </div>
                          <span className="bg-primary-container text-primary px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap flex-shrink-0">DETAY</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-secondary">Koc tarafindan atandi</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-lg p-8 text-center space-y-2">
              <p className="font-bold text-on-surface-variant">Bu gün için antreman yok</p>
              <p className="text-sm text-on-surface-variant/60">Takvimden başka bir gün seçebilirsin</p>
            </div>
          )}
        </div>

        {/* RIGHT: Weekly load + reminders */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-on-surface text-surface rounded-lg p-6 space-y-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16" />
            <h3 className="text-lg font-black tracking-tight relative z-10">HAFTALIK YUK</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Bu Haftaki Antreman</span>
                <span className="text-2xl font-black text-primary-container">
                  {assignments.filter((a) => {
                    const d = new Date(a.scheduledFor);
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);
                    return d >= startOfWeek;
                  }).length}{" "}
                  <span className="text-xs">SEANS</span>
                </span>
              </div>
              <div className="w-full h-1 bg-surface/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (assignments.filter((a) => {
                      const d = new Date(a.scheduledFor);
                      const startOfWeek = new Date(now);
                      startOfWeek.setDate(now.getDate() - now.getDay());
                      startOfWeek.setHours(0, 0, 0, 0);
                      return d >= startOfWeek && getStatus(a) === "COMPLETED";
                    }).length / Math.max(1, assignments.filter((a) => {
                      const d = new Date(a.scheduledFor);
                      const startOfWeek = new Date(now);
                      startOfWeek.setDate(now.getDate() - now.getDay());
                      startOfWeek.setHours(0, 0, 0, 0);
                      return d >= startOfWeek;
                    }).length)) * 100)}%`
                  }}
                />
              </div>
              <p className="text-[10px] leading-relaxed opacity-60">
                {assignments.filter((a) => getStatus(a) === "COMPLETED").length} tamamlandi,{" "}
                {assignments.filter((a) => getStatus(a) === "SCHEDULED").length} planli.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-black tracking-tight text-secondary">YAKLASAN HATIRLATMALAR</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 hover:bg-surface-container rounded transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Haftalik Performans Kontrolu</p>
                  <p className="text-[10px] text-slate-400">Takvim uzerinden detaylandir</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 hover:bg-surface-container rounded transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <Utensils className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Beslenme Takibi</p>
                  <p className="text-[10px] text-slate-400">Gun sonuna kadar tamamla</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL */}
      {selectedAssignment ? (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center !mt-0"
          onClick={closeModal}
        >
          {/* Backdrop — fades in */}
          <div className={`absolute inset-0 bg-black/60 transition-[opacity,backdrop-filter] duration-300 ease-out ${modalVisible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-none"}`} />

          {/* Sheet — slides up on mobile, scales up on desktop */}
          <div
            className={`relative w-full max-w-lg md:mx-6 bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden transition-all duration-300 ease-out ${
              modalVisible
                ? "translate-y-0 opacity-100 md:scale-100"
                : "translate-y-full opacity-0 md:translate-y-4 md:scale-95"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-outline-variant" />
            </div>

            {/* Header */}
            <div className="px-6 pt-4 pb-5 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      getStatus(selectedAssignment) === "COMPLETED"
                        ? "bg-tertiary/15 text-tertiary"
                        : getStatus(selectedAssignment) === "IN_PROGRESS"
                          ? "bg-primary-container/20 text-primary"
                          : "bg-secondary/10 text-secondary"
                    }`}>
                      {getStatus(selectedAssignment) === "COMPLETED" ? "✓ Tamamlandi" : getStatus(selectedAssignment) === "IN_PROGRESS" ? "● Devam Ediyor" : "○ Planli"}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">{new Date(selectedAssignment.scheduledFor).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-on-surface leading-tight truncate">
                    {selectedAssignment.templateName}
                  </h2>
                  <p className="text-sm text-on-surface-variant">{selectedAssignment.exercises.length} egzersiz</p>
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant"
                  onClick={closeModal}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="h-px bg-outline-variant/20 flex-shrink-0 mx-6" />

            {/* Exercise list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {selectedAssignment.exercises
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((exercise, index) => (
                  <div key={exercise.id} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${exercise.exercise.type === "CARDIO" ? "bg-secondary/10" : "bg-primary/10"}`}>
                      {exercise.exercise.type === "CARDIO" ? (
                        <Timer className="h-4 w-4 text-secondary" />
                      ) : (
                        <Dumbbell className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-on-surface truncate">
                        <span className="text-on-surface-variant/40 mr-1 font-normal">{index + 1}.</span>
                        {exercise.exercise.name}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">{exercise.exercise.type === "CARDIO" ? "Kardiyo" : "Kuvvet"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {exercise.exercise.type === "CARDIO" ? (
                        <p className="font-bold text-sm text-secondary">{exercise.durationMinutes ?? "—"} dk</p>
                      ) : (
                        <>
                          <p className="font-bold text-sm text-primary">{exercise.targetSets ?? "—"} × {exercise.targetReps ?? "—"}</p>
                          <p className="text-[10px] text-on-surface-variant">set × tekrar</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}

              <div className="flex gap-2.5 items-start p-3 rounded-2xl bg-surface-container-low mt-1">
                <Info className="h-4 w-4 text-on-surface-variant/50 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-on-surface-variant">Ağır setler öncesinde ısınmanı tamamla ve teknik formu koru.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 flex-shrink-0">
              {getStatus(selectedAssignment) !== "COMPLETED" ? (
                <a
                  href={`/client/workout/${selectedAssignment.id}/start`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-sm text-white uppercase tracking-widest active:scale-95 transition-transform"
                >
                  <Play className="h-4 w-4 fill-current" />
                  {getStatus(selectedAssignment) === "IN_PROGRESS" ? "Devam Et" : "Şimdi Başlat"}
                </a>
              ) : (
                <Link href={`/client/workouts/${selectedAssignment.id}`} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-container py-4">
                  <span className="font-bold text-sm text-tertiary">✓ Bu seans tamamlandı</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
