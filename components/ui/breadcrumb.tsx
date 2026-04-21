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
          {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          {index === items.length - 1 ? (
            <span className="md:text-xl font-bold tracking-tight text-slate-900">{item.label}</span>
          ) : (
            <Link
              href={(item.label === "Client" || item.label === "Coach") ? "/" : item.href}
              className="md:text-xl font-bold tracking-tight text-slate-900 hover:text-slate-700 transition"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
