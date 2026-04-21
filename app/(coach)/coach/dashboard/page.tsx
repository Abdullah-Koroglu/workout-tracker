import Link from "next/link";
import { Activity, ArrowRight, BarChart3, ClipboardList, Dumbbell, Users, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";

import { DashboardActionMenu } from "@/components/coach/DashboardActionMenu";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CoachDashboardPage() {
  const session = await auth();
  const coachId = session?.user.id || "";

  const [totalClients, weeklyActive, recentWorkouts, totalTemplates, totalExercises, pendingRequests, acceptedClients, completedThisWeek, abandonedThisWeek] = await Promise.all([
    prisma.coachClientRelation.count({ where: { coachId, status: "ACCEPTED" } }),
    prisma.workout.count({
      where: {
        client: {
          clientRelations: {
            some: { coachId, status: "ACCEPTED" }
          }
        },
        startedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
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
      take: 8
    }),
    prisma.workoutTemplate.count({ where: { coachId } }),
    prisma.exercise.count(),
    prisma.coachClientRelation.findMany({
      where: { coachId, status: "PENDING" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.coachClientRelation.findMany({
      where: { coachId, status: "ACCEPTED" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 6
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
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.workout.count({
      where: {
        status: "ABANDONED",
        client: {
          clientRelations: {
            some: { coachId, status: "ACCEPTED" }
          }
        },
        startedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  const completionRate = weeklyActive > 0 ? Math.round((completedThisWeek / weeklyActive) * 100) : 0;

  type RecentWorkout = (typeof recentWorkouts)[number];

  const workoutsByDay = recentWorkouts.reduce<Record<string, RecentWorkout[]>>((acc, workout) => {
    const key = new Date(workout.startedAt).toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(workout);
    return acc;
  }, {} as Record<string, RecentWorkout[]>);
  const workoutDayKeys = Object.keys(workoutsByDay).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="overflow-hidden rounded-xl bg-gradient-to-br from-card via-muted/20 to-background p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Elite Command Center</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Limits of precision</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Daily command overview: compliance, workload, client feedback ve anlık aksiyonlar tek panelde.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-background px-4 py-3 shadow-sm ring-1 ring-black/5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Aktif Client</p>
              <p className="mt-2 text-3xl font-black text-primary">{totalClients}</p>
            </div>
            <div className="rounded-lg bg-background px-4 py-3 shadow-sm ring-1 ring-black/5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Bu Hafta</p>
              <p className="mt-2 text-3xl font-black text-secondary">{weeklyActive}</p>
            </div>
            <div className="rounded-lg bg-background px-4 py-3 shadow-sm ring-1 ring-black/5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Template</p>
              <p className="mt-2 text-3xl font-black text-foreground">{totalTemplates}</p>
            </div>
            <div className="rounded-lg bg-background px-4 py-3 shadow-sm ring-1 ring-black/5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Bekleyen</p>
              <p className="mt-2 text-3xl font-black text-primary">{pendingRequests.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/coach/clients" className="group rounded-lg bg-gradient-to-br from-primary to-[hsl(24_95%_60%)] p-4 text-white shadow-sm transition hover:brightness-105 hover:shadow-md">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-3 text-sm font-bold">Client Roster</p>
            <p className="mt-1 text-xs text-orange-50">Kabul, reddet, detay ve progress</p>
          </Link>
          <Link href="/coach/templates" className="group rounded-lg bg-slate-900 p-4 text-white shadow-sm transition hover:bg-black hover:shadow-md">
            <div className="flex items-center justify-between">
              <ClipboardList className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-3 text-sm font-bold">Program Library</p>
            <p className="mt-1 text-xs text-slate-200">Yeni plan ekle, düzenle, ata</p>
          </Link>
          <Link href="/coach/exercises" className="group rounded-lg bg-secondary p-4 text-white shadow-sm transition hover:brightness-110 hover:shadow-md">
            <div className="flex items-center justify-between">
              <Dumbbell className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-3 text-sm font-bold">Exercise Library</p>
            <p className="mt-1 text-xs text-blue-100">Ağırlık ve kardiyo havuzu</p>
          </Link>
          <Link href="/coach/dashboard" className="group rounded-lg bg-background p-4 text-foreground shadow-sm ring-1 ring-black/10 transition hover:bg-muted/50 hover:shadow-md">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-3 text-sm font-bold">Analytics Lab</p>
            <p className="mt-1 text-xs text-muted-foreground">KPI ve anlık performans akışı</p>
          </Link>
        </div>
      </section>

      {/* Key Metrics */}
      <section>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 mb-4">Bu Hafta İstatistikleri</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-card ring-1 ring-black/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Başlanan Antrenmanlar</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyActive}</div>
              <p className="text-xs text-muted-foreground mt-1">Son 7 gün içinde</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card ring-1 ring-black/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">%{completionRate} başarı oranı</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card ring-1 ring-black/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yarıda Bırakılan</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{abandonedThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">Müdahale gerekebilir</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card ring-1 ring-black/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Egzersiz</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExercises}</div>
              <p className="text-xs text-muted-foreground mt-1">Kullanılabilir egzersiz</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content Grid */}
      <section>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 mb-4">Yönetim Paneli</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pending Requests */}
          <Card className="lg:col-span-1 border-0 bg-card ring-1 ring-black/5">
            <CardHeader className="border-b border-black/10 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Bekleyen İstekler
                </CardTitle>
                {pendingRequests.length > 0 && (
                  <span className="text-xs font-bold bg-primary/15 text-foreground px-2 py-1 rounded-full">{pendingRequests.length}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {pendingRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground text-center py-6">
                  Şu an bekleyen istek yok ✓
                </div>
              ) : (
                <>
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="rounded-lg bg-muted/40 p-3 text-sm transition hover:bg-muted/70 group">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary">{request.client.name}</p>
                          <p className="text-xs text-muted-foreground">{request.client.email}</p>
                        </div>
                        <DashboardActionMenu clientId={request.client.id} />
                      </div>
                    </div>
                  ))}
                  <Link href="/coach/clients" className="block mt-3">
                    <Button variant="outline" className="w-full text-xs">
                      Hepsini Göster →
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-0 bg-card ring-1 ring-black/5">
            <CardHeader className="border-b border-black/10 pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-secondary" />
                Son Aktiviteler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {recentWorkouts.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground text-center py-6">
                  Henüz workout aktivitesi yok
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {workoutDayKeys.map((dayKey) => {
                    const dayDate = new Date(dayKey);
                    return (
                      <div key={dayKey} className="rounded-lg bg-muted/30 p-3">
                        <div className="mb-2 flex items-center justify-between border-b border-black/10 pb-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            {dayDate.toLocaleDateString("tr-TR", { weekday: "long" })}
                          </p>
                          <p className="text-sm font-black text-foreground">
                            {dayDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {workoutsByDay[dayKey].map((w) => (
                            <div key={w.id} className="flex items-center justify-between rounded-lg bg-background p-3 text-sm transition hover:bg-muted/60 group ring-1 ring-black/5">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-foreground group-hover:text-primary truncate">{w.template.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{w.client.name}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                {w.status === "COMPLETED" && <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />}
                                {w.status === "IN_PROGRESS" && <Activity className="h-4 w-4 text-primary flex-shrink-0 animate-pulse" />}
                                {w.status === "ABANDONED" && <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />}
                                <DashboardActionMenu clientId={w.client.id} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Client Progress Quick Access */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Hızlı İlerleme Erişimi</h2>
          <Link href="/coach/clients" className="text-sm font-medium text-primary hover:opacity-80">
            Tümünü Göster →
          </Link>
        </div>
        {acceptedClients.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-2xl border border-dashed p-8 text-center">
                <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Önce bir client kabul etmelisin.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {acceptedClients.slice(0, 8).map((relation) => (
              <Link
                key={relation.id}
                href={`/coach/clients/${relation.client.id}/progress`}
                className="group rounded-lg bg-card p-4 shadow-sm ring-1 ring-black/5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                    {relation.client.name.charAt(0).toUpperCase()}
                  </div>
                  <BarChart3 className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-semibold text-sm text-foreground group-hover:text-primary">{relation.client.name}</p>
                <p className="text-xs text-muted-foreground truncate">{relation.client.email}</p>
                <div className="mt-2 pt-2 border-t border-black/10">
                  <p className="text-xs font-medium text-slate-600">İlerlemeyi Gör →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
