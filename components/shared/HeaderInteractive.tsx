"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Dumbbell,
  MessageCircle,
  UserSearch,
  History,
  Menu,
  X,
  Activity,
  LogOut,
  Compass,
  User,
} from "lucide-react";

import { NotificationBell } from "@/components/shared/NotificationBell";

type NavItem = { href: string; label: string; icon: React.ElementType };

const coachLinks: NavItem[] = [
  { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/clients", label: "Clientler", icon: Users },
  { href: "/coach/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/coach/templates", label: "Template'ler", icon: ClipboardList },
  { href: "/coach/exercises", label: "Egzersizler", icon: Dumbbell },
  { href: "/coach/profile", label: "Profil", icon: User },
];

const clientLinks: NavItem[] = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/coaches", label: "Coach Bul", icon: UserSearch },
  { href: "/client/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/client/workouts", label: "Geçmiş", icon: History },
  { href: "/client/marketplace", label: "Keşfet", icon: Compass },
  { href: "/client/profile", label: "Profil", icon: User },
];

type Props = {
  role?: "COACH" | "CLIENT";
  userName?: string | null;
  initials: string;
  activeWorkoutHref?: string;
  avatarBg: string;
  roleBadgeClass: string;
  isCoach: boolean;
  isClient: boolean;
};

export function HeaderInteractive({
  role,
  userName,
  initials,
  activeWorkoutHref,
  avatarBg,
  roleBadgeClass,
  isCoach,
  isClient,
}: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = role === "COACH" ? coachLinks : role === "CLIENT" ? clientLinks : [];

  const getLinkClass = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    const base =
      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150";
    if (isActive) {
      return `${base} ${
        isCoach
          ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/40 dark:text-blue-400"
          : "bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/40 dark:text-emerald-400"
      }`;
    }
    return `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100`;
  };

  if (!role) {
    return (
      <>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Kayıt Ol
          </Link>
        </div>
       
      </> 
    );
  }

  return (
    <>
      {/* Desktop nav */}
      <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={getLinkClass(href)}>
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
        {activeWorkoutHref ? (
          <Link
            href={activeWorkoutHref}
            className="ml-1 flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            Aktif Antrenman
          </Link>
        ) : null}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User area */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Avatar + name — hidden on very small screens */}
        <div className="hidden items-center gap-2.5 sm:flex">
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${avatarBg}`}
          >
            {initials}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
              {userName}
            </span>
            {roleBadgeClass ? (
              <span
                className={`mt-0.5 rounded-full px-1.5 py-0 text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass}`}
              >
                {isCoach ? "Coach" : "Client"}
              </span>
            ) : null}
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          title="Çıkış Yap"
          className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 sm:px-3"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Çıkış</span>
        </button>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Menüyü aç/kapat"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown — absolute relative to sticky header */}
      {mobileOpen ? (
        <div className="absolute inset-x-0 top-full z-50 border-b border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95 lg:hidden">
          <div className="mx-auto max-w-6xl space-y-0.5 px-4 py-3">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`${getLinkClass(href)} w-full`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
            {activeWorkoutHref ? (
              <Link
                href={activeWorkoutHref}
                onClick={() => setMobileOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white"
              >
                <Activity className="h-4 w-4" />
                Aktif Antrenman
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
