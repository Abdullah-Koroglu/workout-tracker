"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, Dumbbell, Flame, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";

type ExerciseInTemplate = {
  id: string;
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  durationMinutes: number | null;
  exercise: { name: string; type: "WEIGHT" | "CARDIO" };
};

type TemplateItem = {
  id: string;
  name: string;
  description: string | null;
  exercises: ExerciseInTemplate[];
};

export function AssignTemplateModal({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { push } = useNotificationContext();
  const { confirm } = useConfirmation();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState(() => new Date().toISOString().slice(0, 10));
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const loadTemplates = async () => {
      setLoading(true);
      const response = await fetch("/api/coach/templates");
      const data = await response.json();
      setTemplates(data.templates || []);
      setLoading(false);
    };

    loadTemplates();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    setExpandedId(null);
  };

  const assignTemplate = async (templateId: string, templateName: string) => {
    const approved = await confirm({
      title: "Template atamasi",
      description: `"${templateName}" şablonunu ${scheduledFor} tarihine atamak istediğinize emin misiniz?`,
      confirmText: "Ata",
      cancelText: "Vazgec"
    });

    if (!approved) return;

    setSubmittingId(templateId);
    const response = await fetch(`/api/coach/templates/${templateId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, scheduledFor })
    });
    setSubmittingId(null);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      push(data.error || "Template atanamadı.");
      return;
    }

    push("Template client'a atandı.");
    setOpen(false);
    router.refresh();
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(query.toLowerCase())
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Button type="button" onClick={handleOpen} className="gap-2">
        <CalendarDays className="h-4 w-4" />
        Template Ata
      </Button>

      {open && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center p-0 sm:p-4"
          onMouseDown={(e) => {
            if (e.target === backdropRef.current) setOpen(false);
          }}
        >
          <div className="flex w-full flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl sm:max-w-2xl sm:rounded-2xl max-h-[92dvh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-bold sm:text-lg">Template Seç</h2>
                <p className="text-xs text-muted-foreground">Client için tarih bazlı atama planla</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Date Picker */}
            <div className="border-b bg-muted/30 px-5 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                  <span>Antrenman Günü</span>
                </div>
                <input
                  type="date"
                  value={scheduledFor}
                  min={todayStr}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="h-9 flex-1 rounded-lg border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-muted-foreground">Tek kullanım · Bu gün dışında başlatılamaz</span>
              </div>
            </div>

            {/* Search */}
            <div className="border-b px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Template ara..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border bg-muted/40 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Template List */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {loading ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Dumbbell className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {query ? "Arama sonucu bulunamadı" : "Atanacak template yok"}
                  </p>
                </div>
              ) : (
                filtered.map((template) => {
                  const weightCount = template.exercises.filter((e) => e.exercise.type === "WEIGHT").length;
                  const cardioCount = template.exercises.filter((e) => e.exercise.type === "CARDIO").length;
                  const isExpanded = expandedId === template.id;

                  return (
                    <div
                      key={template.id}
                      className="overflow-hidden rounded-xl border bg-card transition-all"
                    >
                      <div className="flex items-start gap-3 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm leading-tight">{template.name}</p>
                            <div className="flex gap-1">
                              {weightCount > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                  <Dumbbell className="h-2.5 w-2.5" />
                                  {weightCount}
                                </span>
                              )}
                              {cardioCount > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                                  <Flame className="h-2.5 w-2.5" />
                                  {cardioCount}
                                </span>
                              )}
                            </div>
                          </div>
                          {template.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : template.id)}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900"
                          >
                            {isExpanded ? "Gizle" : `${template.exercises.length} egzersiz göster`}
                            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={submittingId === template.id}
                          onClick={() => assignTemplate(template.id, template.name)}
                          className="shrink-0"
                        >
                          {submittingId === template.id ? "Atanıyor..." : "Ata"}
                        </Button>
                      </div>

                      {/* Expanded exercise list */}
                      {isExpanded && (
                        <div className="border-t bg-muted/30 px-4 py-3">
                          <div className="space-y-1.5">
                            {template.exercises
                              .slice()
                              .sort((a, b) => a.order - b.order)
                              .map((ex) => (
                                <div key={ex.id} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    {ex.exercise.type === "CARDIO" ? (
                                      <Flame className="h-3 w-3 text-orange-500 shrink-0" />
                                    ) : (
                                      <Dumbbell className="h-3 w-3 text-blue-500 shrink-0" />
                                    )}
                                    <span className="text-foreground font-medium">{ex.exercise.name}</span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    {ex.exercise.type === "CARDIO"
                                      ? `${ex.durationMinutes ?? "-"} dk`
                                      : `${ex.targetSets ?? "-"}×${ex.targetReps ?? "-"}`}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-5 py-3">
              <p className="text-xs text-muted-foreground text-center">
                {filtered.length} template listeleniyor{query ? ` · "${query}" araması` : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
