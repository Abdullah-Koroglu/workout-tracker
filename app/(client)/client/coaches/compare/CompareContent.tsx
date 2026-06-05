"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, MapPin, MessageCircle, Star, TrendingUp } from "lucide-react";

import { buildLocalizedPath, formatCurrency, getDictionary, resolveLocale } from "@/lib/i18n";

interface CoachData {
  id: string;
  name: string;
  avatarUrl?: string | null;
  coachProfile: {
    bio: string | null;
    slogan: string | null;
    accentColor: string | null;
    specialties: string[] | null;
    experienceYears: number | null;
    city: string | null;
    rating: number | null;
    reviewCount: number | null;
    successRate: number | null;
    verifiedReviewCount?: number | null;
    trustScore?: {
      score: number;
      label: string;
      tone: "low" | "medium" | "high";
    } | null;
    packages: { id: string; title: string; price: number | null; isPopular: boolean }[];
  } | null;
}

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2);
}

function StatRow({
  label,
  values,
  render,
}: {
  label: string;
  values: (CoachData | null)[];
  render: (coach: CoachData) => React.ReactNode;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="w-28 py-3 pr-4 text-xs font-bold text-slate-500">{label}</td>
      {values.map((coach, index) =>
        coach ? (
          <td key={index} className="px-3 py-3 text-sm text-slate-700">
            {render(coach)}
          </td>
        ) : (
          <td key={index} className="px-3 py-3 text-sm text-slate-300">—</td>
        )
      )}
    </tr>
  );
}

