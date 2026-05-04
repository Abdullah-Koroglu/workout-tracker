"use client";

import Link from "next/link";
import { useState } from "react";

import { TemplatesGrid } from "@/components/coach/TemplatesGrid";

type CategoryItem = {
  id: string;
  name: string;
  color: string;
};

type TemplateItem = {
  id: string;
  name: string;
  exerciseCount: number;
  category?: CategoryItem | null;
};

export function TemplatesPageClient({
  templates,
  categories
}: {
  templates: TemplateItem[];
  categories: CategoryItem[];
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered =
    activeCategory === null
      ? templates
      : activeCategory === "__none__"
      ? templates.filter((t) => !t.category)
      : templates.filter((t) => t.category?.id === activeCategory);

  const uncategorizedCount = templates.filter((t) => !t.category).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      {/* Category Filter Tabs */}
      {(categories.length > 0 || uncategorizedCount > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === null
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            Tümü
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${activeCategory === null ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
              {templates.length}
            </span>
          </button>

          {categories.map((cat) => {
            const count = templates.filter((t) => t.category?.id === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all border ${isActive ? "shadow-sm" : "opacity-70 hover:opacity-100"}`}
                style={{
                  borderColor: cat.color,
                  backgroundColor: isActive ? cat.color : "transparent",
                  color: isActive ? "#fff" : cat.color
                }}
              >
                {cat.name}
                <span
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]"
                  style={{
                    backgroundColor: isActive ? "rgba(255,255,255,0.2)" : cat.color + "22",
                    color: isActive ? "#fff" : cat.color
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {uncategorizedCount > 0 && (
            <button
              onClick={() => setActiveCategory("__none__")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all border border-slate-200 ${
                activeCategory === "__none__"
                  ? "bg-slate-100 text-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Kategorisiz
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                {uncategorizedCount}
              </span>
            </button>
          )}

          <Link
            href="/coach/templates/new"
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors ml-auto"
          >
            + Yeni Template
          </Link>
        </div>
      )}

      <TemplatesGrid templates={filtered} />
    </div>
  );
}
