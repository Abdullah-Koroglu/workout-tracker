import Link from "next/link";
import { Check, ChevronRight, MessageCircle, MoreVertical, Plus, TrendingUp } from "lucide-react";

import { DashboardActionMenu } from "@/components/coach/DashboardActionMenu";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function CoachDashboardPage() {
  const session = await auth();
  const coachId = session?.user.id || "";
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalClients, weeklyActive, recentWorkouts, pendingRequests, completedThisWeek, workoutsToday, recentAcceptedClients, monthlyNewClients, upcomingAppointments] = await Promise.all([
    prisma.coachClientRelation.count({ where: { coachId, status: "ACCEPTED" } }),
    prisma.workout.count({
      where: {
        client: {
          clientRelations: {
            some: { coachId, status: "ACCEPTED" }
          }
        },
        startedAt: {
          gte: sevenDaysAgo
        }
      }
    }),
    prisma.workout.findMany({
      where: {
        client: {
          clientRelations: {
            some: { coachId, status: "ACCEPTED" }
          }
        }
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
        client: {
          clientRelations: {
            some: { coachId, status: "ACCEPTED" }
          }
        },
        startedAt: {
          gte: sevenDaysAgo
        }
      }
    }),
    prisma.workout.count({
      where: {
        client: {
          clientRelations: {
            some: { coachId, status: "ACCEPTED" }
          }
        },
        startedAt: {
          gte: todayStart
        }
      }
    }),
    prisma.coachClientRelation.findMany({
      where: { coachId, status: "ACCEPTED" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 4
    }),
    prisma.coachClientRelation.count({
      where: { coachId, status: "ACCEPTED", createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.templateAssignment.findMany({
      where: {
        template: { coachId },
        scheduledFor: { gte: todayStart }
      },
      include: {
        client: true
      },
      orderBy: { scheduledFor: "asc" },
      take: 3
    })
  ]);

  const completionRate = weeklyActive > 0 ? Math.round((completedThisWeek / weeklyActive) * 100) : 0;
  const monthlyTrendText = `${monthlyNewClients >= 0 ? "+" : ""}${monthlyNewClients}`;

  const formatTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) {
      return `${Math.max(minutes, 1)}d ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}s ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}g ago`;
  };

  const topInquiry = pendingRequests[0];

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-6">
      <section className="flex flex-col items-end justify-between gap-6 md:flex-row">
        <div className="max-w-xl">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Daily Summary</p>
          <h2 className="leading-[0.9] text-4xl font-black tracking-tighter text-slate-900 md:text-5xl">
            PUSHING THE <br />
            <span className="text-orange-500">LIMITS OF</span> PRECISION.
          </h2>
        </div>
        <Link
          href="/coach/templates"
          className="inline-flex items-center gap-3 rounded-sm bg-orange-600 px-8 py-4 font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          New Program
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm md:col-span-2">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Total Active Clients</p>
          <h3 className="text-6xl font-black text-slate-900">{totalClients}</h3>
          <p className="mt-2 flex items-center gap-1 text-sm font-bold text-orange-600">
            <TrendingUp className="h-4 w-4" />
            {monthlyTrendText} this month
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="mb-auto text-xs font-bold uppercase tracking-widest text-slate-500">Daily Compliance</p>
          <div className="mt-4">
            <h3 className="text-4xl font-black text-slate-900">{completionRate}%</h3>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-orange-500" style={{ width: `${Math.min(completionRate, 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-white shadow-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Workouts Today</p>
          <div>
            <h3 className="text-4xl font-black text-orange-500">{workoutsToday}</h3>
            <p className="mt-1 text-xs text-slate-400">{Math.max(weeklyActive - completedThisWeek, 0)} pending review</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">Recent Activity</h4>
            <Link href="/coach/clients" className="text-xs font-bold text-orange-600 hover:underline">
              View All Feed
            </Link>
          </div>
          <div className="space-y-4">
            {recentWorkouts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                Henüz aktivite yok.
              </div>
            ) : (
              recentWorkouts.map((workout) => (
                <div key={workout.id} className="flex items-center gap-5 rounded-lg border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-100 bg-orange-50 text-lg font-bold text-orange-700">
                    {workout.client.name.charAt(0).toUpperCase()}
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <h5 className="truncate font-bold text-slate-900">{workout.client.name}</h5>
                      <span className="text-[10px] text-slate-400">{formatTimeAgo(workout.startedAt)}</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {workout.status === "COMPLETED" ? "Completed" : "Updated"} <span className="font-bold text-slate-900">{workout.template.name}</span>
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700">Status: {workout.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DashboardActionMenu clientId={workout.client.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center justify-between px-2">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">New Inquiries</h4>
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-black text-white">{pendingRequests.length}</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-orange-100 bg-orange-50 p-6">
              {topInquiry ? (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-orange-100 bg-white text-orange-600">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{topInquiry.client.name}</p>
                      <p className="text-[10px] font-bold text-orange-600">Applied {formatTimeAgo(topInquiry.createdAt)}</p>
                    </div>
                  </div>
                  <p className="mb-4 text-xs leading-relaxed text-slate-600">{topInquiry.client.email}</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <DashboardActionMenu clientId={topInquiry.client.id} />
                    </div>
                    <Link href="/coach/clients" className="flex-1 rounded-sm border border-orange-200 py-2 text-center text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100">
                      Review
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-600">Yeni inquiry yok.</p>
              )}
            </div>
          </section>

          <section>
            <h4 className="mb-4 px-2 text-sm font-black uppercase tracking-widest text-slate-900">Appointments</h4>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">
                  Yakın tarihli planlanmış randevu yok.
                </div>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/coach/clients/${appointment.client.id}/progress`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-orange-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-full bg-orange-100 text-orange-700">
                        <span className="text-[10px] font-black uppercase leading-none">{new Date(appointment.scheduledFor).toLocaleDateString("en-US", { month: "short" })}</span>
                        <span className="text-sm font-black leading-none">{new Date(appointment.scheduledFor).getDate()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{appointment.client.name}</p>
                        <p className="text-[10px] font-black uppercase text-slate-500">{new Date(appointment.scheduledFor).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-900">Quick Access</h4>
            <div className="space-y-2">
              {recentAcceptedClients.length === 0 ? (
                <p className="text-xs text-slate-500">Henüz kabul edilmiş client yok.</p>
              ) : (
                recentAcceptedClients.map((relation) => (
                  <Link
                    key={relation.id}
                    href={`/coach/clients/${relation.client.id}/progress`}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-orange-200 hover:text-orange-600"
                  >
                    {relation.client.name}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
