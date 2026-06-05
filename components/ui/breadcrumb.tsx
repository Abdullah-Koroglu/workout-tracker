"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0 overflow-x-auto">
      <div className="flex min-w-0 items-center gap-2 whitespace-nowrap text-sm">
        {items.map((item, index) => {
          const resolvedHref =
            item.href === "/coach"
              ? "/coach/dashboard"
              : item.href === "/client"
                ? "/client/dashboard"
                : item.href;

          return (
            <div key={item.href} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
              {index === items.length - 1 ? (
                <span className="truncate text-sm font-bold tracking-tight text-slate-800 transition sm:text-base md:text-xl">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={resolvedHref}
                  className="truncate text-sm font-semibold tracking-tight text-slate-500 transition hover:text-slate-700 sm:text-base md:text-lg"
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
