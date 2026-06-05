"use client";

import Link from "next/link";
import { useState } from "react";
import type { SubscriptionTier } from "@prisma/client";
import { Lock } from "lucide-react";

import { TemplatesGrid } from "@/components/coach/TemplatesGrid";
import { TIER_CONFIG } from "@/lib/tier-limits";

type CategoryItem = { id: string; name: string; color: string };
type TemplateItem = {
  id: string;
  name: string;
  exerciseCount: number;
  category?: CategoryItem | null;
};

export function TemplatesPageClient({
  templates,
  categories,
  templateCount,
  maxTemplates,
  canAdd,
  tier,
}: {
  templates: TemplateItem[];
  categories: CategoryItem[];
  templateCount: number;
  maxTemplates: number | null;
  canAdd: boolean;
  tier: SubscriptionTier;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered =
    activeCategory === null
      ? templates
      : activeCategory === "__none__"
        ? templates.filter((template) => !template.category)
        : templates.filter((template) => template.category?.id === activeCategory);

  const uncategorizedCount = templates.filter((template) => !template.category).length;
  const tierCfg = TIER_CONFIG[tier];
  const isAtLimit = maxTemplates !== null && templateCount >= maxTemplates;

  return (
    <div className="space-y-6">
      {maxTemplates !== null && (
        <div
          className="flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{
            background: isAtLimit ? "#FEE2E2" : "#F8FAFC",
            border: `1px solid ${isAtLimit ? "#FECACA" : "#E2E8F0"}`,
            borderLeft: `3px solid ${isAtLimit ? "#EF4444" : tierCfg.color}`,
          }}
        >
          <div className="flex items-center gap-2.5">
            {isAtLimit && <Lock className="h-4 w-4 shrink-0 text-red-500" />}
            <div>
              <p className="text-[12px] font-black" style={{ color: isAtLimit ? "#DC2626" : "#475569" }}>
                {isAtLimit ? "Şablon limitine ulaştınız" : "Şablon Kotası"}
              </p>
              <p className="text-[11px]" style={{ color: isAtLimit ? "#EF4444" : "#94A3B8" }}>
                {templateCount} / {maxTemplates} şablon kullanılıyor
              </p>
            </div>
          </div>
          {isAtLimit ? (
            <Link
              href="/coach/billing"
              className="inline-flex shrink-0 items-center justify-center rounded-xl px-3 py-2 text-[11px] font-black text-white"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              Planı Yükselt →
            </Link>
          ) : (
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((templateCount / maxTemplates) * 100))}%`,
                  background: templateCount / maxTemplates > 0.8 ? "#F59E0B" : tierCfg.color,
                }}
              />
            </div>
          )}
        </div>
      )}

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

        {categories.map((category) => {
          const count = templates.filter((template) => template.category?.id === category.id).length;
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${isActive ? "shadow-sm" : "opacity-70 hover:opacity-100"}`}
              style={{
                borderColor: category.color,
                backgroundColor: isActive ? category.color : "transparent",
                color: isActive ? "#fff" : category.color,
              }}
            >
              {category.name}
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]"
                style={{
                  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : `${category.color}22`,
                  color: isActive ? "#fff" : category.color,
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
            className={`rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold transition-all ${
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

        {canAdd ? (
          <Link
            href="/coach/templates/new"
            className="w-full rounded-full bg-emerald-600 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:ml-auto sm:w-auto"
          >
            + Yeni Şablon
          </Link>
        ) : (
          <Link
            href="/coach/billing"
            className="flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors sm:ml-auto sm:w-auto"
            style={{ background: "#94A3B8" }}
            title={`Limit doldu (${templateCount}/${maxTemplates}). Planı yükseltin.`}
          >
            <Lock className="h-3.5 w-3.5" />
            Limit Doldu
          </Link>
        )}
      </div>

      <TemplatesGrid templates={filtered} />
    </div>
  );
}
