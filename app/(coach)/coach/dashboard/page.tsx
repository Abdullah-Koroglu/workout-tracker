import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { DashboardActionMenu } from "@/components/coach/DashboardActionMenu";
import { QuotaWidget } from "@/components/coach/QuotaWidget";
import { ChurnAlerts } from "@/components/coach/ChurnAlerts";
import { CheckInManager } from "@/components/coach/CheckInManager";
import { NudgeAssistantCard } from "@/components/coach/NudgeAssistantCard";
import { CoachActionCenter } from "@/components/coach/CoachActionCenter";
import { CoachOnboardingChecklist } from "@/components/coach/CoachOnboardingChecklist";
import { WeeklyCoachDigestCard } from "@/components/coach/WeeklyCoachDigestCard";
import { SessionsPanel } from "@/components/shared/SessionsPanel";
import { CoachRevenuePanel } from "@/components/coach/CoachRevenuePanel";
import { auth } from "@/lib/auth";
import { getCoachAvatarUrl } from "@/lib/coach-avatar";
import { buildCoachWeeklyDigest } from "@/lib/coach-weekly-digest";
import { prisma } from "@/lib/prisma";

const RECENT_WORKOUT_LIMIT = 10;
const ACTIVE_WORKOUT_LIMIT = 10;
const REST_SAMPLE_LIMIT = 10;
const PENDING_REQUEST_LIMIT = 10;
const UPCOMING_APPOINTMENT_LIMIT = 10;
const ACTION_PREVIEW_LIMIT = 3;
const TOP_CLIENT_LIMIT = 10;
const TOP_CLIENT_WORKOUT_LIMIT = 10;

