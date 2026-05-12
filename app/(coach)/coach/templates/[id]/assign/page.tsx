import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TemplateAssignBoard } from "@/components/coach/TemplateAssignBoard";

export default async function AssignTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "COACH") return null;

  const { id } = await params;

  const [template, relations, assignments] = await Promise.all([
    prisma.workoutTemplate.findFirst({
      where: { id, coachId: session.user.id },
      include: { exercises: true },
    }),
    prisma.coachClientRelation.findMany({
      where: { coachId: session.user.id, status: "ACCEPTED" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.templateAssignment.findMany({
      where: { templateId: id },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { workouts: true } },
      },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  if (!template) return notFound();

  const clients = relations.map((r) => ({
    id: r.client.id,
    name: r.client.name,
    email: r.client.email,
  }));

  const assignmentItems = assignments.map((a) => ({
    id: a.id,
    clientId: a.client.id,
    clientName: a.client.name,
    scheduledFor: a.scheduledFor.toISOString(),
    workoutCount: a._count.workouts,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/coach/templates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Antrenman listesine dön
        </Link>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Program Ata</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{template.name}</h1>
        <p className="text-sm text-muted-foreground">
          {template.exercises.length} egzersiz içeren bu programı client rosterına tarih bazlı ata.
        </p>
      </div>

      <TemplateAssignBoard templateId={template.id} clients={clients} assignments={assignmentItems} />
    </div>
  );
}
