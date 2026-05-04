import { TemplatesPageClient } from "@/components/coach/TemplatesPageClient";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export default async function CoachTemplatesPage() {
  const auth = await requireAuth("COACH");
  if (auth.error) return null;

  const [templates, categories] = await Promise.all([
    prisma.workoutTemplate.findMany({
      where: { coachId: auth.session.user.id },
      include: { exercises: true, category: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.templateCategory.findMany({
      where: { coachId: auth.session.user.id },
      orderBy: { createdAt: "asc" }
    })
  ]);

  return (
    <TemplatesPageClient
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        exerciseCount: t.exercises.length,
        category: t.category
          ? { id: t.category.id, name: t.category.name, color: t.category.color }
          : null
      }))}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color
      }))}
    />
  );
}
