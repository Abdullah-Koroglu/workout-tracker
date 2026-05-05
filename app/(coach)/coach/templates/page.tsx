import { TemplatesPageClient } from "@/components/coach/TemplatesPageClient";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { getCoachTier } from "@/lib/feature-access";
import { TIER_CONFIG } from "@/lib/tier-limits";

export default async function CoachTemplatesPage() {
  const auth = await requireAuth("COACH");
  if (auth.error) return null;

  const coachId = auth.session.user.id;

  const [templates, categories, tier] = await Promise.all([
    prisma.workoutTemplate.findMany({
      where: { coachId },
      include: { exercises: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.templateCategory.findMany({
      where: { coachId },
      orderBy: { createdAt: "asc" },
    }),
    getCoachTier(coachId),
  ]);

  const cfg = TIER_CONFIG[tier];
  const maxTemplates = cfg.maxTemplates === Infinity ? null : cfg.maxTemplates;
  const canAdd = maxTemplates === null || templates.length < maxTemplates;

  return (
    <TemplatesPageClient
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        exerciseCount: t.exercises.length,
        category: t.category
          ? { id: t.category.id, name: t.category.name, color: t.category.color }
          : null,
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
      templateCount={templates.length}
      maxTemplates={maxTemplates}
      canAdd={canAdd}
      tier={tier}
    />
  );
}
