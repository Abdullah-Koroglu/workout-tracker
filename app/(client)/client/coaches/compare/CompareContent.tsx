"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Star,
  Briefcase,
  Award,
  MapPin,
  TrendingUp,
  MessageCircle,
  Check,
} from "lucide-react";

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
      <td className="py-3 pr-4 text-xs font-bold text-slate-500 w-28">{label}</td>
      {values.map((coach, i) =>
        coach ? (
          <td key={i} className="py-3 px-3 text-sm text-slate-700">
            {render(coach)}
          </td>
        ) : (
          <td key={i} className="py-3 px-3 text-slate-300 text-sm">—</td>
        )
      )}
    </tr>
  );
}

export function CompareContent({ coachIds }: { coachIds: string[] }) {
  const [coaches, setCoaches] = useState<(CoachData | null)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coachIds.length === 0) { setLoading(false); return; }
    Promise.all(
      coachIds.map((id) =>
        fetch(`/api/marketplace/coaches/${id}`)
          .then((r) => r.json())
          .then((d) => d.coach as CoachData)
          .catch(() => null)
      )
    ).then(setCoaches).finally(() => setLoading(false));
  }, [coachIds.join(",")]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (coaches.length === 0 || coaches.every((c) => c === null)) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center border border-slate-100">
        <p className="font-bold text-slate-600">Karşılaştırılacak koç bulunamadı</p>
        <Link
          href="/client/coaches"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Koç Bul
        </Link>
      </div>
    );
  }

  const validCoaches = coaches.filter((c): c is CoachData => c !== null);

  return (
    <div className="space-y-6 pb-16">
      <Link
        href="/client/coaches"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Koç Bul
      </Link>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800">Koç Karşılaştırma</h1>
        <p className="mt-1 text-sm text-slate-400">{validCoaches.length} koç karşılaştırılıyor</p>
      </div>

      {/* Coach Header Cards */}
      <div
        className="grid gap-4 overflow-hidden rounded-2xl bg-white border border-slate-100 p-5"
        style={{
          gridTemplateColumns: `160px repeat(${validCoaches.length}, 1fr)`,
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div />
        {validCoaches.map((coach) => {
          const accent = coach.coachProfile?.accentColor ?? "#F97316";
          return (
            <div key={coach.id} className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black text-white overflow-hidden"
                style={coach.avatarUrl ? {} : { background: `linear-gradient(135deg, ${accent}CC, ${accent})` }}>
                {coach.avatarUrl
                  ? <img src={coach.avatarUrl} alt={coach.name} className="h-full w-full object-cover" />
                  : getInitials(coach.name)}
              </div>
              <p className="text-sm font-black text-slate-800">{coach.name}</p>
              {coach.coachProfile?.slogan && (
                <p className="text-xs text-slate-400 line-clamp-2">{coach.coachProfile.slogan}</p>
              )}
              <Link
                href={`/client/coaches/${coach.id}`}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${accent}CC, ${accent})` }}
              >
                <MessageCircle className="h-3 w-3" />
                Profil
              </Link>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div
        className="overflow-hidden rounded-2xl bg-white border border-slate-100"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
      >
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Temel Bilgiler</p>
        </div>
        <div className="px-5">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-28" />
                {validCoaches.map((c) => (
                  <th key={c.id} className="py-3 px-3 text-xs font-black text-slate-500 text-left">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <StatRow
                label="⭐ Puan"
                values={validCoaches}
                render={(c) =>
                  c.coachProfile?.rating != null ? (
                    <span className="flex items-center gap-1 font-black text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-500" />
                      {Number(c.coachProfile.rating).toFixed(1)}
                      {c.coachProfile.reviewCount != null && (
                        <span className="text-slate-400 font-normal">({c.coachProfile.reviewCount})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400">Henüz yorum yok</span>
                  )
                }
              />
              <StatRow
                label="📅 Deneyim"
                values={validCoaches}
                render={(c) =>
                  c.coachProfile?.experienceYears != null ? (
                    <span className="font-bold">{c.coachProfile.experienceYears} yıl</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )
                }
              />
              <StatRow
                label="📍 Şehir"
                values={validCoaches}
                render={(c) =>
                  c.coachProfile?.city ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {c.coachProfile.city}
                    </span>
                  ) : (
                    <span className="text-slate-400">Belirtilmemiş</span>
                  )
                }
              />
              <StatRow
                label="📈 Başarı"
                values={validCoaches}
                render={(c) =>
                  c.coachProfile?.successRate != null ? (
                    <span className="flex items-center gap-1 font-black text-green-600">
                      <TrendingUp className="h-3.5 w-3.5" />
                      %{c.coachProfile.successRate}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )
                }
              />
              <StatRow
                label="🎯 Uzmanlık"
                values={validCoaches}
                render={(c) => {
                  const specs = Array.isArray(c.coachProfile?.specialties)
                    ? (c.coachProfile!.specialties as string[])
                    : [];
                  const accent = c.coachProfile?.accentColor ?? "#F97316";
                  return (
                    <div className="flex flex-wrap gap-1">
                      {specs.length > 0 ? specs.map((s) => (
                        <span
                          key={s}
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: `${accent}15`, color: accent }}
                        >
                          {s}
                        </span>
                      )) : <span className="text-slate-400">—</span>}
                    </div>
                  );
                }}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Packages */}
      <div
        className="overflow-hidden rounded-2xl bg-white border border-slate-100"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
      >
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Paketler</p>
        </div>
        <div
          className="grid gap-4 p-5"
          style={{ gridTemplateColumns: `repeat(${validCoaches.length}, 1fr)` }}
        >
          {validCoaches.map((coach) => {
            const pkgs = coach.coachProfile?.packages ?? [];
            return (
              <div key={coach.id} className="space-y-2">
                <p className="text-xs font-black text-slate-500">{coach.name}</p>
                {pkgs.length === 0 ? (
                  <p className="text-xs text-slate-400">Paket yok</p>
                ) : (
                  pkgs.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-slate-700">{pkg.title}</p>
                        {pkg.isPopular && (
                          <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-black text-orange-600">
                            Popüler
                          </span>
                        )}
                      </div>
                      {pkg.price != null ? (
                        <p className="text-sm font-black text-green-600">
                          {pkg.price.toLocaleString("tr-TR")} ₺
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">Fiyat sor</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bio */}
      <div
        className="overflow-hidden rounded-2xl bg-white border border-slate-100"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
      >
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Hakkında</p>
        </div>
        <div
          className="grid gap-4 p-5"
          style={{ gridTemplateColumns: `repeat(${validCoaches.length}, 1fr)` }}
        >
          {validCoaches.map((coach) => (
            <div key={coach.id} className="space-y-1">
              <p className="text-xs font-black text-slate-500">{coach.name}</p>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-5">
                {coach.coachProfile?.bio ?? "Bilgi yok"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
