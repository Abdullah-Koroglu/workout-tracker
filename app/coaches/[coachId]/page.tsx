import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Award, Briefcase, ExternalLink, MapPin, MessageCircle, ShieldCheck, Star, Users } from "lucide-react";

import { ReviewCard } from "@/components/coach/ReviewCard";
import { LocaleToggle } from "@/components/shared/LocaleToggle";
import { CoachExtendedInfo } from "@/components/shared/CoachExtendedInfo";
import { PageHero } from "@/components/shared/PageHero";
import { TransformCarousel, type TransformationPhoto } from "@/components/shared/TransformCarousel";
import { buildLocalizedPath, formatCurrency, getDictionary, resolveLocale } from "@/lib/i18n";
import { getPublicCoachProfile } from "@/lib/public-coach-profile";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type PageProps = {
  params: Promise<{ coachId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const [{ coachId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(rawSearchParams.lang);
  const dictionary = getDictionary(locale);
  const data = await getPublicCoachProfile(coachId);

  if (!data) {
    return { title: dictionary.publicCoachProfile.notFoundTitle };
  }

  const profile = data.coach.coachProfile!;
  const specialties = Array.isArray(profile.specialties) ? (profile.specialties as string[]) : [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://fitcoach.akoroglu.com.tr";
  const title = `${data.coach.name} | ${profile.city ?? dictionary.publicCoachProfile.onlineCoachFallback}`;
  const description = [
    profile.slogan ?? profile.bio ?? `${data.coach.name} ${dictionary.publicCoachProfile.onlineCoachFallback}`,
    specialties.length > 0 ? `${dictionary.publicCoachProfile.specialtiesLabel}: ${specialties.slice(0, 3).join(", ")}` : null,
    profile.reviewCount ? `${profile.reviewCount} ${dictionary.publicCoachProfile.reviewsLabel}` : null,
    data.minPackagePrice
      ? dictionary.publicCoachProfile.packagesStartingAt.replace("{price}", formatCurrency(data.minPackagePrice, locale))
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const canonical = `${appUrl}${buildLocalizedPath(`/coaches/${coachId}`, locale)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
      images: data.avatarUrl ? [{ url: data.avatarUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.avatarUrl ? [data.avatarUrl] : undefined,
    },
  };
}

export default async function PublicCoachProfilePage({
  params,
  searchParams,
}: PageProps) {
  const [{ coachId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(rawSearchParams.lang);
  const dictionary = getDictionary(locale);
  const data = await getPublicCoachProfile(coachId);

  if (!data) return notFound();

  const {
    coach,
    avatarUrl,
    verifiedReviewCount,
    reviews,
    transformationPhotos,
    beforeAfterStories,
    profileQuality,
    trustScore,
  } = data;
  const profile = coach.coachProfile!;
  const specialties = Array.isArray(profile.specialties) ? (profile.specialties as string[]) : [];
  const languages = Array.isArray(profile.languages) ? (profile.languages as string[]) : null;
  const certifications = Array.isArray(profile.certifications)
    ? (profile.certifications as { name: string; issuer?: string; year?: number }[])
    : null;
  const education = Array.isArray(profile.education)
    ? (profile.education as { school: string; degree?: string; year?: number }[])
    : null;
  const faqs = Array.isArray(profile.faqs) ? (profile.faqs as { q: string; a: string }[]) : null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://fitcoach.akoroglu.com.tr";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: coach.name,
    description: profile.slogan ?? profile.bio ?? undefined,
    image: avatarUrl ?? undefined,
    url: `${appUrl}${buildLocalizedPath(`/coaches/${coach.id}`, locale)}`,
    homeLocation: profile.city ? { "@type": "Place", name: profile.city } : undefined,
    knowsAbout: specialties,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${coach.name} ${dictionary.publicCoachProfile.packagesEyebrow.toLowerCase()}`,
      itemListElement: profile.packages.map((pkg) => ({
        "@type": "Offer",
        name: pkg.title,
        description: pkg.description ?? undefined,
        price: pkg.price != null ? Number(pkg.price) : undefined,
        priceCurrency: "TRY",
      })),
    },
    aggregateRating: profile.rating && profile.reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(profile.rating),
          reviewCount: profile.reviewCount,
        }
      : undefined,
  };

  const loginHref = buildLocalizedPath("/login", locale, { next: `/client/coaches/${coach.id}` });

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden space-y-6 px-4 pb-16 pt-4">
      <Script
        id={`coach-${coach.id}-jsonld`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="flex justify-end">
        <LocaleToggle pathname={`/coaches/${coach.id}`} locale={locale} tone="light" />
      </div>

      <PageHero
        title={coach.name}
        subtitle={profile.slogan ?? (profile.city ? `${profile.city} merkezli online kocluk` : undefined)}
        variant="light"
        avatar={{ initials: getInitials(coach.name), variant: "navy", imageUrl: avatarUrl }}
        statBoxes={[
          { label: dictionary.publicCoachProfile.cityStat, value: profile.city ?? "Online", icon: MapPin },
          { label: dictionary.publicCoachProfile.packageStat, value: `${profile.packages.length}`, icon: Briefcase },
          { label: dictionary.publicCoachProfile.reviewStat, value: `${profile.reviewCount ?? 0}`, icon: Star },
        ]}
      >
        {profile.bio ? <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{profile.bio}</p> : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {specialties.slice(0, 8).map((specialty) => (
            <span key={specialty} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
              {specialty}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={loginHref}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 px-5 text-sm font-black text-white shadow-sm transition hover:opacity-95"
          >
            {dictionary.publicCoachProfile.connectAsClient}
          </Link>
          {profile.socialMediaUrl ? (
            <a
              href={profile.socialMediaUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
            >
              <ExternalLink className="h-4 w-4" />
              {dictionary.publicCoachProfile.socialMedia}
            </a>
          ) : null}
        </div>
      </PageHero>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,0.9fr]">
        <div className="space-y-6">
          {transformationPhotos.length > 0 ? <TransformCarousel items={transformationPhotos as TransformationPhoto[]} /> : null}

          {beforeAfterStories.length > 0 ? (
            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50">
                  <Award className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600">
                    {dictionary.publicCoachProfile.successStoriesEyebrow}
                  </p>
                  <h2 className="text-lg font-black text-slate-900">{dictionary.publicCoachProfile.successStoriesTitle}</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(beforeAfterStories as Array<{ title?: string; result?: string; summary?: string }>).slice(0, 4).map((story, index) => (
                  <div key={`${story.title ?? "story"}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-sm font-black text-slate-800">
                      {story.title ?? dictionary.publicCoachProfile.successStoryFallback.replace("{index}", String(index + 1))}
                    </div>
                    {story.result ? <div className="mt-1 text-xs font-bold text-emerald-600">{story.result}</div> : null}
                    {story.summary ? <p className="mt-2 text-sm leading-6 text-slate-600">{story.summary}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <CoachExtendedInfo
            videoIntroUrl={profile.videoIntroUrl}
            languages={languages}
            certifications={certifications}
            education={education}
            hourlyRate={profile.hourlyRate}
            responseTimeHours={profile.responseTimeHours}
            totalClientsHelped={profile.totalClientsHelped}
            faqs={faqs}
            isVerified={profile.isVerified}
            isAcceptingClients={profile.isAcceptingClients}
          />

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {dictionary.publicCoachProfile.reviewsEyebrow}
                </p>
                <h2 className="text-lg font-black text-slate-900">{dictionary.publicCoachProfile.reviewsTitle}</h2>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                <div className="text-lg font-black text-slate-900">{profile.rating != null ? Number(profile.rating).toFixed(1) : "-"}</div>
                <div className="text-[11px] text-slate-500">{profile.reviewCount ?? 0} {dictionary.publicCoachProfile.reviewsLabel}</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {reviews.length > 0 ? (
                reviews.map((review) => <ReviewCard key={review.id} review={review} canDelete={false} />)
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">{dictionary.publicCoachProfile.noReviews}</div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {dictionary.publicCoachProfile.marketplaceTrustEyebrow}
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-900">{trustScore.label}</h2>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-center">
                <div className="text-[22px] font-black text-emerald-600">%{trustScore.score}</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{trustScore.summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="font-black text-slate-800">{verifiedReviewCount}</div>
                <div className="mt-0.5 text-slate-400">{dictionary.publicCoachProfile.verifiedReviews}</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="font-black text-slate-800">{profile.city ?? "Online"}</div>
                <div className="mt-0.5 text-slate-400">{dictionary.publicCoachProfile.cityCoverage}</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="font-black text-slate-800">{profile.successRate != null ? `%${profile.successRate}` : "-"}</div>
                <div className="mt-0.5 text-slate-400">{dictionary.publicCoachProfile.successRate}</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="font-black text-slate-800">{profile.responseTimeHours != null ? `${profile.responseTimeHours} sa` : "-"}</div>
                <div className="mt-0.5 text-slate-400">{dictionary.publicCoachProfile.responseTime}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {trustScore.signals.map((signal) => (
                <span key={signal} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                  {signal}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {dictionary.publicCoachProfile.profileQualityEyebrow}
                </p>
                <h2 className="text-lg font-black text-slate-900">%{profileQuality.score}</h2>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {profileQuality.strengths.map((item) => (
                <div key={`strength-${item}`} className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  <span className="text-slate-700">{item}</span>
                  <span className="font-black text-emerald-600">{dictionary.publicCoachProfile.ready}</span>
                </div>
              ))}
              {profileQuality.missing.map((item) => (
                <div key={`missing-${item}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-600">{item}</span>
                  <span className="font-bold text-slate-400">{dictionary.publicCoachProfile.missing}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {dictionary.publicCoachProfile.packagesEyebrow}
                </p>
                <h2 className="text-lg font-black text-slate-900">{dictionary.publicCoachProfile.packagesTitle}</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {profile.packages.length > 0 ? (
                profile.packages.map((pkg) => (
                  <div key={pkg.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-slate-900">{pkg.title}</div>
                        {pkg.description ? <div className="mt-1 text-xs leading-5 text-slate-500">{pkg.description}</div> : null}
                      </div>
                      <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                        {pkg.price != null ? formatCurrency(Number(pkg.price), locale) : dictionary.publicCoachProfile.askPrice}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      {pkg.durationWeeks ? <span className="rounded-full bg-slate-50 px-2.5 py-1 font-bold text-slate-600">{pkg.durationWeeks} {dictionary.publicCoachProfile.weeks}</span> : null}
                      {pkg.sessionsIncluded ? <span className="rounded-full bg-slate-50 px-2.5 py-1 font-bold text-slate-600">{pkg.sessionsIncluded} {dictionary.publicCoachProfile.sessions}</span> : null}
                      {pkg.recurringInterval ? <span className="rounded-full bg-slate-50 px-2.5 py-1 font-bold text-slate-600">{pkg.recurringInterval === "monthly" ? dictionary.publicCoachProfile.monthly : dictionary.publicCoachProfile.oneTime}</span> : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">{dictionary.publicCoachProfile.noPublicPackages}</div>
              )}
            </div>
          </section>

          <section className="rounded-[22px] border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-600">
                  {dictionary.publicCoachProfile.clientCtaEyebrow}
                </p>
                <h2 className="text-lg font-black text-slate-900">{dictionary.publicCoachProfile.clientCtaTitle}</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{dictionary.publicCoachProfile.clientCtaBody}</p>
            <Link
              href={loginHref}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 text-sm font-black text-white shadow-sm transition hover:opacity-95"
            >
              <MessageCircle className="h-4 w-4" />
              {dictionary.publicCoachProfile.signInAndConnect}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