export function CompareContent({ coachIds, lang }: { coachIds: string[]; lang?: string }) {
  const locale = resolveLocale(lang);
  const dictionary = getDictionary(locale);
  const [coaches, setCoaches] = useState<(CoachData | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const coachIdsKey = coachIds.join(",");

  useEffect(() => {
    if (coachIds.length === 0) {
      setLoading(false);
      return;
    }

    Promise.all(
      coachIds.map((id) =>
        fetch(`/api/marketplace/coaches/${id}`)
          .then((response) => response.json())
          .then((data) => data.coach as CoachData)
          .catch(() => null)
      )
    )
      .then(setCoaches)
      .finally(() => setLoading(false));
  }, [coachIds, coachIdsKey]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (coaches.length === 0 || coaches.every((coach) => coach === null)) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center">
        <p className="font-bold text-slate-600">{dictionary.coachCompare.empty}</p>
        <Link
          href={buildLocalizedPath("/client/coaches", locale)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700"
        >
          <ChevronLeft className="h-4 w-4" />
          {dictionary.coachCompare.backToDiscovery}
        </Link>
      </div>
    );
  }

  const validCoaches = coaches.filter((coach): coach is CoachData => coach !== null);

  return (
    <div className="space-y-6 pb-16">
      <Link
        href={buildLocalizedPath("/client/coaches", locale)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {dictionary.coachCompare.backToDiscovery}
      </Link>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800">{dictionary.coachCompare.title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {validCoaches.length} {dictionary.coachCompare.comparingCount}
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-2 md:p-5 lg:grid-cols-3"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
      >
        {validCoaches.map((coach) => {
          const accent = coach.coachProfile?.accentColor ?? "#F97316";

          return (
            <div key={coach.id} className="space-y-2 text-center">
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl text-lg font-black text-white"
                style={coach.avatarUrl ? {} : { background: `linear-gradient(135deg, ${accent}CC, ${accent})` }}
              >
                {coach.avatarUrl ? (
                  <Image src={coach.avatarUrl} alt={coach.name} width={56} height={56} unoptimized className="h-full w-full object-cover" />
                ) : (
                  getInitials(coach.name)
                )}
              </div>
              <p className="text-sm font-black text-slate-800">{coach.name}</p>
              {coach.coachProfile?.slogan ? <p className="line-clamp-2 text-xs text-slate-400">{coach.coachProfile.slogan}</p> : null}
              <Link
                href={buildLocalizedPath(`/client/coaches/${coach.id}`, locale)}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${accent}CC, ${accent})` }}
              >
                <MessageCircle className="h-3 w-3" />
                {dictionary.coachCompare.profile}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 md:hidden">
        {validCoaches.map((coach) => (
          <div key={coach.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl text-sm font-black text-white"
                style={coach.avatarUrl ? {} : { background: `linear-gradient(135deg, ${(coach.coachProfile?.accentColor ?? "#F97316")}CC, ${coach.coachProfile?.accentColor ?? "#F97316"})` }}
              >
                {coach.avatarUrl ? (
                  <Image src={coach.avatarUrl} alt={coach.name} width={48} height={48} unoptimized className="h-full w-full object-cover" />
                ) : (
                  getInitials(coach.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-800">{coach.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{coach.coachProfile?.city ?? dictionary.coachCompare.unspecified}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dictionary.coachCompare.trust}</p>
                <p className="mt-1 text-sm font-black text-emerald-700">
                  {coach.coachProfile?.trustScore ? `%${coach.coachProfile.trustScore.score}` : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dictionary.coachCompare.rating}</p>
                <p className="mt-1 text-sm font-black text-amber-500">
                  {coach.coachProfile?.rating != null ? Number(coach.coachProfile.rating).toFixed(1) : dictionary.coachCompare.noReviewsYet}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dictionary.coachCompare.experience}</p>
                <p className="mt-1 text-sm font-black text-slate-700">
                  {coach.coachProfile?.experienceYears != null ? coach.coachProfile.experienceYears : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dictionary.coachCompare.success}</p>
                <p className="mt-1 text-sm font-black text-green-600">
                  {coach.coachProfile?.successRate != null ? `%${coach.coachProfile.successRate}` : "—"}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dictionary.coachCompare.specialties}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(coach.coachProfile?.specialties ?? []).length > 0 ? (
                    (coach.coachProfile?.specialties ?? []).map((specialty) => (
                      <span key={specialty} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                        {specialty}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dictionary.coachCompare.packages}</p>
                <div className="mt-2 space-y-2">
                  {(coach.coachProfile?.packages ?? []).length > 0 ? (
                    coach.coachProfile?.packages.map((pkg) => (
                      <div key={pkg.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-700">{pkg.title}</p>
                        <p className="mt-1 text-sm font-black text-green-600">
                          {pkg.price != null ? formatCurrency(pkg.price, locale) : dictionary.coachCompare.askPrice}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">{dictionary.coachCompare.noPackages}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white md:block" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">{dictionary.coachCompare.basicInfo}</p>
        </div>
        <div className="px-5">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-28" />
                {validCoaches.map((coach) => (
                  <th key={coach.id} className="px-3 py-3 text-left text-xs font-black text-slate-500">
                    {coach.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <StatRow
                label={dictionary.coachCompare.trust}
                values={validCoaches}
                render={(coach) =>
                  coach.coachProfile?.trustScore ? (
                    <span className="font-black text-emerald-700">%{coach.coachProfile.trustScore.score}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )
                }
              />
              <StatRow
                label={dictionary.coachCompare.rating}
                values={validCoaches}
                render={(coach) =>
                  coach.coachProfile?.rating != null ? (
                    <span className="flex items-center gap-1 font-black text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-500" />
                      {Number(coach.coachProfile.rating).toFixed(1)}
                      {coach.coachProfile.reviewCount != null ? (
                        <span className="font-normal text-slate-400">({coach.coachProfile.reviewCount})</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-slate-400">{dictionary.coachCompare.noReviewsYet}</span>
                  )
                }
              />
              <StatRow
                label={dictionary.coachCompare.experience}
                values={validCoaches}
                render={(coach) =>
                  coach.coachProfile?.experienceYears != null ? (
                    <span className="font-bold">{coach.coachProfile.experienceYears}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )
                }
              />
              <StatRow
                label={dictionary.coachCompare.city}
                values={validCoaches}
                render={(coach) =>
                  coach.coachProfile?.city ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {coach.coachProfile.city}
                    </span>
                  ) : (
                    <span className="text-slate-400">{dictionary.coachCompare.unspecified}</span>
                  )
                }
              />
              <StatRow
                label={dictionary.coachCompare.success}
                values={validCoaches}
                render={(coach) =>
                  coach.coachProfile?.successRate != null ? (
                    <span className="flex items-center gap-1 font-black text-green-600">
                      <TrendingUp className="h-3.5 w-3.5" />%{coach.coachProfile.successRate}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )
                }
              />
              <StatRow
                label={dictionary.coachCompare.specialties}
                values={validCoaches}
                render={(coach) => {
                  const specialties = Array.isArray(coach.coachProfile?.specialties)
                    ? (coach.coachProfile.specialties as string[])
                    : [];
                  const accent = coach.coachProfile?.accentColor ?? "#F97316";

                  return specialties.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {specialties.map((specialty) => (
                        <span key={specialty} className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${accent}15`, color: accent }}>
                          {specialty}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  );
                }}
              />
            </tbody>
          </table>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white md:block" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">{dictionary.coachCompare.packages}</p>
        </div>
        <div className="grid gap-4 p-5" style={{ gridTemplateColumns: `repeat(${validCoaches.length}, 1fr)` }}>
          {validCoaches.map((coach) => {
            const packages = coach.coachProfile?.packages ?? [];
            return (
              <div key={coach.id} className="space-y-2">
                <p className="text-xs font-black text-slate-500">{coach.name}</p>
                {packages.length === 0 ? (
                  <p className="text-xs text-slate-400">{dictionary.coachCompare.noPackages}</p>
                ) : (
                  packages.map((pkg) => (
                    <div key={pkg.id} className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-700">{pkg.title}</p>
                        {pkg.isPopular ? (
                          <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-black text-orange-600">
                            {dictionary.coachCompare.popular}
                          </span>
                        ) : null}
                      </div>
                      {pkg.price != null ? (
                        <p className="text-sm font-black text-green-600">{formatCurrency(pkg.price, locale)}</p>
                      ) : (
                        <p className="text-xs text-slate-400">{dictionary.coachCompare.askPrice}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white md:block" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">{dictionary.coachCompare.about}</p>
        </div>
        <div className="grid gap-4 p-5" style={{ gridTemplateColumns: `repeat(${validCoaches.length}, 1fr)` }}>
          {validCoaches.map((coach) => (
            <div key={coach.id} className="space-y-1">
              <p className="text-xs font-black text-slate-500">{coach.name}</p>
              <p className="line-clamp-5 text-xs leading-relaxed text-slate-600">
                {coach.coachProfile?.bio ?? dictionary.coachCompare.noInfo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
