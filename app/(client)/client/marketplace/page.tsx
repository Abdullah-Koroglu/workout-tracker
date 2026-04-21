"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Briefcase, Loader2, Search, Star, Users, X } from "lucide-react";

type CoachItem = {
  id: string;
  name: string;
  coachProfile: {
    bio: string | null;
    specialties: string[] | null;
    experienceYears: number | null;
    packages: { id: string }[];
  } | null;
};

const POPULAR_SPECIALTIES = [
  "Kilo Verme",
  "Güç Antrenmanı",
  "Hacim Kazanma",
  "Kardiyovasküler",
  "Sporcu Performansı",
];

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2);
}

export default function MarketplacePage() {
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");

  const fetchCoaches = useCallback(async (q: string, spec: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (spec) params.set("specialty", spec);
    const res = await fetch(`/api/marketplace/coaches?${params.toString()}`);
    const data = await res.json() as { coaches: CoachItem[] };
    setCoaches(data.coaches ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoaches("", "");
  }, [fetchCoaches]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCoaches(query, specialty);
  };

  const clearFilters = () => {
    setQuery("");
    setSpecialty("");
    fetchCoaches("", "");
  };

  const hasFilters = query || specialty;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Danışan Paneli</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">Koç Keşfet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hedeflerinize uygun koçu bulun ve iletişime geçin.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Koç adı ile ara..."
              className="h-11 w-full rounded-xl border-0 bg-card pl-10 pr-4 text-sm shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-br from-primary to-[hsl(24_95%_60%)] px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-105 transition"
          >
            Ara
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-2xl border px-3 text-muted-foreground hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Specialty filter pills */}
        <div className="flex flex-wrap gap-2">
          {POPULAR_SPECIALTIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const next = specialty === s ? "" : s;
                setSpecialty(next);
                fetchCoaches(query, next);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                specialty === s
                  ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                  : "bg-card text-muted-foreground ring-1 ring-black/10 hover:text-primary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : coaches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {hasFilters ? "Arama kriterlerine uygun koç bulunamadı." : "Henüz profil oluşturmuş koç bulunmuyor."}
          </p>
          {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-xs text-primary hover:underline">
              Filtreleri temizle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
          {coaches.map((coach) => {
            const profile = coach.coachProfile;
            const specs = Array.isArray(profile?.specialties) ? profile.specialties as string[] : [];
            const pkgCount = profile?.packages.length ?? 0;

            return (
              <Link
                key={coach.id}
                href={`/client/marketplace/${coach.id}`}
                className="group flex flex-col rounded-xl bg-card p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md md:p-5"
              >
                {/* Avatar + name */}
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-base font-black text-white shadow-sm">
                    {getInitials(coach.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 leading-tight group-hover:text-primary transition">
                      {coach.name}
                    </p>
                    {profile?.experienceYears != null && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 text-amber-500" />
                        {profile.experienceYears} yıl tecrübe
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile?.bio && (
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                {/* Specialties */}
                {specs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {specs.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-foreground"
                      >
                        {s}
                      </span>
                    ))}
                    {specs.length > 4 && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        +{specs.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Package count */}
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-black/10">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    {pkgCount > 0 ? `${pkgCount} paket` : "Paket bilgisi yok"}
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:underline">
                    Profili Gör →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