function Avatar({ name, imageUrl, size = 40, bg = "#1A365D" }: { name: string; imageUrl?: string | null; size?: number; bg?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        fontSize: size * 0.36,
        boxShadow: `0 2px 8px ${bg}44`,
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

export default async function CoachDashboardPage() {
  const session = await auth();
  const coachId = session?.user.id || "";
  const userName = session?.user.name || "Koc";
  const coachAvatarUrl = coachId ? await getCoachAvatarUrl(coachId) : null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const {
    subscriptionTier,
    totalClients,
    weeklyActive,
    recentWorkouts,
    activeWorkouts,
    restSamples,
    pendingRequests,
    completedThisWeek,
    workoutsToday,
    monthlyNewClients,
    upcomingAppointments,
    topClientRelations,
    templateExerciseLookups,
    upcomingSessionsCount,
    activeSubscriptionCount,
    unreadMessagesCount,
    unreadMessagesPreview,
    unansweredCheckInsCount,
    unansweredCheckInsPreview,
    upcomingSessionsPreview,
    riskClients,
    onboarding,
  } = await (async () => {
    try {
      const coachProfile = await prisma.coachProfile.findUnique({
        where: { userId: coachId },
        select: {
          bio: true,
          slogan: true,
          city: true,
          specialties: true,
          experienceYears: true,
          transformationPhotos: true,
          inviteCode: true,
          subscriptionTier: true,
          packages: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      });

      const [
        totalClients,
        weeklyActive,
        recentWorkouts,
        activeWorkouts,
        restSamples,
        pendingRequests,
        completedThisWeek,
        workoutsToday,
        monthlyNewClients,
        upcomingAppointments,
        topClientRelations,
        upcomingSessionsCount,
        activeSubscriptions,
        templateCount,
        availabilityCount,
        unreadMessagesCount,
        unreadMessagesPreview,
        unansweredCheckInsCount,
        unansweredCheckInsPreview,
        upcomingSessionsPreview,
        riskRelations,
      ] = await Promise.all([
        prisma.coachClientRelation.count({ where: { coachId, status: "ACCEPTED" } }),
        prisma.workout.count({
          where: {
            client: { clientRelations: { some: { coachId, status: "ACCEPTED" } } },
            startedAt: { gte: sevenDaysAgo },
          },
        }),
        prisma.workout.findMany({
          where: {
            client: { clientRelations: { some: { coachId, status: "ACCEPTED" } } },
          },
          select: {
            id: true,
            status: true,
            startedAt: true,
            client: { select: { id: true, name: true } },
            template: { select: { name: true } },
          },
          orderBy: { startedAt: "desc" },
          take: RECENT_WORKOUT_LIMIT,
        }),
        prisma.workout.findMany({
          where: {
            status: "IN_PROGRESS",
            client: { clientRelations: { some: { coachId, status: "ACCEPTED" } } },
          },
          select: {
            id: true,
            startedAt: true,
            client: { select: { id: true, name: true } },
            template: {
              select: {
                name: true,
                exercises: {
                  select: { targetSets: true },
                },
              },
            },
            sets: {
              where: { completed: true },
              select: { id: true },
            },
          },
          orderBy: { startedAt: "desc" },
          take: ACTIVE_WORKOUT_LIMIT,
        }),
        prisma.workoutSet.findMany({
          where: {
            completed: true,
            actualRestSeconds: { not: null },
            workout: {
              status: "COMPLETED",
              startedAt: { gte: sevenDaysAgo },
              client: { clientRelations: { some: { coachId, status: "ACCEPTED" } } },
            },
          },
          select: {
            actualRestSeconds: true,
            exerciseId: true,
            workout: {
              select: {
                templateId: true,
                client: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: [{ workout: { startedAt: "desc" } }, { setNumber: "desc" }],
          take: REST_SAMPLE_LIMIT,
        }),
        prisma.coachClientRelation.findMany({
          where: { coachId, status: "PENDING" },
          select: {
            id: true,
            client: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: PENDING_REQUEST_LIMIT,
        }),
        prisma.workout.count({
          where: {
            status: "COMPLETED",
            client: { clientRelations: { some: { coachId, status: "ACCEPTED" } } },
            startedAt: { gte: sevenDaysAgo },
          },
        }),
        prisma.workout.count({
          where: {
            client: { clientRelations: { some: { coachId, status: "ACCEPTED" } } },
            startedAt: { gte: todayStart },
          },
        }),
        prisma.coachClientRelation.count({
          where: { coachId, status: "ACCEPTED", createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.templateAssignment.findMany({
          where: { template: { coachId }, scheduledFor: { gte: todayStart } },
          select: {
            id: true,
            scheduledFor: true,
            client: { select: { id: true, name: true } },
          },
          orderBy: { scheduledFor: "asc" },
          take: UPCOMING_APPOINTMENT_LIMIT,
        }),
        prisma.coachClientRelation.findMany({
          where: { coachId, status: "ACCEPTED" },
          select: {
            client: {
              select: {
                id: true,
                name: true,
                workouts: {
                  where: { startedAt: { gte: thirtyDaysAgo } },
                  select: { status: true, startedAt: true },
                  orderBy: { startedAt: "desc" },
                  take: TOP_CLIENT_WORKOUT_LIMIT,
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: TOP_CLIENT_LIMIT,
        }),
        // Upcoming sessions in the next 30 days
        prisma.session.count({
          where: {
            coachId,
            status: "SCHEDULED",
            scheduledFor: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        // Active subscriptions for MRR calculation
        prisma.subscription.findMany({
          where: { coachId, status: "active" },
          select: { id: true },
        }),
        prisma.workoutTemplate.count({ where: { coachId } }),
        prisma.coachAvailability.count({ where: { coachId } }),
        prisma.message.count({
          where: { receiverId: coachId, isRead: false },
        }),
        prisma.message.findMany({
          where: { receiverId: coachId, isRead: false },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: ACTION_PREVIEW_LIMIT,
        }),
        prisma.checkIn.count({
          where: { coachId, response: { is: null } },
        }),
        prisma.checkIn.findMany({
          where: { coachId, response: { is: null } },
          select: {
            id: true,
            createdAt: true,
            client: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: ACTION_PREVIEW_LIMIT,
        }),
        prisma.session.findMany({
          where: {
            coachId,
            status: "SCHEDULED",
            scheduledFor: { gte: now },
          },
          select: {
            id: true,
            type: true,
            scheduledFor: true,
            client: { select: { id: true, name: true } },
          },
          orderBy: { scheduledFor: "asc" },
          take: ACTION_PREVIEW_LIMIT,
        }),
        prisma.coachClientRelation.findMany({
          where: { coachId, status: "ACCEPTED" },
          select: {
            client: {
              select: {
                id: true,
                name: true,
                workouts: {
                  where: { status: "COMPLETED" },
                  orderBy: { finishedAt: "desc" },
                  take: 1,
                  select: { finishedAt: true },
                },
                assignments: {
                  where: { scheduledFor: { lte: now } },
                  orderBy: { scheduledFor: "desc" },
                  take: 5,
                  select: {
                    workouts: {
                      select: { status: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        }),
      ]);

      const templateExerciseKeys = Array.from(
        new Set(restSamples.map((item) => `${item.workout.templateId}:${item.exerciseId}`))
      );

      const templateExerciseLookups = templateExerciseKeys.length
        ? await prisma.workoutTemplateExercise.findMany({
            where: {
              OR: templateExerciseKeys.map((key) => {
                const [templateId, exerciseId] = key.split(":");
                return { templateId, exerciseId };}
              ),
            },
            select: {
              templateId: true,
              exerciseId: true,
              prescribedRestSeconds: true,
            },
          })
        : [];

      const riskClients = riskRelations
        .map(({ client }) => {
          const lastWorkout = client.workouts[0]?.finishedAt ?? null;
          const inactiveDays = lastWorkout
            ? Math.floor((Date.now() - lastWorkout.getTime()) / 86400000)
            : null;
          const missedCount = client.assignments.filter(
            (assignment) => assignment.workouts.length === 0 || assignment.workouts[0].status === "ABANDONED"
          ).length;

          let reason = "Takip oneriliyor";
          if (lastWorkout === null && client.assignments.length > 0) {
            reason = "Henuz tamamlanan antrenman yok";
          } else if (inactiveDays !== null && inactiveDays >= 7) {
            reason = `${inactiveDays} gundur tamamlanan antrenman yok`;
          } else if (missedCount >= 2) {
            reason = `${missedCount} atlanmis program gorunuyor`;
          }

          const isAtRisk =
            (lastWorkout === null && client.assignments.length > 0) ||
            (lastWorkout !== null && lastWorkout < sevenDaysAgo) ||
            missedCount >= 2;

          return {
            clientId: client.id,
            name: client.name,
            reason,
            inactiveDays,
            isAtRisk,
          };
        })
        .filter((client) => client.isAtRisk)
        .sort((a, b) => (b.inactiveDays ?? 999) - (a.inactiveDays ?? 999));

      return {
        subscriptionTier: coachProfile?.subscriptionTier ?? "FREE",
        totalClients,
        weeklyActive,
        recentWorkouts,
        activeWorkouts,
        restSamples,
        pendingRequests,
        completedThisWeek,
        workoutsToday,
        monthlyNewClients,
        upcomingAppointments,
        topClientRelations,
        templateExerciseLookups,
        upcomingSessionsCount,
        activeSubscriptionCount: activeSubscriptions.length,
        unreadMessagesCount,
        unreadMessagesPreview,
        unansweredCheckInsCount,
        unansweredCheckInsPreview,
        upcomingSessionsPreview,
        riskClients,
        onboarding: {
          profileReady: Boolean(
            coachProfile?.bio
              && coachProfile.slogan
              && coachProfile.city
              && coachProfile.experienceYears !== null
              && Array.isArray(coachProfile.specialties)
              && coachProfile.specialties.length > 0
          ),
          packageReady: (coachProfile?.packages.length ?? 0) > 0,
          availabilityReady: availabilityCount > 0,
          templateReady: templateCount > 0,
          inviteReady: Boolean(coachProfile?.inviteCode),
          transformationReady: Array.isArray(coachProfile?.transformationPhotos)
            && coachProfile.transformationPhotos.length > 0,
          clientReady: totalClients > 0,
        },
      };
    } catch (error) {
      console.error("[coach/dashboard] Failed to load dashboard data", error);
      throw error;
    }
  })();

  const completionRate =
    weeklyActive > 0 ? Math.round((completedThisWeek / weeklyActive) * 100) : 0;
  const pendingReviewCount = Math.max(weeklyActive - completedThisWeek, 0);
  const onboardingCompletedCount = Object.values(onboarding).filter(Boolean).length;
  const onboardingTotalCount = Object.keys(onboarding).length;
  const onboardingRemainingCount = onboardingTotalCount - onboardingCompletedCount;
  const weeklyDigest = await buildCoachWeeklyDigest(coachId);

  const formatTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${Math.max(minutes, 1)} dk once`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} sa once`;
    return `${Math.floor(hours / 24)} gun once`;
  };

  const formatFutureTime = (date: Date) =>
    new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  const topClients = topClientRelations.map((rel) => {
    const total = rel.client.workouts.length;
    const completed = rel.client.workouts.filter(
      (w) => w.status === "COMPLETED",
    ).length;
    const compliance = total > 0 ? Math.round((completed / total) * 100) : 0;
    const lastWorkout = rel.client.workouts[0]?.startedAt ?? null;
    return {
      id: rel.client.id,
      name: rel.client.name,
      compliance,
      lastWorkout,
    };
  });

  // Keep one active workout story per client (latest one)
  const activeStories = Array.from(
    new Map(
      activeWorkouts.map((workout) => [
        workout.client.id,
        {
          clientId: workout.client.id,
          clientName: workout.client.name,
          workoutId: workout.id,
          templateName: workout.template.name,
          startedAt: workout.startedAt,
          completedSets: workout.sets.length,
          targetSets: workout.template.exercises.reduce((sum, item) => sum + (item.targetSets ?? 1), 0),
        },
      ])
    ).values()
  );

  const prescribedByTemplateExercise = new Map(
    templateExerciseLookups.map((item) => [`${item.templateId}:${item.exerciseId}`, item.prescribedRestSeconds ?? 90])
  );

  const restByClient = new Map<string, {
    clientId: string;
    clientName: string;
    totalActual: number;
    totalPrescribed: number;
    count: number;
    violations: number;
  }>();

  for (const sample of restSamples) {
    const clientId = sample.workout.client.id;
    const key = `${sample.workout.templateId}:${sample.exerciseId}`;
    const prescribed = prescribedByTemplateExercise.get(key) ?? 90;
    const actual = sample.actualRestSeconds ?? 0;

    if (!restByClient.has(clientId)) {
      restByClient.set(clientId, {
        clientId,
        clientName: sample.workout.client.name,
        totalActual: 0,
        totalPrescribed: 0,
        count: 0,
        violations: 0,
      });
    }

    const bucket = restByClient.get(clientId)!;
    bucket.totalActual += actual;
    bucket.totalPrescribed += prescribed;
    bucket.count += 1;
    if (actual > prescribed * 1.5) {
      bucket.violations += 1;
    }
  }

  const restViolations = Array.from(restByClient.values())
    .map((item) => {
      const avgActual = Math.round(item.totalActual / Math.max(1, item.count));
      const avgPrescribed = Math.round(item.totalPrescribed / Math.max(1, item.count));
      return {
        ...item,
        avgActual,
        avgPrescribed,
        overBy: Math.max(0, avgActual - avgPrescribed),
      };
    })
    .filter((item) => item.count >= 3 && item.overBy >= 30)
    .sort((a, b) => b.overBy - a.overBy)
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* â”€â”€ Hero â”€â”€ */}
      <div
        className="-mx-4 -mt-4 rounded-b-[28px] px-4 pb-6 pt-5 sm:px-5"
        style={{ background: "linear-gradient(160deg, #1A365D, #2D4A7A)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="m-0 text-[13px] text-white/60">Koc Paneli</p>
            <h2 className="m-0 text-[20px] font-black leading-tight tracking-tight text-white">
              {userName}
            </h2>
          </div>
          <Avatar name={userName} imageUrl={coachAvatarUrl} size={44} bg="#F97316" />
        </div>

        {/* KPI Row 1 */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {[
            { label: "Aktif Danisan", val: totalClients, sub: `+${monthlyNewClients} bu ay`, color: "#fff" },
            { label: "Uyumluluk", val: `${completionRate}%`, sub: "son 7 gun", color: "#FED7AA" },
            { label: "Bugun", val: workoutsToday, sub: `${pendingReviewCount} bekliyor`, color: "#fff" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-[14px] p-3"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <div className="text-[22px] font-extrabold leading-none" style={{ color: m.color }}>
                {m.val}
              </div>
              <div className="text-[10px] text-white/55 mt-1 leading-tight">{m.label}</div>
              <div className="text-[10px] text-white/35 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* KPI Row 2 â€” new metrics */}
        <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {[
            {
              label: "Aktif Abone",
              val: activeSubscriptionCount,
              sub: "abonelik",
              color: "#86EFAC",
              icon: "MRR",
            },
            {
              label: "Seans",
              val: upcomingSessionsCount,
              sub: "30 gunde planli",
              color: "#C4B5FD",
              icon: "SES",
            },
            {
              label: "Bekleyen",
              val: pendingRequests.length,
              sub: "baglanti istegi",
              color: pendingRequests.length > 0 ? "#FCA5A5" : "#fff",
              icon: "TLP",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-[14px] p-3"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-baseline gap-1">
                <span className="text-[11px]">{m.icon}</span>
                <div className="text-[20px] font-extrabold leading-none" style={{ color: m.color }}>
                  {m.val}
                </div>
              </div>
              <div className="text-[10px] text-white/55 mt-1 leading-tight">{m.label}</div>
              <div className="text-[10px] text-white/35 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Content â”€â”€ */}
      <div className="mt-4 flex flex-col gap-5">
        <div id="onboarding-checklist">
          <CoachOnboardingChecklist {...onboarding} />
        </div>

        <CoachActionCenter
          onboarding={{
            completed: onboardingCompletedCount,
            remaining: onboardingRemainingCount,
            total: onboardingTotalCount,
          }}
          pendingRequests={{
            count: pendingRequests.length,
            items: pendingRequests.slice(0, ACTION_PREVIEW_LIMIT).map((request) => ({
              label: request.client.name,
              meta: request.client.email,
              href: "/coach/clients",
            })),
          }}
          riskClients={{
            count: riskClients.length,
            items: riskClients.slice(0, ACTION_PREVIEW_LIMIT).map((client) => ({
              label: client.name,
              meta: client.reason,
              href: `/coach/clients/${client.clientId}`,
            })),
          }}
          unansweredCheckIns={{
            count: unansweredCheckInsCount,
            items: unansweredCheckInsPreview.map((checkIn) => ({
              label: checkIn.client.name,
              meta: `${formatTimeAgo(checkIn.createdAt)} gonderildi`, 
              href: "/coach/dashboard#coach-checkins",
            })),
          }}
          unreadMessages={{
            count: unreadMessagesCount,
            items: unreadMessagesPreview.map((message) => ({
              label: message.sender.name,
              meta: message.content,
              href: `/coach/messages?withUserId=${message.sender.id}`,
            })),
          }}
          upcomingSessions={{
            count: upcomingSessionsCount,
            items: upcomingSessionsPreview.map((session) => ({
              label: session.client.name,
              meta: `${formatFutureTime(session.scheduledFor)} - ${session.type}`,
              href: "/coach/dashboard#coach-sessions",
            })),
          }}
        />

        {/* Active Workout Stories */}
        {activeStories.length > 0 && (
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[15px] font-bold text-slate-800">
                Su An Aktif Antrenman
              </span>
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-500">
                Live {activeStories.length}
              </span>
            </div>

            <div
              className="flex gap-3 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "thin" }}
            >
              {activeStories.map((story) => (
                <Link
                  key={story.workoutId}
                  href={`/coach/clients/${story.clientId}`}
                  className="group min-w-[96px] max-w-[96px] rounded-2xl bg-white px-2.5 py-3 text-center shadow-sm transition-all hover:-translate-y-0.5"
                  style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <div className="mx-auto mb-2.5 relative flex h-14 w-14 items-center justify-center rounded-full"
                    style={{
                      background: "conic-gradient(from 0deg, #FB923C, #EF4444, #FB923C)",
                      boxShadow: "0 6px 14px rgba(239,68,68,0.25)",
                    }}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1A365D] text-sm font-black text-white">
                      {story.clientName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <span className="absolute -bottom-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                      canli
                    </span>
                  </div>

                  <p className="truncate text-[11px] font-black text-slate-800">
                    {story.clientName}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-slate-400">
                    {story.templateName}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-red-500">
                    {formatTimeAgo(story.startedAt)}
                  </p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                      style={{ width: `${Math.min(100, Math.round((story.completedSets / Math.max(1, story.targetSets)) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[9px] font-bold text-slate-400">
                    {story.completedSets}/{story.targetSets} set
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Rest Violation Report */}
        {restViolations.length > 0 && (
          <div
            className="app-panel p-4"
            style={{ border: "1px solid rgba(0,0,0,0.06)", borderLeft: "4px solid #F97316" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[15px] font-bold text-slate-800">Dinlenme Suresi Ihlal Raporu</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Son 7 gun</span>
            </div>

            <div className="space-y-2">
              {restViolations.map((item) => (
                <div key={item.clientId} className="rounded-xl bg-orange-50 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-black text-slate-800">{item.clientName}</p>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-600">
                      +{item.overBy} sn
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ortalama dinlenme {item.avgActual} sn, hedef {item.avgPrescribed} sn. Ihlal seti: {item.violations}/{item.count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <NudgeAssistantCard />

        <WeeklyCoachDigestCard digest={weeklyDigest} subscriptionTier={subscriptionTier} />

        {/* Revenue panel */}
        <CoachRevenuePanel subscriptionTier={subscriptionTier} currentClientCount={totalClients} />

        {/* Sessions */}
        <div id="coach-sessions">
          <SessionsPanel role="COACH" />
        </div>

        {/* Quota Widget */}
        <QuotaWidget tier={subscriptionTier} currentClientCount={totalClients} />

        {/* Churn Alerts */}
        <ChurnAlerts />

        {/* Check-in Manager */}
        <div id="coach-checkins">
          <CheckInManager
            clients={topClientRelations.map((r) => ({ id: r.client.id, name: r.client.name }))}
          />
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div
            className="app-panel p-4"
            style={{
              border: "1px solid rgba(0,0,0,0.06)",
              borderLeft: "4px solid #F97316",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[15px] font-bold text-slate-800">
                Yeni Talepler
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(249,115,22,0.12)", color: "#F97316" }}
              >
                {pendingRequests.length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3">
                  <Avatar name={req.client.name} size={40} bg="#1A365D" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-slate-800 truncate">
                      {req.client.name}
                    </div>
                    <div className="text-[12px] text-slate-400 truncate">
                      {req.client.email}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <DashboardActionMenu clientId={req.client.id} />
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/coach/clients"
              className="mt-3 block text-center py-2 rounded-xl text-[13px] font-bold text-orange-500 border border-orange-500"
            >
              Tumunu Gor
            </Link>
          </div>
        )}

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div>
            <span className="text-[15px] font-bold text-slate-800 block mb-2.5">
              Yaklasan Randevular
            </span>
            <div className="flex flex-col gap-2">
              {upcomingAppointments.map((a) => (
                <Link
                  key={a.id}
                  href={`/coach/clients/${a.client.id}/progress`}
                  className="app-panel flex items-center gap-3 p-3.5"
                  style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <div className="bg-slate-100 rounded-xl px-3 py-2 text-center shrink-0 min-w-[48px]">
                    <div className="text-[11px] text-slate-400 font-medium leading-none">
                      {new Date(a.scheduledFor).toLocaleDateString("tr-TR", {
                        month: "short",
                      })}
                    </div>
                    <div className="text-[18px] font-black text-slate-700 leading-tight">
                      {new Date(a.scheduledFor).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-slate-800 truncate">
                      {a.client.name}
                    </div>
                    <div className="text-[12px] text-slate-400">
                      {new Date(a.scheduledFor).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[15px] font-bold text-slate-800">
              Son Aktiviteler
            </span>
          </div>

          {recentWorkouts.length === 0 ? (
            <div
              className="app-panel p-4 text-center"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <p className="text-[13px] font-black text-slate-700">Bugun henuz aktivite yok</p>
              <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-slate-400">
                Ilk hareketi yaratmak icin bir danisana hazir sablon ata veya ilk sablonunu olustur.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Link
                  href="/coach/templates"
                  className="rounded-xl bg-slate-900 px-3 py-2 text-[12px] font-black text-white"
                >
                  Sablonlari Ac
                </Link>
                <Link
                  href="/coach/clients"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-black text-slate-600"
                >
                  Danisanlari Gor
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentWorkouts.map((w) => {
                const isCompleted = w.status === "COMPLETED";
                return (
                  <div
                    key={w.id}
                    className="app-panel flex items-center gap-3 p-3.5"
                    style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <Avatar
                      name={w.client.name}
                      size={36}
                      bg={isCompleted ? "#22C55E" : "#F59E0B"}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-slate-800">
                        <strong>{w.client.name}</strong>{" "}
                        <span
                          className={
                            isCompleted ? "text-green-500" : "text-amber-500"
                          }
                        >
                          {isCompleted ? "tamamladi" : "yarida birakti"}
                        </span>
                        {" - "}
                        <span className="font-semibold">{w.template.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatTimeAgo(w.startedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${isCompleted ? "bg-green-500/15" : "bg-amber-500/15"}`}
                      >
                        <CheckCircle2
                          className={`h-3 w-3 ${isCompleted ? "text-green-500" : "text-amber-500"}`}
                        />
                      </div>
                      <Link
                        href={`/coach/clients/${w.client.id}/progress`}
                        className="text-slate-300 hover:text-slate-500"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Clients with Compliance */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[15px] font-bold text-slate-800">
              Danisanlar
            </span>
            <Link
              href="/coach/clients"
              className="text-[12px] text-orange-500 font-semibold"
            >
              Tumunu Gor
            </Link>
          </div>

          {topClients.length === 0 ? (
            <div
              className="app-panel p-4 text-center"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <p className="text-[13px] font-black text-slate-700">Ilk danisanini bagla</p>
              <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-slate-400">
                Davet linkini paylas veya marketplace profilini tamamla. Danisan geldiginde uyumluluk ve aksiyonlar burada gorunur.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Link
                  href="/coach/profile"
                  className="rounded-xl bg-orange-500 px-3 py-2 text-[12px] font-black text-white"
                >
                  Davet Linkini Al
                </Link>
                <Link
                  href="/coach/templates/new"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-black text-slate-600"
                >
                  Ilk Sablon
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/coach/clients/${c.id}/progress`}
                  className="app-panel flex items-center gap-3 p-3.5"
                  style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <Avatar name={c.name} size={40} bg="#1A365D" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-slate-800 truncate">
                      {c.name}
                    </div>
                    {c.lastWorkout && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-slate-100 rounded-full max-w-[80px]">
                          <div
                            className="h-1 rounded-full"
                            style={{
                              width: `${c.compliance}%`,
                              background:
                                c.compliance >= 80 ? "#22C55E" : "#F59E0B",
                            }}
                          />
                        </div>
                        <span
                          className="text-[11px] font-bold"
                          style={{
                            color: c.compliance >= 80 ? "#22C55E" : "#F59E0B",
                          }}
                        >
                          %{c.compliance}
                        </span>
                      </div>
                    )}
                    {!c.lastWorkout && (
                      <div className="text-[12px] text-slate-400">
                        Henuz antrenman yok
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-[14px] font-extrabold"
                      style={{
                        color: c.compliance >= 80 ? "#22C55E" : "#F59E0B",
                      }}
                    >
                      %{c.compliance}
                    </div>
                    <div className="text-[10px] text-slate-400">uyumluluk</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { href: "/coach/clients", label: "Danisanlar" },
            { href: "/coach/templates", label: "Sablonlar" },
            { href: "/coach/messages", label: "Mesajlar" },
            { href: "/coach/profile", label: "Profil" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-xl p-3 text-[13px] font-semibold text-slate-700 flex items-center justify-between transition-colors hover:border-orange-200 hover:text-orange-600 shadow-sm"
              style={{ border: "1px solid #E2E8F0" }}
            >
              {label}
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
