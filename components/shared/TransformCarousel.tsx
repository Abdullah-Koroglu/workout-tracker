"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type TransformationPhoto = {
  beforeUrl: string;
  afterUrl: string;
  title?: string;
};

function BeforeAfterCard({ item }: { item: TransformationPhoto }) {
  const [split, setSplit] = useState(50);

  return (
    <div
      className="w-full max-w-full overflow-hidden rounded-2xl bg-white"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm font-black text-slate-800">
            {item.title || "Donusum Hikayesi"}
          </p>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
            style={{ background: "rgba(249,115,22,0.1)", color: "#EA580C" }}
          >
            Once/Sonra
          </span>
        </div>
      </div>

      <div className="relative h-72 overflow-hidden bg-slate-100">
        <img src={item.beforeUrl} alt="Once" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${split}%` }}>
          <img
            src={item.afterUrl}
            alt="Sonra"
            className="h-full w-full object-cover"
            style={{ width: "100%", minWidth: "100%" }}
          />
        </div>
        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${split}%` }}>
          <div className="h-full w-0.5 -translate-x-1/2 bg-white shadow-[0_0_10px_rgba(0,0,0,0.35)]" />
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
          Sonra
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
          Once
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500">Surukle veya kaydir</span>
          <span className="shrink-0 text-xs font-black text-slate-800">{split}% Sonra</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          className="h-2 w-full rounded accent-orange-500"
        />
      </div>
    </div>
  );
}

export function TransformCarousel({ items }: { items: TransformationPhoto[] }) {
  const [index, setIndex] = useState(0);
  const hasItems = items.length > 0;

  const current = useMemo(() => items[index], [index, items]);

  if (!hasItems) return null;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-slate-800">Donusum Galerisi</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev - 1 + items.length) % items.length)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Onceki donusum"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % items.length)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Sonraki donusum"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {current ? <BeforeAfterCard item={current} /> : null}

      <div className="flex gap-1.5">
        {items.map((_, dotIndex) => (
          <button
            key={dotIndex}
            type="button"
            onClick={() => setIndex(dotIndex)}
            className={`h-2 rounded-full transition-all ${dotIndex === index ? "w-6 bg-orange-500" : "w-2 bg-slate-300"}`}
            aria-label={`Galeri ogesi ${dotIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
