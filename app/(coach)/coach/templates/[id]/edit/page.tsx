import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

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
      }
    }
  });

  if (!template) return notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/coach/templates"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Sablonlara geri don
      </Link>
      <div className="rounded-2xl border bg-card p-4">
        <h1 className="text-2xl font-bold">Template Duzenle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Egzersizleri surukle-birak ile siralayabilir, kardiyo protokollerini daha net yonetebilirsin.
        </p>
      </div>
      <TemplateForm
        endpoint={`/api/coach/templates/${id}`}
        initialValues={{
          name: template.name,
          description: template.description || "",
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
