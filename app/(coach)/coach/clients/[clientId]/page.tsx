import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart2, MessageCircle, Plus } from "lucide-react";

import { AssignmentList } from "@/components/coach/AssignmentList";
import { AssignTemplateModal } from "@/components/coach/AssignTemplateModal";
import { CoachClientActionsMenu } from "@/components/coach/CoachClientActionsMenu";
import { WorkoutHistoryPanel } from "@/components/coach/WorkoutHistoryPanel";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function ClientAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
      style={{
        width: 56,
        height: 56,
        fontSize: 20,
        background: "linear-gradient(135deg, #FB923C, #EA580C)",
        boxShadow: "0 2px 8px #F9731644",
      }}
    >
      {initials}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-bold uppercase tracking-wider px-0.5 mb-2"
      style={{ color: "#94A3B8" }}
    >
      {children}
    </div>
  );
}

export default async function CoachClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  const { clientId } = await params;
  const qp = await searchParams;
  const currentPage = Number.isFinite(Number(qp.page)) && Number(qp.page) > 0 ? Number(qp.page) : 1;
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const relation = await prisma.coachClientRelation.findFirst({
    where: { coachId: session?.user.id, clientId, status: "ACCEPTED" },
  });
  if (!relation) return notFound();

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    include: {
      assignments: {
        where: {
          scheduledFor: { gte: today },
          workouts: { none: {} },
        },
        include: {
          template: true,
          _count: { select: { workouts: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!client) return notFound();

  const [workouts, totalWorkouts] = await Promise.all([
    prisma.workout.findMany({
      where: { clientId },
      include: {
        template: true,
        assignment: {
          select: {
            id: true,
            scheduledFor: true,
            createdAt: true,
            assignedBy: true
          }
        },
        sets: {
          include: {
            exercise: {
              select: {
                name: true,
                type: true
              }
            }
          },
          orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }]
        },
        comments: {
          include: {
            author: { select: { name: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { startedAt: "desc" },
      skip,
      take: pageSize
    }),
    prisma.workout.count({ where: { clientId } })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalWorkouts / pageSize));

  const completedCount = await prisma.workout.count({
    where: { clientId, status: "COMPLETED" }
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Hero Header */}
      <section
        className="rounded-[18px] px-5 py-5"
        style={{
          background: "#1A365D",
          boxShadow: "0 4px 24px rgba(26,54,93,0.25)",
        }}
      >
        <div className="flex items-center gap-4">
          <ClientAvatar name={client.name} />
          <div className="flex-1 min-w-0">
            <h1
              className="text-[20px] font-black truncate"
              style={{ color: "#fff", letterSpacing: -0.5 }}
            >
              {client.name}
            </h1>
            <p className="text-[13px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
              {client.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-[11px] font-bold rounded-full px-2.5 py-1"
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
              >
                {completedCount}/{totalWorkouts} tamamlandı
              </span>
              <span
                className="text-[11px] font-bold rounded-full px-2.5 py-1"
                style={{ background: "#F9731630", color: "#FED7AA" }}
              >
                {client.assignments.length} bekleyen atama
              </span>
            </div>
          </div>
          <CoachClientActionsMenu clientId={client.id} />
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/coach/clients/${client.id}/progress`}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-colors"
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            İlerleme
          </Link>
          <Link
            href="/coach/messages"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-colors"
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Mesaj
          </Link>
          <div className="ml-auto">
            <AssignTemplateModal clientId={client.id} />
          </div>
        </div>
      </section>

      {/* Upcoming Assignments */}
      <section>
        <SectionLabel>Atanmış Template&apos;ler</SectionLabel>
        <AssignmentList
          assignments={client.assignments.map((a) => ({
            id: a.id,
            templateId: a.templateId,
            templateName: a.template.name,
            createdAt: a.createdAt.toISOString(),
            scheduledFor: a.scheduledFor.toISOString(),
            workoutsCount: a._count.workouts,
          }))}
        />
      </section>

      {/* Workout History */}
      <section>
        <SectionLabel>Son Antrenmanlar</SectionLabel>
        <WorkoutHistoryPanel
          workouts={workouts.map((w) => ({
            id: w.id,
            startedAt: w.startedAt.toISOString(),
            finishedAt: w.finishedAt ? w.finishedAt.toISOString() : null,
            intensityScore: w.intensityScore,
            assignment: {
              id: w.assignment.id,
              scheduledFor: w.assignment.scheduledFor.toISOString(),
              createdAt: w.assignment.createdAt.toISOString()
            },
            durationMinutes:
              w.finishedAt
                ? Math.round(
                    (w.finishedAt.getTime() - w.startedAt.getTime()) / 60000
                  )
                : null,
            status: w.status,
            sets: w.sets.map((s) => ({
              id: s.id,
              setNumber: s.setNumber,
              weightKg: s.weightKg,
              reps: s.reps,
              rir: s.rir,
              durationMinutes: s.durationMinutes,
              durationSeconds: s.durationSeconds,
              completed: s.completed,
              exercise: { name: s.exercise.name, type: s.exercise.type },
            })),
            comments: w.comments.map((c) => ({
              id: c.id,
              content: c.content,
              createdAt: c.createdAt.toISOString(),
              author: { name: c.author.name },
            })),
            template: {
              name: w.template.name,
              description: w.template.description
            }
          }))}
        />
        <div className="mt-3">
          <PaginationControls
            basePath={`/coach/clients/${clientId}`}
            currentPage={Math.min(currentPage, totalPages)}
            totalPages={totalPages}
          />
        </div>
      </section>
    </div>
  );
}
