import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClientAssignmentsCalendar } from "@/components/client/ClientAssignmentsCalendar";

export const dynamic = "force-dynamic";

export default async function ClientCalendarPage() {
  const session = await auth();
  const clientId = session?.user.id || "";

  const assignments = await prisma.templateAssignment.findMany({
    where: { clientId },
    include: {
      template: {
        include: {
          exercises: {
            include: {
              exercise: true
            },
            orderBy: {
              order: "asc"
            }
          }
        }
      },
      workouts: {
        select: { status: true }
      }
    },
    orderBy: { scheduledFor: "desc" }
  });

  const items = assignments.map((assignment) => ({
    id: assignment.id,
    templateName: assignment.template.name,
    scheduledFor: assignment.scheduledFor.toISOString(),
    isOneTime: assignment.isOneTime,
    workoutStatuses: assignment.workouts.map((w) => w.status),
    exercises: assignment.template.exercises.map((exercise) => ({
      id: exercise.id,
      order: exercise.order,
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      durationMinutes: exercise.durationMinutes,
      exercise: {
        name: exercise.exercise.name,
        type: exercise.exercise.type
      }
    }))
  }));

  return <ClientAssignmentsCalendar assignments={items} />;
}
