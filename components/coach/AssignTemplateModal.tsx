"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";

type TemplateItem = {
  id: string;
  name: string;
  description: string | null;
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

  useEffect(() => {
    if (!open) return;

    const loadTemplates = async () => {
      setLoading(true);
      const response = await fetch("/api/coach/templates");
      const data = await response.json();
      setTemplates((data.templates || []).map((template: TemplateItem) => ({
        id: template.id,
        name: template.name,
        description: template.description || null
      })));
      setLoading(false);
    };

    loadTemplates();
  }, [open]);

  const assignTemplate = async (templateId: string) => {
    const approved = await confirm({
      title: "Template atamasi",
      description: "Template'i secilen tarihle client'a atamak istediginize emin misiniz?",
      confirmText: "Ata",
      cancelText: "Vazgec"
    });

    if (!approved) {
      return;
    }

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

  return (
    <div>
      <Button type="button" onClick={() => setOpen(true)}>
        Template Ata
      </Button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Template Seç</h2>
                <p className="text-xs text-muted-foreground">Client için tarih bazlı atama planla.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Kapat
              </Button>
            </div>

            <div className="mb-4 rounded-xl border p-3">
              <label className="text-sm font-medium">Antrenman günü</label>
              <input
                type="date"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Bu assignment tek kullanımlıktır. Seçilen gün dışında başlatılamaz.
              </p>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Template'ler yükleniyor...</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Atanacak template yok.</p>
            ) : (
              <div className="grid gap-3">
                {templates.map((template) => (
                  <div key={template.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{template.name}</p>
                      <p className="text-sm text-muted-foreground">{template.description || "Açıklama yok"}</p>
                    </div>
                    <Button
                      type="button"
                      disabled={submittingId === template.id}
                      onClick={() => assignTemplate(template.id)}
                    >
                      Ata
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
