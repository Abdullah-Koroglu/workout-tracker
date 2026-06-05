"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  Compass,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  MessageCircle,
  StretchHorizontal,
  User,
  Users,
} from "lucide-react";

import { GlobalBreadcrumb } from "./GlobalBreadcrumb";
import { NotificationBell } from "./NotificationBell";
import { IncomingCallLayer } from "./IncomingCallLayer";

type Role = "COACH" | "CLIENT";
type SubscriptionTier = "FREE" | "TIER_1" | "TIER_2" | "AGENCY";

const TIER_BADGE: Record<SubscriptionTier, { label: string; color: string }> = {
  FREE: { label: "Starter", color: "#64748B" },
  TIER_1: { label: "Pro", color: "#3B82F6" },
  TIER_2: { label: "Elite", color: "#F59E0B" },
  AGENCY: { label: "Agency", color: "#8B5CF6" },
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const coachItems: NavItem[] = [
  { href: "/coach/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/coach/clients", label: "Danisanlar", icon: Users },
  { href: "/coach/templates", label: "Programlar", icon: ClipboardList },
  { href: "/coach/exercises", label: "Egzersizler", icon: Dumbbell },
  { href: "/coach/mobility", label: "Mobilite", icon: StretchHorizontal },
  { href: "/coach/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/coach/team", label: "Ekip", icon: Building2 },
  { href: "/coach/billing", label: "Abonelik", icon: CreditCard },
  { href: "/coach/profile", label: "Profil", icon: User },
];

const clientItems: NavItem[] = [
  { href: "/client/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/client/workouts", label: "Antrenmanlar", icon: Dumbbell },
  { href: "/client/coaches", label: "Koclar", icon: Compass },
  { href: "/client/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/client/profile", label: "Profil", icon: User },
];

const coachMobileItems: NavItem[] = [
  { href: "/coach/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/coach/templates", label: "Program", icon: ClipboardList },
  { href: "/coach/clients", label: "Atletler", icon: Users },
  { href: "/coach/mobility", label: "Mobilite", icon: StretchHorizontal },
  { href: "/coach/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/coach/profile", label: "Profil", icon: User },
];

const clientMobileItems: NavItem[] = [
  { href: "/client/dashboard", label: "Ana Sayfa", icon: LayoutDashboard },
  { href: "/client/coaches", label: "Koclar", icon: Compass },
  { href: "/client/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/client/profile", label: "Profil", icon: User },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function RoleNavShell({
  role,
  userName,
  tier,
  children,
}: {
  role: Role;
  userName?: string | null;
  tier?: SubscriptionTier | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMessagesRoute = pathname.startsWith("/client/messages") || pathname.startsWith("/coach/messages");
  const items = role === "COACH" ? coachItems : clientItems;
  const mobileItems = role === "COACH" ? coachMobileItems : clientMobileItems;
  const roleLabel = role === "COACH" ? "Koc" : "Danisan";

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <IncomingCallLayer />

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 px-3 py-6 shadow-2xl md:flex">
        <div className="mb-8 flex items-center gap-3 px-3">
          <Image src="/logo.png" alt="FitCoach" width={36} height={36} className="h-9 w-9 rounded-2xl" />
          <div>
            <span className="text-lg font-extrabold tracking-tight text-white">FitCoach</span>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-400/90">
              {role === "COACH" ? "Coach OS" : "Client Hub"}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all",
                  active
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-slate-800 pt-6">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-orange-500 bg-slate-700 text-xs font-bold text-white">
              {(userName || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-bold text-white">{userName ?? "Kullanici"}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <p className="truncate text-[10px] text-slate-400">{roleLabel}</p>
                {role === "COACH" && tier ? (
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black text-white"
                    style={{ background: TIER_BADGE[tier].color }}
                  >
                    {TIER_BADGE[tier].label}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {role === "COACH" && tier === "FREE" ? (
            <Link
              href="/coach/billing"
              className="flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[11px] font-black text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              Pro'ya gec
            </Link>
          ) : null}
        </div>
      </aside>

      <main className={["min-h-screen", isMessagesRoute ? "pb-0" : "pb-[calc(var(--app-mobile-nav-height)+2.5rem+env(safe-area-inset-bottom))] md:pb-8"].join(" ")}>
        <header className="fixed left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 text-slate-900 backdrop-blur md:left-64 md:px-6">
          <div className="min-w-0">
            <GlobalBreadcrumb />
          </div>
          <NotificationBell />
        </header>

        <div className={["app-page", isMessagesRoute ? "pt-16 md:pl-64" : "app-content md:pl-64"].join(" ")}>
          {children}
        </div>
      </main>

      {!isMessagesRoute ? (
        <nav className="fixed bottom-0 left-0 z-50 flex min-h-[calc(var(--app-mobile-nav-height)+env(safe-area-inset-bottom))] w-full items-end justify-around border-t border-slate-200/80 bg-white/95 px-2 pt-2 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur-lg md:hidden">
          {role === "CLIENT" ? (
            <>
              {clientMobileItems.slice(0, 2).map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 transition-colors duration-150",
                      active ? "scale-105 text-orange-600" : "text-slate-400 hover:text-slate-900",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="truncate text-[11px] font-medium">{label}</span>
                  </Link>
                );
              })}

              <Link href="/client/workouts" className="relative -mt-7 flex min-w-[72px] flex-col items-center justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div
                  className={[
                    "flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95",
                    isActive(pathname, "/client/workouts") ? "scale-105" : "",
                  ].join(" ")}
                  style={{
                    background: isActive(pathname, "/client/workouts")
                      ? "linear-gradient(135deg, #EA580C, #C2410C)"
                      : "linear-gradient(135deg, #F97316, #EA580C)",
                    boxShadow: "0 6px 20px rgba(234,88,12,0.45)",
                  }}
                >
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <span className="mt-1 text-[11px] font-black" style={{ color: isActive(pathname, "/client/workouts") ? "#EA580C" : "#F97316" }}>
                  Antrenman
                </span>
              </Link>

              {clientMobileItems.slice(2).map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 transition-colors duration-150",
                      active ? "scale-105 text-orange-600" : "text-slate-400 hover:text-slate-900",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="truncate text-[11px] font-medium">{label}</span>
                  </Link>
                );
              })}
            </>
          ) : (
            mobileItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 transition-colors duration-150",
                    active ? "scale-105 text-orange-600" : "text-slate-400 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate text-[11px] font-medium">{label}</span>
                </Link>
              );
            })
          )}
        </nav>
      ) : null}
    </div>
  );
}
