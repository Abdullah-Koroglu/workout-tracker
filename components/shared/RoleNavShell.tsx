"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
import Image from "next/image";
import { NotificationBell } from "./NotificationBell";

type Role = "COACH" | "CLIENT";
type SubscriptionTier = "FREE" | "TIER_1" | "TIER_2" | "AGENCY";

const TIER_BADGE: Record<SubscriptionTier, { label: string; color: string }> = {
  FREE:   { label: "Starter", color: "#64748B" },
  TIER_1: { label: "Pro",     color: "#3B82F6" },
  TIER_2: { label: "Elite",   color: "#F59E0B" },
  AGENCY: { label: "Agency",  color: "#8B5CF6" },
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const coachItems: NavItem[] = [
  { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/clients", label: "Client Roster", icon: Users },
  { href: "/coach/templates", label: "Antreman Oluştur", icon: ClipboardList },
  { href: "/coach/exercises", label: "Egzersizler", icon: Dumbbell },
  { href: "/coach/mobility", label: "Mobility Library", icon: StretchHorizontal },
  { href: "/coach/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/coach/billing", label: "Faturalandırma", icon: CreditCard },
  { href: "/coach/profile", label: "Profil", icon: User },
];

const clientItems: NavItem[] = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/workouts", label: "Antrenmanlar", icon: Dumbbell },
  { href: "/client/coaches", label: "Koçlar", icon: Compass },
  { href: "/client/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/client/profile", label: "Profil", icon: User },
];

const coachMobileItems: NavItem[] = [
  { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/templates", label: "Oluştur", icon: ClipboardList },
  { href: "/coach/clients", label: "Atletler", icon: Users },
  { href: "/coach/mobility", label: "Mobility", icon: StretchHorizontal },
  { href: "/coach/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/coach/profile", label: "Profil", icon: User },
];

const clientMobileItems: NavItem[] = [
  { href: "/client/dashboard", label: "Ana Sayfa", icon: LayoutDashboard },
  { href: "/client/coaches", label: "Koçlar", icon: Compass },
  // center FAB is rendered separately
  { href: "/client/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/client/profile", label: "Profil", icon: User },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
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

  const roleLabel = role === "COACH" ? "Coach" : "Client";
  const roleBrand = role === "COACH" ? "Fit Coach Pro" : "Fit Coach";
  const desktopActiveClass = role === "COACH"
    ? "bg-orange-600 text-white"
    : "bg-orange-600 text-white";

  return (
    <div className="relative min-h-screen">
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-slate-900 py-8 shadow-2xl md:flex">
        <div className="mb-10 flex items-center gap-3 px-6">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="h-8 w-8 rounded-full" />
          <div>
            <span className="text-xl font-extrabold tracking-tighter text-white">{roleBrand}</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
              {role === "COACH" ? "Elite Performance" : "Peak Focus"}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "mx-2 flex items-center gap-3 rounded-sm px-4 py-3 text-sm font-bold transition-all",
                  active
                    ? desktopActiveClass
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-2 mt-auto space-y-1 border-t border-slate-800 pt-6">
          <div className="mx-2 mt-6 flex items-center gap-3 rounded-lg bg-slate-800 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-orange-500 bg-slate-700 text-xs font-bold text-white">
              {(userName || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-bold text-white">{userName ?? "Kullanıcı"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="truncate text-[10px] text-slate-400">{roleLabel}</p>
                {role === "COACH" && tier && (
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black text-white"
                    style={{ background: TIER_BADGE[tier].color }}
                  >
                    {TIER_BADGE[tier].label}
                  </span>
                )}
              </div>
            </div>
          </div>
          {role === "COACH" && tier === "FREE" && (
            <Link
              href="/coach/billing"
              className="mx-2 mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-black transition-colors hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#fff" }}
            >
              ⚡ Pro'ya Geç
            </Link>
          )}
        </div>
      </aside>

      <main className={[
        "min-h-screen ",
        isMessagesRoute ? "pb-0" : "pb-24 md:pb-8 px-4"
      ].join(" ")}>
        <header className="fixed left-0 right-0 z-30 flex h-16 items-center justify-between bg-slate-900 px-6 backdrop-blur-md md:left-64 shadow-lg shadow-slate-900/10 text-slate-100">
          <div>
            {/* <h1 className="text-xl font-bold tracking-tight text-slate-900">{currentLabel}</h1> */}
            <GlobalBreadcrumb />
          </div>
          <div className="flex items-center gap-4">
            {/* <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                className="w-64 rounded-sm border-none bg-slate-100 py-1.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-500/20"
                placeholder="Search..."
                type="text"
              />
            </div> */}
            <button
              type="button"
              className="text-slate-100 transition-colors duration-200 hover:text-orange-500"
            >
              <NotificationBell />
            </button>
            {/* <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="text-slate-500 transition-colors duration-200 hover:text-orange-500"
              aria-label="Sign out"
            >
              <User className="h-5 w-5" />
            </button> */}
          </div>
        </header>

        <div className={[
          "mx-auto px-0",
          isMessagesRoute ? "pt-16 md:pt-16 md:pl-64" : "pt-20 md:pt-20 md:pl-64"
        ].join(" ")}>{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around rounded-t-xl bg-white/90 px-2 pb-4 backdrop-blur-lg shadow-[0_-4px_24px_rgba(0,0,0,0.06)] md:hidden">
        {role === "CLIENT" ? (
          <>
            {clientMobileItems.slice(0, 2).map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "flex flex-col items-center justify-center transition-colors duration-150",
                    active ? "scale-110 text-orange-600" : "text-slate-400 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                  <span className="mt-1 text-[11px] font-medium">{label}</span>
                </Link>
              );
            })}

            {/* Center Antrenman FAB */}
            <Link
              href="/client/workouts"
              className="relative -mt-8 flex flex-col items-center justify-center"
            >
              <div
                className={[
                  "flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95",
                  isActive(pathname, "/client/workouts")
                    ? "scale-105"
                    : "",
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
              <span
                className="mt-1 text-[11px] font-black"
                style={{ color: isActive(pathname, "/client/workouts") ? "#EA580C" : "#F97316" }}
              >
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
                    "flex flex-col items-center justify-center transition-colors duration-150",
                    active ? "scale-110 text-orange-600" : "text-slate-400 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                  <span className="mt-1 text-[11px] font-medium">{label}</span>
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
                  "flex flex-col items-center justify-center transition-colors duration-150",
                  active ? "scale-110 text-orange-600" : "text-slate-400 hover:text-slate-900",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 text-[11px] font-medium">{label}</span>
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
}
