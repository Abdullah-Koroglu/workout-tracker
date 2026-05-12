import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TemplateForm } from "@/components/coach/TemplateForm";
import { prisma } from "@/lib/prisma";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await prisma.workoutTemplate.findUnique({
    where: { id },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: "asc" }
      },
      category: true
    }
  });

  if (!template) return notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/coach/templates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Antrenmanlara geri dön
      </Link>

      <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Antrenman Yönetimi
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          Antrenman Düzenle
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Egzersizleri sürükle-bırak ile sırala, kardiyo protokollerini düzenle.
        </p>
      </div>

      <TemplateForm
        endpoint={`/api/coach/templates/${id}`}
        initialValues={{
          name: template.name,
          description: template.description || "",
          categoryId: template.categoryId ?? null,
          exercises: template.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            exerciseType: e.exercise.type,
            order: e.order,
            targetSets: e.targetSets ?? null,
            targetReps: e.targetReps ?? null,
            targetRir: e.targetRir ?? null,
            durationMinutes: e.durationMinutes ?? null,
            protocol: (
              e.protocol as Array<
                { durationMinutes?: number; minute?: number; speed: number; incline: number }
              > | null
            )?.map((row) => ({
              durationMinutes: Number.isFinite(Number(row.durationMinutes))
                ? Number(row.durationMinutes)
                : Number.isFinite(Number(row.minute))
                ? Number(row.minute)
                : 1,
              speed: row.speed,
              incline: row.incline
            })) ?? null
          }))
        }}
      />
    </div>
  );
}
