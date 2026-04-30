import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { DashboardActionMenu } from "@/components/coach/DashboardActionMenu";
import { QuotaWidget } from "@/components/coach/QuotaWidget";
import { ChurnAlerts } from "@/components/coach/ChurnAlerts";
import { CheckInManager } from "@/components/coach/CheckInManager";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function Avatar({ name, size = 40, bg = "#1A365D" }: { name: string; size?: number; bg?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        fontSize: size * 0.36,
        boxShadow: `0 2px 8px ${bg}44`,
      }}
    >
      {initials}
    </div>
  );
}

export default async function CoachDashboardPage() {
  const session = await auth();
  const coachId = session?.user.id || "";
  const userName = session?.user.name || "Koç";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const coachProfile = await prisma.coachProfile.findUnique({
    where: { userId: coachId },
    select: { subscriptionTier: true },
  });
  const subscriptionTier = coachProfile?.subscriptionTier ?? "FREE";

  const [
    totalClients,
    weeklyActive,
    recentWorkouts,
    pendingRequests,
    completedThisWeek,
    workoutsToday,
    monthlyNewClients,
    upcomingAppointments,
    topClientRelations,
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
      include: { client: true, template: true },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
    prisma.coachClientRelation.findMany({
      where: { coachId, status: "PENDING" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 4,
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
      include: { client: true },
      orderBy: { scheduledFor: "asc" },
      take: 3,
    }),
    prisma.coachClientRelation.findMany({
      where: { coachId, status: "ACCEPTED" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            workouts: {
              where: { startedAt: { gte: thirtyDaysAgo } },
              select: { status: true, startedAt: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const completionRate =
    weeklyActive > 0 ? Math.round((completedThisWeek / weeklyActive) * 100) : 0;
  const pendingReviewCount = Math.max(weeklyActive - completedThisWeek, 0);

  const formatTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${Math.max(minutes, 1)} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} sa önce`;
    return `${Math.floor(hours / 24)} gün önce`;
  };

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

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div
        className="-mx-4 px-5 pt-5 pb-6 -mt-4"
        style={{ background: "linear-gradient(160deg, #1A365D, #2D4A7A)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/60 text-[13px] m-0">Koç Paneli</p>
            <h2 className="text-white text-[20px] font-black m-0 leading-tight tracking-tight">
              {userName}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Aktif Danışan", val: totalClients, sub: `+${monthlyNewClients} bu ay`, color: "#fff" },
            { label: "Uyumluluk", val: `${completionRate}%`, sub: "Optimum aralık", color: "#FED7AA" },
            { label: "Bugün", val: workoutsToday, sub: `${pendingReviewCount} bekliyor`, color: "#fff" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-[14px] p-3"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <div
                className="text-[22px] font-extrabold leading-none"
                style={{ color: m.color }}
              >
                {m.val}
              </div>
              <div className="text-[10px] text-white/55 mt-1 leading-tight">
                {m.label}
              </div>
              <div className="text-[10px] text-white/35 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mt-4 flex flex-col gap-5">
        {/* Quota Widget */}
        <QuotaWidget tier={subscriptionTier} currentClientCount={totalClients} />

        {/* Churn Alerts */}
        <ChurnAlerts />

        {/* Check-in Manager */}
        <CheckInManager
          clients={topClientRelations.map((r) => ({ id: r.client.id, name: r.client.name }))}
        />

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div
            className="bg-white rounded-[18px] shadow-sm p-4"
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
              Tümünü Gör
            </Link>
          </div>
        )}

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div>
            <span className="text-[15px] font-bold text-slate-800 block mb-2.5">
              Yaklaşan Randevular
            </span>
            <div className="flex flex-col gap-2">
              {upcomingAppointments.map((a) => (
                <Link
                  key={a.id}
                  href={`/coach/clients/${a.client.id}/progress`}
                  className="bg-white rounded-[18px] shadow-sm p-3.5 flex items-center gap-3"
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
              className="bg-white rounded-[18px] p-4 shadow-sm text-center text-[13px] text-slate-400"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              Henüz aktivite yok.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentWorkouts.map((w) => {
                const isCompleted = w.status === "COMPLETED";
                return (
                  <div
                    key={w.id}
                    className="bg-white rounded-[18px] shadow-sm p-3.5 flex items-center gap-3"
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
                          {isCompleted ? "tamamladı" : "yarıda bıraktı"}
                        </span>
                        {" — "}
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
              Danışanlar
            </span>
            <Link
              href="/coach/clients"
              className="text-[12px] text-orange-500 font-semibold"
            >
              Tümü →
            </Link>
          </div>

          {topClients.length === 0 ? (
            <div
              className="bg-white rounded-[18px] p-4 shadow-sm text-center text-[13px] text-slate-400"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              Henüz danışan yok.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/coach/clients/${c.id}/progress`}
                  className="bg-white rounded-[18px] shadow-sm p-3.5 flex items-center gap-3"
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
                        Henüz antrenman yok
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
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/coach/clients", label: "Danışanlar" },
            { href: "/coach/templates", label: "Şablonlar" },
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
