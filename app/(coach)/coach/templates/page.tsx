import Link from "next/link";

import { TemplatesGrid } from "@/components/coach/TemplatesGrid";
import { prisma } from "@/lib/prisma";

export default async function CoachTemplatesPage() {
  const templates = await prisma.workoutTemplate.findMany({
    include: { exercises: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Template Yönetimi</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Template'ler</h1>
            <p className="mt-2 text-sm text-slate-600">Antrenman şablonlarını düzenle, kopyala ve client'lara ata.</p>
          </div>
          <Link href="/coach/templates/new" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Yeni Template
          </Link>
        </div>
      </div>

      <TemplatesGrid
        templates={templates.map((template) => ({
          id: template.id,
          name: template.name,
          exerciseCount: template.exercises.length
        }))}
      />
    </div>
  );
}
