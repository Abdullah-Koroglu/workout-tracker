"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, X } from "lucide-react";

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
      title: "Atamayı iptal et",
      description: "Bu atamayı iptal etmek istediğinize emin misiniz?",
      confirmText: "İptal et",
      cancelText: "Vazgeç",
      danger: true,
    });
    if (!approved) return;

    setBusyAssignmentId(assignment.id);
    const response = await fetch(`/api/coach/templates/${assignment.templateId}/assign`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: assignment.id }),
    });
    const data = await response.json().catch(() => ({}));
    setBusyAssignmentId(null);

    if (!response.ok) { push(data.error || "Atama iptal edilemedi."); return; }
    push("Atama iptal edildi.");
    router.refresh();
  };

  if (assignments.length === 0) {
    return (
      <div
        className="rounded-[18px] p-6 text-center text-sm"
        style={{
          background: "#F8FAFC",
          border: "1.5px dashed #E2E8F0",
          color: "#94A3B8",
        }}
      >
        Bu danışana henüz template atanmadı.
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayItems = assignments.filter((a) => {
    const d = new Date(a.scheduledFor);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const overdueItems = assignments.filter((a) => {
    const d = new Date(a.scheduledFor);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  });

  const upcomingItems = assignments.filter((a) => {
    const d = new Date(a.scheduledFor);
    d.setHours(0, 0, 0, 0);
    return d.getTime() > today.getTime();
  });

  const groupByDate = (items: AssignmentItem[]) =>
    items.reduce<Record<string, AssignmentItem[]>>((acc, a) => {
      const key = new Intl.DateTimeFormat("en-CA").format(new Date(a.scheduledFor));
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    }, {});

  const renderGroup = (items: AssignmentItem[]) => {
    const groups = groupByDate(items);
    const keys = Object.keys(groups).sort();
    if (!keys.length) return null;
    return (
      <div className="flex flex-col gap-2.5">
        {keys.map((dateKey) => {
          const date = new Date(dateKey);
          const weekday = date.toLocaleDateString("tr-TR", { weekday: "long" });
          const formatted = date.toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "long",
          });
          return (
            <div
              key={dateKey}
              className="rounded-[18px] overflow-hidden"
              style={{
                background: "#fff",
                boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {/* Date Header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid #F1F5F9" }}
              >
                <span
                  className="text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: "#DC2626" }}
                >
                  {weekday}
                </span>
                <span className="text-[13px] font-black" style={{ color: "#1E293B" }}>
                  {formatted}
                </span>
              </div>
              {/* Items */}
              <div className="flex flex-col">
                {groups[dateKey].map((a, i) => {
                  const canCancel = a.workoutsCount === 0;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        borderTop: i > 0 ? "1px solid #F1F5F9" : "none",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                        style={{ background: "#EF4444" + "18" }}
                      >
                        <CalendarDays className="w-4 h-4" style={{ color: "#EF4444" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[14px] font-bold truncate"
                          style={{ color: "#1E293B" }}
                        >
                          {a.templateName}
                        </div>
                        <div className="text-[11px]" style={{ color: "#94A3B8" }}>
                          Atandı: {new Date(a.createdAt).toLocaleDateString("tr-TR")}
                        </div>
                      </div>
                      {canCancel && (
                        <button
                          onClick={() => cancelAssignment(a)}
                          disabled={busyAssignmentId === a.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                          style={{ background: "#EF444415", color: "#EF4444" }}
                          title="İptal et"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
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
    <div className="flex flex-col gap-4">
      {overdueItems.length > 0 && (
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-2"
            style={{ color: "#DC2626" }}
          >
            Geciken
          </div>
          {renderGroup(overdueItems)}
        </div>
      )}
      {todayItems.length > 0 && (
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-2"
            style={{ color: "#DC2626" }}
          >
            Bugün
          </div>
          {renderGroup(todayItems)}
        </div>
      )}
      {upcomingItems.length > 0 && (
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-2"
            style={{ color: "#DC2626" }}
          >
            Gelecek
          </div>
          {renderGroup(upcomingItems)}
        </div>
      )}
    </div>
  );
}
