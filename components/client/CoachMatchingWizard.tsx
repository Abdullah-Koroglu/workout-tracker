"use client";

import { Sparkles } from "lucide-react";

import type { CoachFilters } from "@/components/client/CoachFilterPanel";

type MatchGoal = "fatLoss" | "performance" | "habit" | "mobility";
type MatchBudget = "budget" | "standard" | "premium";
type MatchLevel = "beginner" | "intermediate" | "advanced";
type MatchPreference = "online" | "istanbul" | "ankara" | "izmir" | "anywhere";

export type CoachMatchDraft = {
  goal: MatchGoal;
  budget: MatchBudget;
  level: MatchLevel;
  preference: MatchPreference;
};

type Props = {
  isLoading?: boolean;
  onApply: (payload: {
    filters: CoachFilters;
    specialty: string;
    query: string;
    headline: string;
  }) => void;
};

const DEFAULT_DRAFT: CoachMatchDraft = {
  goal: "fatLoss",
  budget: "standard",
  level: "beginner",
  preference: "online",
};

export function CoachMatchingWizard({ isLoading = false, onApply }: Props) {
  const draft = DEFAULT_DRAFT;

  const applyDraft = () => {
    const filters: CoachFilters = {
      minPrice: null,
      maxPrice: null,
      minExp: null,
      hasPackages: true,
      city: "",
      segment: "all",
      verifiedOnly: false,
    };

    let specialty = "";
    let headline = "Sana uygun koçlar";

    if (draft.goal === "fatLoss") {
      specialty = "Kilo Verme";
      filters.segment = "transformation";
      headline = "Yağ kaybı ve dönüşüm odaklı koçlar";
    }

    if (draft.goal === "performance") {
      specialty = "Performans";
      filters.segment = "performance";
      filters.minExp = 3;
      filters.verifiedOnly = true;
      headline = "Performans ve sonuç odaklı koçlar";
    }

    if (draft.goal === "habit") {
      specialty = "Yeni Başlayan";
      headline = "Alışkanlık kurmaya uygun koçlar";
    }

    if (draft.goal === "mobility") {
      specialty = "Online Koçluk";
      filters.segment = "online";
      headline = "Esneklik ve sürdürülebilir rutin için koçlar";
    }

    if (draft.budget === "budget") {
      filters.segment = "affordable";
      filters.maxPrice = 3000;
    }

    if (draft.budget === "standard") {
      filters.minPrice = 2000;
      filters.maxPrice = 5500;
    }

    if (draft.budget === "premium") {
      filters.minPrice = 5000;
      filters.segment = draft.goal === "performance" ? "performance" : "highlyRated";
      filters.verifiedOnly = true;
    }

    if (draft.level === "intermediate") {
      filters.minExp = Math.max(filters.minExp ?? 0, 3);
    }

    if (draft.level === "advanced") {
      filters.minExp = Math.max(filters.minExp ?? 0, 5);
      filters.segment = draft.goal === "performance" ? "performance" : "highlyRated";
      filters.verifiedOnly = true;
    }

    if (draft.preference === "istanbul") filters.city = "İstanbul";
    if (draft.preference === "ankara") filters.city = "Ankara";
    if (draft.preference === "izmir") filters.city = "İzmir";
    if (draft.preference === "online" && filters.segment === "all") filters.segment = "online";

    onApply({
      filters,
      specialty,
      query: "",
      headline,
    });
  };

  return (
    <section
      className="rounded-2xl border border-slate-100 bg-white p-5"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Hızlı Eşleştirme
          </p>
          <p className="mt-1 text-lg font-black text-slate-800">
            Hedefinden başlayıp koç bul
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            Amaç, bütçe, seviye ve tercihine göre marketplace’i tek hamlede daralt.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50">
          <Sparkles className="h-5 w-5 text-orange-500" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hedef</p>
          <p className="mt-1 text-sm font-bold text-slate-700">Yağ kaybı, performans, rutin, mobilite</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bütçe</p>
          <p className="mt-1 text-sm font-bold text-slate-700">Uygun, standart, premium</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Seviye</p>
          <p className="mt-1 text-sm font-bold text-slate-700">Başlangıç, orta, ileri</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tercih</p>
          <p className="mt-1 text-sm font-bold text-slate-700">Online veya şehir bazlı</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {[
          { label: "Yağ Kaybı / Uygun Fiyat", draft: { ...DEFAULT_DRAFT, goal: "fatLoss", budget: "budget" as const, level: "beginner" as const } },
          { label: "Performans / Premium", draft: { ...DEFAULT_DRAFT, goal: "performance", budget: "premium" as const, level: "advanced" as const } },
          { label: "Başlangıç / Online", draft: { ...DEFAULT_DRAFT, goal: "habit", budget: "standard" as const, preference: "online" as const } },
          { label: "İstanbul / Dönüşüm", draft: { ...DEFAULT_DRAFT, goal: "fatLoss", budget: "standard" as const, preference: "istanbul" as const } },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={isLoading}
            onClick={() => {
              const next = preset.draft;
              const filters: CoachFilters = {
                minPrice: null,
                maxPrice: null,
                minExp: null,
                hasPackages: true,
                city: "",
                segment: "all",
                verifiedOnly: false,
              };

              let specialty = "";
              const headline = preset.label;

              if (next.goal === "fatLoss") {
                specialty = "Kilo Verme";
                filters.segment = "transformation";
              }
              if (next.goal === "performance") {
                specialty = "Performans";
                filters.segment = "performance";
                filters.verifiedOnly = true;
                filters.minExp = 5;
              }
              if (next.goal === "habit") {
                specialty = "Yeni Başlayan";
                filters.segment = next.preference === "online" ? "online" : "affordable";
              }
              if (next.budget === "budget") filters.maxPrice = 3000;
              if (next.budget === "standard") {
                filters.minPrice = 2000;
                filters.maxPrice = 5500;
              }
              if (next.budget === "premium") filters.minPrice = 5000;
              if (next.preference === "istanbul") filters.city = "İstanbul";

              onApply({ filters, specialty, query: "", headline });
            }}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={applyDraft}
        disabled={isLoading}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        Önerilen koçları getir
      </button>
    </section>
  );
}
