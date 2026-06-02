"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ChevronLeft, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { LocaleToggle } from "@/components/shared/LocaleToggle";
import { buildLocalizedPath, getDictionary, resolveLocale } from "@/lib/i18n";
import { registerSchema } from "@/validations/user";

type RegisterInput = z.infer<typeof registerSchema>;

function RoleCard({
  value,
  selected,
  onSelect,
  title,
  body,
  icon,
}: {
  value: "CLIENT" | "COACH";
  selected: boolean;
  onSelect: () => void;
  title: string;
  body: string;
  icon: string;
}) {
  const isCoach = value === "COACH";
  const accent = isCoach ? "#1A365D" : "#FB923C";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all"
      style={
        selected
          ? { background: `${accent}12`, border: `2px solid ${accent}`, boxShadow: `0 4px 16px ${accent}22` }
          : { background: "#fff", border: "2px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }
      }
    >
      <div
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
        style={
          selected
            ? { background: `${accent}18`, border: `1px solid ${accent}30` }
            : { background: "#F8FAFC", border: "1px solid #E2E8F0" }
        }
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-black text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{body}</p>
      </div>
      <div
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
        style={selected ? { background: accent } : { background: "#F1F5F9" }}
      >
        <ArrowRight className="h-3.5 w-3.5" style={{ color: selected ? "#fff" : "#94A3B8" }} />
      </div>
    </button>
  );
}

