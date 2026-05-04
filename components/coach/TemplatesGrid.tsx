"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ActionMenu } from "@/components/ui/action-menu";
import { useConfirmation } from "@/contexts/ConfirmationContext";
import { useNotificationContext } from "@/contexts/NotificationContext";

type CategoryItem = {
  id: string;
  name: string;
  color: string;
};

type TemplateItem = {
  id: string;
  name: string;
  exerciseCount: number;
  category?: CategoryItem | null;
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

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <div className="mb-3 text-4xl">📋</div>
        <p className="text-sm font-semibold text-slate-600">Henüz template yok</p>
        <p className="mt-1 text-xs text-slate-400">Yeni Template butonuyla ilk şablonunu oluştur.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md "
        >
          {template.category && (
            <div
              className="mb-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: template.category.color + "20",
                color: template.category.color,
                border: `1px solid ${template.category.color}40`
              }}
            >
              {template.category.name}
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-slate-900 leading-tight">{template.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">{template.exerciseCount} egzersiz</p>
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

          <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs font-semibold">
            <Link
              href={`/coach/templates/${template.id}/edit`}
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
            >
              Düzenle
            </Link>
            <span className="text-slate-200">·</span>
            <Link
              href={`/coach/templates/${template.id}/assign`}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700"
            >
              Ata
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
