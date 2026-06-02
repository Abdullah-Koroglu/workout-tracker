import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, Compass, Crown, MessageCircle, Sparkles, Users } from "lucide-react";

import { LocaleToggle } from "@/components/shared/LocaleToggle";
import { auth } from "@/lib/auth";
import { buildLocalizedPath, getDictionary, resolveLocale } from "@/lib/i18n";

type HomeSearchParams = Promise<{ lang?: string }>;

const operatingSystemIcons = [Users, Compass, Sparkles] as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const dictionary = getDictionary(locale);

  return {
    title: dictionary.landing.metadataTitle,
    description: dictionary.landing.metadataDescription,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  if (session) {
    redirect(session.user.role === "COACH" ? "/coach/dashboard" : "/client/dashboard");
  }

  const locale = resolveLocale(params.lang);
  const dictionary = getDictionary(locale);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <section className="border-b border-slate-200 bg-[#0F172A] text-white">
        <div className="mx-auto flex min-h-[92vh] max-w-7xl flex-col px-5 pb-10 pt-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt={dictionary.common.productName} width={44} height={44} className="object-contain" />
              <div>
                <p className="text-base font-black tracking-tight text-white">{dictionary.common.productName}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                  {dictionary.landing.positioningTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LocaleToggle pathname="/" locale={locale} tone="dark" />
              <Link
                href={buildLocalizedPath("/login", locale)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white/75 transition hover:border-white/20 hover:text-white"
              >
                {dictionary.common.signIn}
              </Link>
              <Link
                href={buildLocalizedPath("/register", locale, { role: "coach" })}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 px-4 text-sm font-black text-white shadow-sm transition hover:opacity-95"
              >
                {dictionary.common.startAsCoach}
              </Link>
            </div>
          </nav>

          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.08fr,0.92fr] lg:py-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-200">
                {dictionary.landing.eyebrow}
              </div>

              <h1 className="mt-5 max-w-4xl text-[42px] font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-[56px] lg:text-[72px]">
                {dictionary.landing.headline}
                <span className="block text-orange-300">{dictionary.landing.headlineAccent}</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                {dictionary.landing.body}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={buildLocalizedPath("/register", locale, { role: "coach" })}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 px-6 text-sm font-black text-white shadow-sm transition hover:opacity-95"
                >
                  {dictionary.common.startAsCoach}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={buildLocalizedPath("/coaches", locale)}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-black text-white/80 transition hover:border-white/20 hover:text-white"
                >
                  {dictionary.common.exploreMarketplace}
                  <Compass className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 space-y-3">
                {dictionary.landing.coachValue.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-white/75">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                      {dictionary.landing.coachPanelLabel}
                    </p>
                    <h2 className="mt-1 text-xl font-black text-white">{dictionary.landing.coachPanelTitle}</h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black text-emerald-300">
                    {dictionary.landing.idealForPro}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {dictionary.landing.coachPanelStats.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className={`text-2xl font-black ${item.tone}`}>{item.value}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/40">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-orange-300/15 bg-orange-400/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    {dictionary.landing.aiDigestLabel}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/75">{dictionary.landing.aiDigestBody}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {dictionary.landing.marketplaceProof.map((item) => (
                  <div key={item.label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                    <div className="mt-2 text-sm font-black leading-6 text-slate-900">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-500">
              {dictionary.landing.positioningEyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-900">
              {dictionary.landing.positioningTitle}
            </h2>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
            {dictionary.landing.positioningBadge}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {dictionary.landing.operatingSystemBlocks.map((item, index) => {
            const Icon = operatingSystemIcons[index];

            return (
              <article key={item.title} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50">
                  <Icon className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="mt-4 text-xl font-black tracking-[-0.02em] text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 lg:grid-cols-[0.95fr,1.05fr] lg:px-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-500">
              {dictionary.landing.whyPayEyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-900">
              {dictionary.landing.whyPayTitle}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {dictionary.landing.whyPayItems.map((item) => (
              <div key={item.title} className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <Crown className="h-4 w-4 text-orange-500" />
                  {item.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="rounded-[28px] bg-[#0F172A] px-6 py-8 text-white shadow-xl lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-200">
                {dictionary.landing.ctaEyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em]">{dictionary.landing.ctaTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">{dictionary.landing.ctaBody}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={buildLocalizedPath("/register", locale, { role: "coach" })}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 px-6 text-sm font-black text-white transition hover:opacity-95"
              >
                {dictionary.landing.openCoachAccount}
              </Link>
              <Link
                href={buildLocalizedPath("/login", locale)}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-black text-white/80 transition hover:border-white/20 hover:text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {dictionary.common.signIn}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
