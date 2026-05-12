"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Star, Briefcase } from "lucide-react";

interface SimilarCoach {
  id: string;
  name: string;
  avatarUrl?: string | null;
  coachProfile: {
    slogan: string | null;
    accentColor: string | null;
    specialties: string[] | null;
    experienceYears: number | null;
    rating: number | null;
    packages: { price: number | null }[];
  } | null;
}

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2);
}

export function SimilarCoaches({ coachId }: { coachId: string }) {
  const [coaches, setCoaches] = useState<SimilarCoach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marketplace/coaches/${coachId}/similar`)
      .then((r) => r.json())
      .then((d) => setCoaches(d.coaches ?? []))
      .finally(() => setLoading(false));
  }, [coachId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (coaches.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: "rgba(26,54,93,0.08)" }}
        >
          <Users className="h-4 w-4 text-slate-600" />
        </div>
        <h2 className="text-base font-black text-slate-800">Benzer Koçlar</h2>
      </div>

      <div className="space-y-3">
        {coaches.map((coach) => {
          const accent = coach.coachProfile?.accentColor ?? "#F97316";
          const specs = Array.isArray(coach.coachProfile?.specialties)
            ? (coach.coachProfile!.specialties as string[]).slice(0, 2)
            : [];
          const minPrice = coach.coachProfile?.packages
            .map((p) => p.price)
            .filter((p): p is number => p !== null)
            .reduce((min, p) => (p < min ? p : min), Infinity);

          return (
            <Link
              key={coach.id}
              href={`/client/coaches/${coach.id}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md border border-slate-100"
              style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
            >
              {/* Avatar */}
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white overflow-hidden"
                style={
                  coach.avatarUrl
                    ? {}
                    : { background: `linear-gradient(135deg, ${accent}CC, ${accent})` }
                }
              >
                {coach.avatarUrl ? (
                  <img src={coach.avatarUrl} alt={coach.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(coach.name)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{coach.name}</p>
                {coach.coachProfile?.slogan && (
                  <p className="text-xs text-slate-400 truncate">{coach.coachProfile.slogan}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {specs.map((s) => (
                    <span
                      key={s}
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: `${accent}15`, color: accent }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right meta */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {coach.coachProfile?.rating != null && (
                  <div className="flex items-center gap-0.5 text-[11px] font-black text-amber-500">
                    <Star className="h-3 w-3 fill-amber-500" />
                    {Number(coach.coachProfile.rating).toFixed(1)}
                  </div>
                )}
                {minPrice !== undefined && minPrice !== Infinity && (
                  <div className="flex items-center gap-0.5 text-[11px] font-bold text-slate-500">
                    <Briefcase className="h-3 w-3" />
                    {minPrice.toLocaleString("tr-TR")} ₺
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
