"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Plus } from "lucide-react";

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
      title: "Şablon sil",
      description: "Bu şablon silinecek. İşlem geri alınamaz.",
      confirmText: "Sil",
      cancelText: "Vazgeç",
      danger: true,
    });

    if (!approved) return;

    const response = await fetch(`/api/coach/templates/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      push("Şablon silinemedi.", "error");
      return;
    }

    push("Şablon silindi.", "success");
    router.refresh();
  };

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Dumbbell className="h-7 w-7" />
        </div>
        <p className="text-base font-black text-slate-700">İlk antrenman şablonunu oluştur</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Koçların satış demosunda en hızlı değer gösteren adım hazır bir programdır. İlk şablonu oluştur, sonra danışanına tek tıkla ata.
        </p>
        <Link
          href="/coach/templates/new"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Yeni Şablon Oluştur
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          {template.category && (
            <div
              className="mb-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: `${template.category.color}20`,
                color: template.category.color,
                border: `1px solid ${template.category.color}40`,
              }}
            >
              {template.category.name}
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold leading-tight text-slate-900">{template.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">{template.exerciseCount} egzersiz</p>
            </div>
            <ActionMenu
              items={[
                {
                  label: "Düzenle",
                  onClick: () => router.push(`/coach/templates/${template.id}/edit`),
                },
                {
                  label: "Sil",
                  danger: true,
                  onClick: () => {
                    void deleteTemplate(template.id);
                  },
                },
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
