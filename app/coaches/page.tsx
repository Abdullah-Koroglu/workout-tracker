import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Compass, MapPin, Search, ShieldCheck, Sparkles, Star } from "lucide-react";

import { LocaleToggle } from "@/components/shared/LocaleToggle";
import { formatCurrency, getDictionary, resolveLocale, buildLocalizedPath } from "@/lib/i18n";
import { getPublicMarketplace } from "@/lib/public-marketplace";

type PublicCoachSearchParams = Promise<{
  q?: string;
  city?: string;
  specialty?: string;
  lang?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: PublicCoachSearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const dictionary = getDictionary(locale);

  return {
    title: dictionary.publicMarketplace.metadataTitle,
    description: dictionary.publicMarketplace.metadataDescription,
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function PublicCoachesPage({
  searchParams,
}: {
  searchParams: PublicCoachSearchParams;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const dictionary = getDictionary(locale);
  const coaches = await getPublicMarketplace(params);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-600">
                <Compass className="h-3.5 w-3.5" />
                {dictionary.publicMarketplace.eyebrow}
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-900 lg:text-5xl">
                {dictionary.publicMarketplace.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                {dictionary.publicMarketplace.body}
              </p>
            </div>

            <LocaleToggle
              pathname="/coaches"
              locale={locale}
              tone="light"
              params={{
                q: params.q,
                city: params.city,
                specialty: params.specialty,
              }}
            />
          </div>

          <form className="mt-8 grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.4fr,1fr,1fr,auto]">
            <input type="hidden" name="lang" value={locale} />
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder={dictionary.publicMarketplace.searchPlaceholder}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </label>
            <input
              type="text"
              name="city"
              defaultValue={params.city ?? ""}
              placeholder={dictionary.publicMarketplace.cityPlaceholder}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
            />
            <input
              type="text"
              name="specialty"
              defaultValue={params.specialty ?? ""}
              placeholder={dictionary.publicMarketplace.specialtyPlaceholder}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-[50px] items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 px-5 text-sm font-black text-white shadow-sm transition hover:opacity-95"
            >
              {dictionary.publicMarketplace.filterButton}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-500">
              {coaches.length} {dictionary.publicMarketplace.listedCount}
            </p>
            <p className="text-xs text-slate-400">{dictionary.publicMarketplace.trustHint}</p>
          </div>
          <Link
            href={buildLocalizedPath("/register", locale, { role: "coach" })}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600"
          >
            {dictionary.publicMarketplace.listAsCoach}
          </Link>
        </div>

        {coaches.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {coaches.map((coach) => {
              const profile = coach.coachProfile;
              return (
                <article key={coach.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
                    <div className="flex items-start gap-4">
                      {coach.avatarUrl ? (
                        <Image
                          src={coach.avatarUrl}
                          alt={coach.name}
                          width={56}
                          height={56}
                          unoptimized
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-sm font-black text-white">
                          {getInitials(coach.name)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-lg font-black text-slate-900">{coach.name}</h2>
                          {profile.isVerified ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {profile.slogan ?? profile.bio ?? dictionary.publicMarketplace.profileFallback}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(profile.specialties as string[]).slice(0, 3).map((item) => (
                            <span key={item} className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-600">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-1 font-black text-slate-800">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {profile.city ?? dictionary.publicMarketplace.onlineFallback}
                        </div>
                        <div className="mt-0.5 text-slate-400">{dictionary.publicMarketplace.cityCoverage}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-1 font-black text-slate-800">
                          <Star className="h-3.5 w-3.5 text-orange-400" />
                          {profile.rating != null ? profile.rating.toFixed(1) : "-"}
                        </div>
                        <div className="mt-0.5 text-slate-400">
                          {profile.reviewCount ?? 0} {dictionary.publicMarketplace.reviews}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="font-black text-emerald-600">%{profile.trustScore.score}</div>
                        <div className="mt-0.5 text-slate-400">{dictionary.publicMarketplace.trustScore}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="font-black text-slate-800">
                          {profile.packages[0]?.price != null
                            ? formatCurrency(Number(profile.packages[0].price), locale)
                            : dictionary.publicMarketplace.askPrice}
                        </div>
                        <div className="mt-0.5 text-slate-400">{dictionary.publicMarketplace.startingPackage}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                        <Sparkles className="h-3.5 w-3.5" />
                        {profile.trustScore.label}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-emerald-800/90">{profile.trustScore.summary}</p>
                    </div>

                    <Link
                      href={buildLocalizedPath(`/coaches/${coach.id}`, locale)}
                      className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 text-sm font-black text-white shadow-sm transition hover:opacity-95"
                    >
                      {dictionary.publicMarketplace.inspectProfile}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm font-medium text-slate-500">
            {dictionary.publicMarketplace.emptyState}
          </div>
        )}
      </section>
    </main>
  );
}
