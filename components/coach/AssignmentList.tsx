"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";

type AssignmentItem = {
  id: string;
  templateId: string;
  templateName: string;
  createdAt: string;
  scheduledFor: string;
  workoutsCount: number;
};

export function AssignmentList({ assignments }: { assignments: AssignmentItem[] }) {
  const router = useRouter();
  const { push } = useNotificationContext();
  const { confirm } = useConfirmation();
  const [busyAssignmentId, setBusyAssignmentId] = useState<string | null>(null);

  const cancelAssignment = async (assignment: AssignmentItem) => {
    const approved = await confirm({
      title: "Atamayi iptal et",
      description: "Bu atamayi iptal etmek istediginize emin misiniz?",
      confirmText: "Iptal et",
      cancelText: "Vazgec",
      danger: true
    });

    if (!approved) {
      return;
    }

    setBusyAssignmentId(assignment.id);

    const response = await fetch(`/api/coach/templates/${assignment.templateId}/assign`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: assignment.id })
    });
    const data = await response.json().catch(() => ({}));
    setBusyAssignmentId(null);

    if (!response.ok) {
      push(data.error || "Assignment iptal edilemedi.");
      return;
    }

    push("Assignment iptal edildi.");
    router.refresh();
  };

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        Bu client'a henüz template atanmadı.
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAssignments = assignments.filter((assignment) => {
    const date = new Date(assignment.scheduledFor);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  });

  const upcomingAssignments = assignments.filter((assignment) => {
    const date = new Date(assignment.scheduledFor);
    date.setHours(0, 0, 0, 0);
    return date.getTime() > today.getTime();
  });

const groupByDate = (items: AssignmentItem[]) => {
  return items.reduce<Record<string, AssignmentItem[]>>((acc, assignment) => {
    const d = new Date(assignment.scheduledFor);
    
    const key = new Intl.DateTimeFormat('en-CA').format(d);

    if (!acc[key]) acc[key] = [];
    acc[key].push(assignment);
    return acc;
  }, {});
};

  const renderCalendar = (items: AssignmentItem[]) => {
    const groups = groupByDate(items);
    const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    if (!keys.length) {
      return <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Atama yok.</div>;
    }

    return (
      <div className="space-y-4 overflow-y-auto">
        {keys.map((dateKey) => {
          const date = new Date(dateKey);
          return (
            <div key={dateKey} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b pb-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  {date.toLocaleDateString("tr-TR", { weekday: "long" })}
                </p>
                <p className="text-lg font-black text-foreground">
                  {date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}
                </p>
              </div>

              <div className="space-y-2">
                {groups[dateKey].map((assignment) => {
                  const canCancel = assignment.workoutsCount === 0;
                  return (
                    <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                      <div>
                        <p className="text-base font-bold text-foreground">{assignment.templateName}</p>
                        <p className="text-xs text-muted-foreground">
                          Atama: {new Date(assignment.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        disabled={!canCancel || busyAssignmentId === assignment.id}
                        onClick={() => cancelAssignment(assignment)}
                      >
                        İptal
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Bugün</h3>
        {todayAssignments.length ? renderCalendar(todayAssignments) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Bugün için atama yok.</div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Gelecek</h3>
        {upcomingAssignments.length ? renderCalendar(upcomingAssignments) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Gelecek günler için atama yok.</div>
        )}
      </section>
    </div>
  );
}