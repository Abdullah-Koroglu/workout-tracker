"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ActionMenu } from "@/components/ui/action-menu";
import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";

type TemplateItem = {
  id: string;
  name: string;
  exerciseCount: number;
};

export function TemplatesGrid({ templates }: { templates: TemplateItem[] }) {
  const router = useRouter();
  const { confirm } = useConfirmation();
  const { push } = useNotificationContext();

  const deleteTemplate = async (id: string) => {
    const approved = await confirm({
      title: "Template sil",
      description: "Bu template silinecek. Islem geri alinamaz.",
      confirmText: "Sil",
      cancelText: "Vazgec",
      danger: true
    });

    if (!approved) return;

    const response = await fetch(`/api/coach/templates/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      push("Template silinemedi.", "error");
      return;
    }

    push("Template silindi.", "success");
    router.refresh();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <div key={template.id} className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-foreground">{template.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{template.exerciseCount} egzersiz</p>
            </div>
            <ActionMenu
              items={[
                {
                  label: "Düzenle",
                  onClick: () => router.push(`/coach/templates/${template.id}/edit`)
                },
                {
                  label: "Sil",
                  danger: true,
                  onClick: () => {
                    void deleteTemplate(template.id);
                  }
                }
              ]}
            />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3 text-sm font-medium">
              <Link href={`/coach/templates/${template.id}/edit`} className="text-primary hover:opacity-80">
                Düzenle
              </Link>
              <Link href={`/coach/templates/${template.id}/assign`} className="text-secondary hover:opacity-80">
                Ata
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
