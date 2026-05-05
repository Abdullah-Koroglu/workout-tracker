"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4 text-slate-100" />}
          {index === items.length - 1 ? (
            <span className="text-lg md:text-2xl font-bold tracking-tight text-slate-100 hover:text-slate-300 transition">{item.label}</span>
          ) : (
            <Link
              href={(item.label === "Client" || item.label === "Coach") ? "/" : item.href}
              className="text-lg md:text-2xl font-bold tracking-tight text-slate-100 hover:text-slate-300 transition"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