export function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "coach" ? "COACH" : "CLIENT";
  const locale = resolveLocale(searchParams.get("lang"));
  const dictionary = getDictionary(locale);

  const inviteCode = searchParams.get("invite") ?? undefined;
  const referralCode = searchParams.get("ref") ?? undefined;

  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: defaultRole },
  });

  const selectedRole = useWatch({ control: form.control, name: "role" });
  const isCoach = selectedRole === "COACH";

  const grad = isCoach
    ? "linear-gradient(160deg, #1A365D 0%, #2D4A7A 100%)"
    : "linear-gradient(160deg, #FB923C 0%, #EA580C 100%)";

  const accent = isCoach ? "#1A365D" : "#FB923C";

  const accentStyle = isCoach
    ? { background: "linear-gradient(135deg, #1A365D, #2D4A7A)", boxShadow: "0 4px 14px rgba(26,54,93,0.4)" }
    : { background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" };

  const features = isCoach ? dictionary.register.coachFeatures : dictionary.register.clientFeatures;

  const homeHref = buildLocalizedPath("/", locale);
  const loginHref = buildLocalizedPath("/login", locale);
  const registerLocaleParams = {
    role: selectedRole === "COACH" ? "coach" : "client",
    invite: inviteCode,
    ref: referralCode,
  };

  const onSubmit = async (values: RegisterInput) => {
    setError(null);
    const payload = {
      ...values,
      ...(inviteCode ? { inviteCode } : {}),
      ...(referralCode && values.role === "COACH" ? { referralCode } : {}),
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? dictionary.register.accountCreateError);
      return;
    }

    router.push(loginHref);
  };

  const roleCards = [
    {
      value: "CLIENT" as const,
      title: dictionary.register.roleClient,
      body: dictionary.register.roleClientBody,
      icon: "C",
    },
    {
      value: "COACH" as const,
      title: dictionary.register.roleCoach,
      body: dictionary.register.roleCoachBody,
      icon: "K",
    },
  ];

  const leftPanel = (
    <div
      className="relative flex flex-col overflow-hidden px-6 pb-14 pt-8 md:sticky md:top-0 md:h-screen md:flex-1 md:px-14 md:pb-12 md:pt-12"
      style={{ background: grad }}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="pointer-events-none absolute -left-8 bottom-16 hidden h-40 w-40 rounded-full md:block" style={{ background: "rgba(255,255,255,0.04)" }} />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt={dictionary.common.productName} width={32} height={32} className="object-contain" style={{ opacity: 0.9 }} />
          <span className="text-base font-black tracking-tight text-white">{dictionary.common.productName}</span>
        </div>

        <div className="flex items-center gap-2">
          <LocaleToggle pathname="/register" locale={locale} params={registerLocaleParams} tone="dark" />
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:brightness-110"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
          ) : (
            <Link
              href={homeHref}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:brightness-110"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </Link>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-8 md:mt-12">
        {step === 1 ? (
          <>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              {dictionary.register.createAccount}
            </h1>
            <p className="mt-2 text-sm text-white/65">{dictionary.register.howToJoin}</p>
          </>
        ) : (
          <>
            <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/65">
              {isCoach ? dictionary.register.coachRegistration : dictionary.register.clientRegistration}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              {dictionary.register.enterYourDetails}
            </h1>
          </>
        )}

        <div className="mt-8 hidden md:flex md:flex-col md:gap-4">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-white/80" />
              <span className="text-[14px] font-medium text-white/80">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-auto hidden md:block">
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-black"
            style={step === 1 ? { background: "#fff", color: accent } : { background: "rgba(255,255,255,0.3)", color: "#fff" }}
          >
            1
          </div>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.2)" }} />
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-black"
            style={step === 2 ? { background: "#fff", color: accent } : { background: "rgba(255,255,255,0.3)", color: "#fff" }}
          >
            2
          </div>
        </div>
        <p className="text-[12px] text-white/50">
          {step === 1 ? dictionary.register.roleSelectStep : dictionary.register.detailsStep}
        </p>
      </div>
    </div>
  );

  if (step === 1) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        <div className="border-b border-slate-100 bg-white px-6 pb-6 pt-8 md:hidden">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link href={homeHref} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 transition hover:bg-slate-200">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <LocaleToggle pathname="/register" locale={locale} params={registerLocaleParams} tone="light" />
          </div>
          <div className="mb-4 flex items-center gap-2.5">
            <Image src="/logo.png" alt={dictionary.common.productName} width={28} height={28} className="object-contain" />
            <span className="text-sm font-black tracking-tight text-slate-800">{dictionary.common.productName}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">{dictionary.register.createAccount}</h1>
          <p className="mt-1 text-sm text-slate-400">{dictionary.register.howToJoin}</p>
        </div>

        <div className="hidden md:flex md:flex-1">{leftPanel}</div>

        <div className="flex flex-col bg-white md:min-h-screen md:w-[480px] md:justify-center md:shadow-[-24px_0_48px_rgba(0,0,0,0.07)]">
          <div className="mx-auto w-full max-w-sm flex-1 space-y-3 px-4 pb-8 pt-6 md:w-full md:max-w-none md:flex-none md:px-10 md:pt-0">
            <div className="mb-6 hidden md:block">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">{dictionary.register.chooseAccountType}</h2>
              <p className="mt-1 text-sm text-slate-400">{dictionary.register.howToJoinTitle}</p>
            </div>

            {roleCards.map((role) => (
              <RoleCard
                key={role.value}
                value={role.value}
                selected={selectedRole === role.value}
                onSelect={() => form.setValue("role", role.value)}
                title={role.title}
                body={role.body}
                icon={role.icon}
              />
            ))}

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition hover:opacity-90"
              style={accentStyle}
            >
              {dictionary.register.continue} <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-sm text-slate-500">
              {dictionary.register.alreadyHaveAccount}{" "}
              <Link href={loginHref} className="font-black text-orange-500 hover:underline">
                {dictionary.common.signIn}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {leftPanel}

      <div className="relative z-10 flex flex-col bg-white md:min-h-screen md:w-[480px] md:justify-center md:shadow-[-24px_0_48px_rgba(0,0,0,0.07)]">
        <div className="mx-auto w-full max-w-sm flex-1 px-4 pb-8 md:w-full md:max-w-none md:flex-none md:px-10 md:py-12">
          <div className="-mt-8 rounded-2xl bg-white p-6" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div className="mb-6 hidden md:block">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">{dictionary.register.enterYourDetails}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {isCoach ? dictionary.register.coachDescription : dictionary.register.clientDescription}
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  {dictionary.register.nameLabel}
                </label>
                <input
                  type="text"
                  placeholder={dictionary.register.namePlaceholder}
                  {...form.register("name")}
                  className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm text-slate-800 placeholder-slate-400 ring-1 ring-black/8 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  {dictionary.register.emailLabel}
                </label>
                <input
                  type="email"
                  placeholder={dictionary.register.emailPlaceholder}
                  {...form.register("email")}
                  className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm text-slate-800 placeholder-slate-400 ring-1 ring-black/8 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  {dictionary.register.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder={dictionary.register.passwordPlaceholder}
                    {...form.register("password")}
                    className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 pr-11 text-sm text-slate-800 placeholder-slate-400 ring-1 ring-black/8 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="h-px bg-slate-100" />

              {error ? (
                <div
                  className="rounded-xl px-4 py-3 text-sm font-bold text-red-700"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
                style={accentStyle}
              >
                {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {form.formState.isSubmitting
                  ? dictionary.register.creatingAccountButton
                  : `${dictionary.register.createAccountButton} ${dictionary.register.creatingSuffix}`}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            {dictionary.register.alreadyHaveAccount}{" "}
            <Link href={loginHref} className="font-black text-orange-500 hover:underline">
              {dictionary.common.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
