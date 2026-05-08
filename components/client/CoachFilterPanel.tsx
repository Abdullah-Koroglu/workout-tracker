"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";

export interface CoachFilters {
  minPrice: number | null;
  maxPrice: number | null;
  minExp: number | null;
  hasPackages: boolean;
  city: string;
}

interface CoachFilterPanelProps {
  filters: CoachFilters;
  onFiltersChange: (filters: CoachFilters) => void;
  isLoading?: boolean;
}

export function CoachFilterPanel({
  filters,
  onFiltersChange,
  isLoading = false,
}: CoachFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMinPriceChange = (value: string) => {
    onFiltersChange({
      ...filters,
      minPrice: value ? Number(value) : null,
    });
  };

  const handleMaxPriceChange = (value: string) => {
    onFiltersChange({
      ...filters,
      maxPrice: value ? Number(value) : null,
    });
  };

  const handleMinExpChange = (value: number | null) => {
    onFiltersChange({
      ...filters,
      minExp: value,
    });
  };

  const handleHasPackagesChange = (value: boolean) => {
    onFiltersChange({
      ...filters,
      hasPackages: value,
    });
  };

  const handleCityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      city: value,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      minPrice: null,
      maxPrice: null,
      minExp: null,
      hasPackages: false,
      city: "",
    });
  };

  const activeFilterCount = [
    filters.minPrice !== null,
    filters.maxPrice !== null,
    filters.minExp !== null,
    filters.hasPackages,
    filters.city.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <div className="mb-6">
      {/* Filter Header / Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between rounded-xl bg-white p-4 border border-slate-100 transition-all hover:shadow-md"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-slate-800">Filtreler</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-600">
              {activeFilterCount} aktif
            </span>
          )}
        </div>
        <ChevronDown
          className="h-4 w-4 text-slate-400 transition-transform"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Filter Panel */}
      {isExpanded && (
        <div className="mt-3 rounded-xl bg-white p-4 border border-slate-100 space-y-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

          {/* Price Range */}
          <div>
            <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Fiyat Aralığı
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 text-[10px] font-bold text-slate-400">Min (₺)</label>
                <input
                  type="number"
                  min={0}
                  value={filters.minPrice ?? ""}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  placeholder="0"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-100 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="mb-1 text-[10px] font-bold text-slate-400">Max (₺)</label>
                <input
                  type="number"
                  min={0}
                  value={filters.maxPrice ?? ""}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  placeholder="10000"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-100 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Tecrübe
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Hepsi", value: null },
                { label: "1+ yıl", value: 1 },
                { label: "3+ yıl", value: 3 },
                { label: "5+ yıl", value: 5 },
                { label: "10+ yıl", value: 10 },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => handleMinExpChange(value)}
                  disabled={isLoading}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    filters.minExp === value
                      ? "bg-orange-100 text-orange-600 border border-orange-300"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  } disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Has Packages */}
          <div>
            <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Paketler
            </label>
            <div className="flex gap-2">
              {[
                { label: "Hepsi", value: false },
                { label: "Paketi Olanlar", value: true },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => handleHasPackagesChange(value)}
                  disabled={isLoading}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    filters.hasPackages === value
                      ? "bg-orange-100 text-orange-600 border border-orange-300"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  } disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div>
            <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Şehir
            </label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholder="İstanbul, Ankara, İzmir..."
              disabled={isLoading}
              maxLength={100}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-100 disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
