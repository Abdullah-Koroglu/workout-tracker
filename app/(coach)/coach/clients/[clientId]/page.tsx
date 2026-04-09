import Link from "next/link";
import { notFound } from "next/navigation";

import { AssignmentList } from "@/components/coach/AssignmentList";
import { AssignTemplateModal } from "@/components/coach/AssignTemplateModal";
import { CoachClientActionsMenu } from "@/components/coach/CoachClientActionsMenu";
import { WorkoutHistoryPanel } from "@/components/coach/WorkoutHistoryPanel";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CoachClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const session = await auth();
  const { clientId } = await params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const relation = await prisma.coachClientRelation.findFirst({
    where: {
      coachId: session?.user.id,
      clientId,
      status: "ACCEPTED"
    }
  });

  if (!relation) return notFound();

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    include: {
      assignments: {
        where: {
          scheduledFor: {
            gte: today
          },
          workouts: {
            none: {}
          }
        },
        include: {
          template: true,
          _count: {
            select: {
              workouts: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      workouts: {
        include: {
          template: true,
          sets: { include: { exercise: true }, orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }] },
          comments: { include: { author: true }, orderBy: { createdAt: "asc" } }
        },
        orderBy: { startedAt: "desc" },
        take: 10
      }
    }
  });

  if (!client) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-sm text-muted-foreground">{client.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CoachClientActionsMenu clientId={client.id} />
          <AssignTemplateModal clientId={client.id} />
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">Atanmış Template'ler</h2>
        <AssignmentList
          assignments={client.assignments.map((assignment) => ({
            id: assignment.id,
            templateId: assignment.templateId,
            templateName: assignment.template.name,
            createdAt: assignment.createdAt.toISOString(),
            scheduledFor: assignment.scheduledFor.toISOString(),
            workoutsCount: assignment._count.workouts
          }))}
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Geçmiş Antrenmanlar</h2>
        <WorkoutHistoryPanel workouts={client.workouts.map((workout) => ({
          id: workout.id,
          startedAt: workout.startedAt.toISOString(),
          finishedAt: workout.finishedAt ? workout.finishedAt.toISOString() : null,
          durationMinutes: workout.finishedAt ? Math.round((workout.finishedAt.getTime() - workout.startedAt.getTime()) / 60000) : null,
          status: workout.status,
          template: { name: workout.template.name },
          sets: workout.sets.map((setItem) => ({
            id: setItem.id,
            setNumber: setItem.setNumber,
            weightKg: setItem.weightKg,
            reps: setItem.reps,
            rir: setItem.rir,
            durationMinutes: setItem.durationMinutes,
            completed: setItem.completed,
            exercise: { name: setItem.exercise.name, type: setItem.exercise.type }
          })),
          comments: workout.comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
            author: { name: comment.author.name }
          }))
        }))} />
      </section>
    </div>
  );
}
