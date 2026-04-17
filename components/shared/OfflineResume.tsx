"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const LAST_ROUTE_KEY = "fitcoach-last-route";

export function OfflineResume() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/api") || pathname === "/offline") {
      return;
    }

    const query = searchParams.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;

    try {
      localStorage.setItem(LAST_ROUTE_KEY, fullPath);
    } catch {
      // no-op
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (typeof navigator === "undefined" || navigator.onLine) {
      return;
    }

    if (pathname !== "/" && pathname !== "/login") {
      return;
    }

    try {
      const saved = localStorage.getItem(LAST_ROUTE_KEY);
      if (!saved || saved === pathname || !saved.startsWith("/") || saved.startsWith("/api")) {
        return;
      }

      window.location.replace(saved);
    } catch {
      // no-op
    }
  }, [pathname]);

  return null;
}
