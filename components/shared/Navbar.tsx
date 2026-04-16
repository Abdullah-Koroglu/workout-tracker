import Link from "next/link";
import { Dumbbell } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeaderInteractive } from "./HeaderInteractive";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export async function Navbar() {
  const session = await auth();
  const isCoach = session?.user.role === "COACH";
  const isClient = session?.user.role === "CLIENT";

  const activeWorkout =
    isClient && session?.user.id
      ? await prisma.workout.findFirst({
          where: { clientId: session.user.id, status: "IN_PROGRESS" },
          select: { assignmentId: true },
          orderBy: { startedAt: "desc" },
        })
      : null;

  const homeHref = isCoach
    ? "/coach/dashboard"
    : isClient
      ? "/client/dashboard"
      : "/";

  const initials = session?.user.name ? getInitials(session.user.name) : "?";

  const logoBg = isCoach
    ? "from-blue-500 to-cyan-600"
    : isClient
      ? "from-emerald-500 to-teal-600"
      : "from-slate-600 to-slate-800";

  const logoText = isCoach
    ? "from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400"
    : isClient
      ? "from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400"
      : "from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400";

  const accentBar = isCoach
    ? "from-blue-500 via-cyan-400 to-blue-600"
    : isClient
      ? "from-emerald-500 via-teal-400 to-emerald-600"
      : "";

  const avatarBg = isCoach
    ? "bg-blue-600"
    : isClient
      ? "bg-emerald-600"
      : "bg-slate-600";

  const roleBadgeClass = isCoach
    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    : isClient
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : "";

  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-40 will-change-transform transition-transform duration-300 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center gap-2">
          {/* Logo */}
          <Link
            href={homeHref}
            className="group flex flex-shrink-0 items-center gap-2.5"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${logoBg} shadow-sm transition-shadow group-hover:shadow-md`}
            >
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            <span
              className={`bg-gradient-to-r ${logoText} bg-clip-text text-lg font-black tracking-tight text-transparent`}
            >
              Fit Coach
            </span>
          </Link>

          {/* All interactive parts delegated to client component */}
          <HeaderInteractive
            role={session ? (session.user.role as "COACH" | "CLIENT") : undefined}
            userName={session?.user.name}
            initials={initials}
            activeWorkoutHref={
              activeWorkout
                ? `/client/workout/${activeWorkout.assignmentId}/start`
                : undefined
            }
            avatarBg={avatarBg}
            roleBadgeClass={roleBadgeClass}
            isCoach={isCoach}
            isClient={isClient}
          />
        </div>
      </div>

      {/* Role-colored gradient accent bar */}
      {accentBar ? (
        <div className={`h-[2px] bg-gradient-to-r ${accentBar}`} />
      ) : null}
    </header>
  );
}
