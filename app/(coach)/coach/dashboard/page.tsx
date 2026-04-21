import Link from "next/link";
import { CheckCircle2, ChevronRight, MessageCircle, TrendingUp } from "lucide-react";

import { DashboardActionMenu } from "@/components/coach/DashboardActionMenu";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CoachDashboardPage() {
  const session = await auth();
  const coachId = session?.user.id || "";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalClients,
    weeklyActive,
    recentWorkouts,
    pendingRequests,
    completedThisWeek,
    workoutsToday,
    monthlyNewClients,
    upcomingAppointments
  ] = await Promise.all([
    prisma.coachClientRelation.count({ where: { coachId, status: "ACCEPTED" } }),
    prisma.workout.count({
      where: {
        client: { clientRelations: { some: { coachId, status: "ACCEPTED" } } },
        startedAt: { gte: sevenDaysAgo }
      }
    }),
    prisma.workout.findMany({
      where: {
        client: { clientRelations: { some: { coachId, status: "ACCEPTED" } } }
      },
      include: { client: true, template: true },
      orderBy: { startedAt: "desc" },
      take: 6
    }),
    prisma.coachClientRelation.findMany({
      where: { coachId, status: "PENDING" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 4
    }),
    prisma.workout.count({
      where: {
        status: "COMPLETED",
        client: { clientRelations: { some: { coachId, status: "ACCEPTED" } } },
        startedAt: { gte: sevenDaysAgo }
      }
    }),
    prisma.workout.count({
      where: {
        client: { clientRelations: { some: { coachId, status: "ACCEPTED" } } },
        startedAt: { gte: todayStart }
      }
    }),
    prisma.coachClientRelation.count({
      where: { coachId, status: "ACCEPTED", createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.templateAssignment.findMany({
      where: {
        template: { coachId },
        scheduledFor: { gte: todayStart }
      },
      include: { client: true },
      orderBy: { scheduledFor: "asc" },
      take: 3
    })
  ]);

  const completionRate = weeklyActive > 0 ? Math.round((completedThisWeek / weeklyActive) * 100) : 0;
  const pendingReviewCount = Math.max(weeklyActive - completedThisWeek, 0);
  const topInquiry = pendingRequests[0] || null;

  const formatTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${Math.max(minutes, 1)} dk once`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} sa once`;
    const days = Math.floor(hours / 24);
    return `${days} gun once`;
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 pb-6">
      <section className="mb-12">
        <h1 className="text-5xl font-black uppercase leading-tight tracking-tighter text-on-surface md:text-6xl">
          HASSASIYETIN
          <br />
          <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">SINIRLARINI ZORLA</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-medium text-secondary">
          Gunluk komuta gorunumu. Uyumlulugu izle, yuk durumunu takip et ve oncelikli danisanlara hizli aksiyon al.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="grid grid-cols-1 gap-6 md:col-span-8 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg bg-surface-container-lowest p-6 shadow-sm">
            <p className="z-10 mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Aktif Danisan</p>
            <h2 className="z-10 text-5xl font-black text-on-surface">{totalClients}</h2>
            <div className="z-10 mt-4 flex items-center text-sm font-medium text-primary">
              <TrendingUp className="mr-1 h-4 w-4" /> +{monthlyNewClients} bu ay
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg bg-surface-container-lowest p-6 shadow-sm">
            <p className="z-10 mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Gunluk Uyumluluk</p>
            <h2 className="z-10 text-5xl font-black text-on-surface">
              {completionRate}
              <span className="text-3xl text-secondary">%</span>
            </h2>
            <div className="z-10 mt-4 text-sm font-medium text-secondary">Optimum Aralik</div>
          </div>

          <div className="rounded-lg bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/15">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Bugunku Antreman</p>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-5xl font-black text-on-surface">{workoutsToday}</h2>
              <span className="rounded-full bg-primary-container/10 px-2 py-1 text-sm font-bold text-primary">{pendingReviewCount} Bekliyor</span>
            </div>
            <Link href="/coach/clients" className="mt-4 inline-flex items-center text-sm font-bold text-primary transition-colors hover:text-primary-container">
              Simdi Incele <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="flex h-full flex-col rounded-lg bg-surface-container-low p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-on-surface">Yeni Talepler</h3>
              <span className="rounded-full bg-primary px-2 py-1 text-xs font-bold text-on-primary">{pendingRequests.length} Yeni</span>
            </div>

            <div className="flex flex-1 flex-col rounded-lg bg-surface-container-lowest p-4">
              {topInquiry ? (
                <>
                  <div className="mb-4 flex items-center space-x-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-high text-secondary">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">{topInquiry.client.name}</h4>
                      <p className="text-xs font-medium text-secondary">Hedef: Program Takibi</p>
                    </div>
                  </div>

                  <p className="mb-6 flex-1 text-sm text-on-surface-variant">{topInquiry.client.email}</p>

                  <div className="mt-auto flex space-x-3">
                    <div className="flex-1">
                      <DashboardActionMenu clientId={topInquiry.client.id} />
                    </div>
                    <Link href="/coach/clients" className="flex-1 rounded-lg bg-surface-container-high py-2 text-center text-sm font-bold text-on-secondary-container">
                      Incele
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-sm text-on-surface-variant">Yeni talep bulunmuyor.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-on-surface">Son Aktiviteler</h3>
        <div className="space-y-2">
          {recentWorkouts.length === 0 ? (
            <div className="rounded-lg bg-surface-container-lowest p-4 text-sm text-on-surface-variant shadow-sm">Henüz aktivite yok.</div>
          ) : (
            recentWorkouts.map((workout) => (
              <div key={workout.id} className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-4 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-on-surface">
                      <span className="font-bold">{workout.client.name}</span> <span>{workout.status === "COMPLETED" ? "tamamladi" : "guncelledi"}</span>{" "}
                      <span className="font-bold">{workout.template.name}</span>
                    </p>
                    <p className="mt-1 text-xs text-secondary">{formatTimeAgo(workout.startedAt)}</p>
                  </div>
                </div>
                <Link href={`/coach/clients/${workout.client.id}/progress`} className="text-secondary transition-colors hover:text-primary">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-bold text-on-surface">Yaklasan Randevular</h3>
        {upcomingAppointments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-outline bg-surface-container-low p-4 text-sm text-on-surface-variant">Yakın tarihli randevu yok.</div>
        ) : (
          upcomingAppointments.map((appointment) => (
            <Link
              key={appointment.id}
              href={`/coach/clients/${appointment.client.id}/progress`}
              className="flex items-center justify-between rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4"
            >
              <div>
                <p className="font-semibold text-on-surface">{appointment.client.name}</p>
                <p className="text-xs text-secondary">{new Date(appointment.scheduledFor).toLocaleString("tr-TR")}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-secondary" />
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
