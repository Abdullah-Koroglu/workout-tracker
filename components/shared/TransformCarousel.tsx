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
    <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-black text-slate-800">{item.title || "Dönüşüm Hikayesi"}</p>
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-600">Önce/Sonra</span>
      </div>

      <div className="relative h-64 overflow-hidden rounded-xl bg-slate-100">
        <img src={item.beforeUrl} alt="Önce" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${split}%` }}>
          <img src={item.afterUrl} alt="Sonra" className="h-full w-full object-cover" style={{ width: "100%", minWidth: "100%" }} />
        </div>
        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${split}%` }}>
          <div className="h-full w-0.5 -translate-x-1/2 bg-white shadow-[0_0_10px_rgba(0,0,0,0.35)]" />
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">Sonra</div>
        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">Önce</div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        className="mt-3 w-full accent-orange-500"
      />
    </div>
  );
}

export function TransformCarousel({ items }: { items: TransformationPhoto[] }) {
  const [index, setIndex] = useState(0);
  const hasItems = items.length > 0;

  const current = useMemo(() => items[index], [index, items]);

  if (!hasItems) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-slate-800">Dönüşüm Galerisi</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev - 1 + items.length) % items.length)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Önceki dönüşüm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % items.length)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Sonraki dönüşüm"
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
            aria-label={`Galeri öğesi ${dotIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
