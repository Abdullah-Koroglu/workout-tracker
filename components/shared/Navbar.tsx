import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const session = await auth();
  const isCoach = session?.user.role === "COACH";
  const isClient = session?.user.role === "CLIENT";

  const accentColor = isCoach ? "from-blue-600 to-blue-700" : isClient ? "from-emerald-600 to-emerald-700" : "";
  const primaryLinks = isCoach
    ? [
        { href: "/coach/dashboard", label: "Dashboard" },
        { href: "/coach/clients", label: "Clientler" },
        { href: "/coach/templates", label: "Template'ler" },
        { href: "/coach/exercises", label: "Egzersizler" }
      ]
    : isClient
      ? [
          { href: "/client/dashboard", label: "Dashboard" },
          { href: "/client/coaches", label: "Coach Bul" },
          { href: "/client/workouts", label: "Geçmiş" }
        ]
      : [];

  const activeWorkout = isClient && session?.user.id
    ? await prisma.workout.findFirst({
        where: {
          clientId: session.user.id,
          status: "IN_PROGRESS"
        },
        select: {
          assignmentId: true
        },
        orderBy: {
          startedAt: "desc"
        }
      })
    : null;

  return (
    <header className={`sticky top-0 z-10 border-b bg-background/90 backdrop-blur ${accentColor ? `bg-gradient-to-r ${accentColor}` : ""}`}>
      <div className="mx-auto flex min-h-16 max-w-6xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-8">
          <Link href={isCoach ? "/coach/dashboard" : isClient ? "/client/dashboard" : "/"} className={`text-lg font-bold tracking-tight ${accentColor ? "text-white" : ""}`}>
          FitCoach
          </Link>

          {session ? (
            <nav className="flex flex-wrap items-center gap-2">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${accentColor ? "text-white/90 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                >
                  {link.label}
                </Link>
              ))}
              {activeWorkout ? (
                <Link
                  href={`/client/workout/${activeWorkout.assignmentId}/start`}
                  className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                >
                  Aktif Antrenmana Dön
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {!session ? (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Login
              </Link>
              <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className={`hidden text-sm font-medium sm:inline ${accentColor ? "text-white" : "text-foreground"}`}>
                {session.user.name}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <Button
                  type="submit"
                  variant="outline"
                  className={`${accentColor ? "border-white text-white hover:bg-white/10" : ""}`}
                >
                  Çıkış
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
