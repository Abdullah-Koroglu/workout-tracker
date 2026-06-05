"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MessageSquare,
  Trophy,
} from "lucide-react";

import { loginSchema } from "@/validations/user";

type LoginInput = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: BarChart3, text: "Gercek zamanli ilerleme takibi" },
  { icon: MessageSquare, text: "Koc ile anlik mesajlasma" },
  { icon: CalendarDays, text: "Kisisellestirilmis program takvimi" },
  { icon: Trophy, text: "Detayli analiz ve raporlar" },
];

export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCoach = searchParams.get("role") === "coach";
  const authError = searchParams.get("error");

  const [error, setError] = useState<string | null>(
    authError ? "Giris simdilik tamamlanamadi. Bilgileri kontrol edip tekrar deneyin." : null
  );
  const [showPass, setShowPass] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setError(null);

    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (result?.error) {
      setError("Giris basarisiz. Bilgileri kontrol edin.");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    router.push(session?.user?.role === "COACH" ? "/coach/dashboard" : "/client/dashboard");
    router.refresh();
  };

  const gradient = isCoach
    ? "linear-gradient(160deg, #1A365D 0%, #2D4A7A 100%)"
    : "linear-gradient(160deg, #FB923C 0%, #EA580C 100%)";

  const submitStyle = isCoach
    ? { background: "linear-gradient(135deg, #1A365D, #2D4A7A)", boxShadow: "0 4px 14px rgba(26,54,93,0.4)" }
    : { background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div
        className="relative flex flex-col overflow-hidden px-6 pb-14 pt-8 md:sticky md:top-0 md:h-screen md:flex-1 md:px-14 md:pb-12 md:pt-12"
        style={{ background: gradient }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 bottom-16 hidden h-40 w-40 rounded-full bg-white/5 md:block" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Fit Coach" width={32} height={32} className="object-contain opacity-90" />
            <span className="text-base font-black tracking-tight text-white">Fit Coach</span>
          </div>
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/15 transition hover:brightness-110"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
        </div>

        <div className="relative z-10 mt-8 md:mt-12">
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/65">
            {isCoach ? "KOC GIRISI" : "DANISAN GIRISI"}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Tekrar Hosgeldin</h1>
          <p className="mt-3 hidden text-[15px] leading-relaxed text-white/65 md:block">
            Antrenmanlarini takip et, kocunla baglantida kal ve hedeflerine ulas.
          </p>
          <div className="mt-8 hidden flex-col gap-4 md:flex">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12 text-white">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[14px] font-medium text-white/80">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 mt-auto hidden rounded-2xl border border-white/12 bg-white/10 p-4 md:block">
          <p className="mb-3 text-sm italic leading-relaxed text-white/80">
            &quot;Fit Coach sayesinde antrenmanlarimi duzenli takip ediyor, kocumla her an iletisimde kalabiliyorum.&quot;
          </p>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white">
              SA
            </div>
            <div>
              <p className="text-[12px] font-bold text-white">Selin Arslan</p>
              <p className="text-[11px] text-white/55">Danisan | 6 aydir kullaniyor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col bg-white md:min-h-screen md:w-[480px] md:justify-center md:shadow-[-24px_0_48px_rgba(0,0,0,0.07)]">
        <div className="mx-auto w-full max-w-sm flex-1 px-4 pb-8 md:w-full md:max-w-none md:flex-none md:px-10 md:py-12">
          <div className="-mt-8 rounded-2xl bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="mb-6 hidden md:block">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Giris Yap</h2>
              <p className="mt-1 text-sm text-slate-400">Hesabina erismek icin bilgilerini gir.</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  E-posta
                </label>
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  {...form.register("email")}
                  className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm text-slate-800 placeholder-slate-400 ring-1 ring-black/8 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {form.formState.errors.email ? (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Sifre
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    {...form.register("password")}
                    className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 pr-11 text-sm text-slate-800 placeholder-slate-400 ring-1 ring-black/8 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password ? (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
                style={submitStyle}
              >
                {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {form.formState.isSubmitting ? "Giris yapiliyor..." : "Giris Yap"}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Hesabin yok mu?{" "}
            <Link href="/register" className="font-black text-orange-500 hover:underline">
              Uye Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
