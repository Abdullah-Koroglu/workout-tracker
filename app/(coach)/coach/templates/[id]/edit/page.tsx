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
      }
    }
  });

  if (!template) return notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Template Düzenle</h1>
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
            protocol: (e.protocol as Array<{ minute: number; speed: number; incline: number }> | null) ?? null
          }))
        }}
      />
    </div>
  );
}
