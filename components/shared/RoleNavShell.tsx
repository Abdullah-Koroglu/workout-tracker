"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Compass,
  Dumbbell,
  History,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  User,
  Users,
  ClipboardList,
  UserSearch,
} from "lucide-react";

type Role = "COACH" | "CLIENT";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const coachItems: NavItem[] = [
  { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/clients", label: "Clientler", icon: Users },
  { href: "/coach/templates", label: "Program", icon: ClipboardList },
  { href: "/coach/exercises", label: "Egzersiz", icon: Dumbbell },
  { href: "/coach/messages", label: "Mesaj", icon: MessageCircle },
  { href: "/coach/profile", label: "Profil", icon: User },
];

const clientItems: NavItem[] = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/workouts", label: "Geçmiş", icon: History },
  { href: "/client/coaches", label: "Koçlar", icon: UserSearch },
  { href: "/client/marketplace", label: "Keşfet", icon: Compass },
  { href: "/client/messages", label: "Mesaj", icon: MessageCircle },
  { href: "/client/profile", label: "Profil", icon: User },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function RoleNavShell({
  role,
  userName,
  children,
}: {
  role: Role;
  userName?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = role === "COACH" ? coachItems : clientItems;

  return (
    <div className="relative">
      <div className="grid gap-5 lg:grid-cols-[228px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-5 rounded-xl bg-card p-3 shadow-sm ring-1 ring-black/5">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {role === "COACH" ? "Coach Panel" : "Athlete Panel"}
            </p>
            <p className="truncate px-2 pt-1 text-sm font-semibold text-foreground">{userName ?? "Kullanıcı"}</p>

            <nav className="mt-3 space-y-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-primary/15 text-foreground ring-1 ring-primary/35"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-muted/70 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
              Çıkış Yap
            </button>
          </div>
        </aside>

        <section className="min-w-0 pb-20 lg:pb-0">{children}</section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-background/95 px-1 py-1.5 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-1">
          {items.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[10px] font-semibold",
                  active ? "bg-primary/15 text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
