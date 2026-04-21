"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";

type ClientItem = {
  id: string;
  name: string;
  email: string;
};

type AssignmentItem = {
  id: string;
  clientId: string;
  clientName: string;
  scheduledFor: string;
  workoutCount: number;
};

export function TemplateAssignBoard({
  templateId,
  clients,
  assignments,
}: {
  templateId: string;
  clients: ClientItem[];
  assignments: AssignmentItem[];
}) {
  const router = useRouter();
  const { success, error } = useNotificationContext();
  const [query, setQuery] = useState("");
  const [busyClientId, setBusyClientId] = useState<string | null>(null);
  const [busyAssignmentId, setBusyAssignmentId] = useState<string | null>(null);
  const [datesByClient, setDatesByClient] = useState<Record<string, string>>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const map: Record<string, string> = {};
    for (const c of clients) map[c.id] = today;
    return map;
  });

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clients, query]);

  const assign = async (clientId: string) => {
    const scheduledFor = datesByClient[clientId];
    if (!scheduledFor) {
      error("Lütfen tarih seçin.");
      return;
    }

    setBusyClientId(clientId);
    const res = await fetch(`/api/coach/templates/${templateId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, scheduledFor }),
    });
    setBusyClientId(null);

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      error(data.error ?? "Atama yapılamadı.");
      return;
    }

    success("Template atandı.");
    router.refresh();
  };

  const cancelAssignment = async (assignmentId: string) => {
    setBusyAssignmentId(assignmentId);
    const res = await fetch(`/api/coach/templates/${templateId}/assign`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId }),
    });
    setBusyAssignmentId(null);

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      error(data.error ?? "Atama iptal edilemedi.");
      return;
    }

    success("Atama iptal edildi.");
    router.refresh();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <section className="space-y-4 rounded-xl bg-card p-4 shadow-sm ring-1 ring-black/5 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black tracking-tight">Client Seç ve Ata</h2>
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-foreground">
            {clients.length} client
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Client ara..."
            className="h-10 w-full rounded-lg border-0 bg-muted/60 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          {filteredClients.length === 0 ? (
            <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">Sonuç bulunamadı.</div>
          ) : (
            filteredClients.map((client) => (
              <div key={client.id} className="rounded-lg bg-muted/30 p-3 ring-1 ring-black/5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{client.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{client.email}</p>
                  </div>

                  <div className="flex w-full items-center gap-2 md:w-auto">
                    <div className="relative flex-1 md:w-[170px] md:flex-none">
                      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={datesByClient[client.id] ?? ""}
                        onChange={(e) => setDatesByClient((prev) => ({ ...prev, [client.id]: e.target.value }))}
                        className="h-9 w-full rounded-md border-0 bg-background pl-8 pr-2 text-xs ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={busyClientId === client.id}
                      onClick={() => assign(client.id)}
                      className="h-9 px-3 text-xs"
                    >
                      {busyClientId === client.id ? "Atanıyor..." : "Ata"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-xl bg-card p-4 shadow-sm ring-1 ring-black/5 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black tracking-tight">Planlanan Atamalar</h2>
          <span className="rounded-full bg-secondary/20 px-2.5 py-1 text-xs font-semibold text-secondary">
            {assignments.length}
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">Bu template için henüz atama yok.</div>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="rounded-lg bg-muted/30 p-3 ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{a.clientName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.scheduledFor).toLocaleDateString("tr-TR")}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {a.workoutCount > 0 ? "Başlamış antrenman var" : "Henüz başlanmadı"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busyAssignmentId === a.id || a.workoutCount > 0}
                    onClick={() => cancelAssignment(a.id)}
                    className="h-8 px-2 text-xs text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
