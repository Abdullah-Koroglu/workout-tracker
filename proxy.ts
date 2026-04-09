import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  const pathname = req.nextUrl.pathname;
  const session = req.auth;

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (!session && (pathname.startsWith("/coach") || pathname.startsWith("/client"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session?.user?.role === "COACH" && pathname.startsWith("/client")) {
    return NextResponse.redirect(new URL("/coach/dashboard", req.url));
  }

  if (session?.user?.role === "CLIENT" && pathname.startsWith("/coach")) {
    return NextResponse.redirect(new URL("/client/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"]
};