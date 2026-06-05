import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  const pathname = req.nextUrl.pathname;
  const session = req.auth;
  const isCoachArea = pathname === "/coach" || pathname.startsWith("/coach/");
  const isClientArea = pathname === "/client" || pathname.startsWith("/client/");
  const isMessagesArea = pathname === "/messages" || pathname.startsWith("/messages/");

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (!session && (isCoachArea || isClientArea || isMessagesArea)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session?.user?.role === "COACH" && isClientArea) {
    return NextResponse.redirect(new URL("/coach/dashboard", req.url));
  }

  if (session?.user?.role === "CLIENT" && isCoachArea) {
    return NextResponse.redirect(new URL("/client/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|uploads/|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|css|js|map|txt|xml|woff|woff2)$).*)"
  ]
};
