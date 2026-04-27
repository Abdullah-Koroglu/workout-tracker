"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronLeft, Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { loginSchema } from "@/validations/user";

type LoginInput = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: "📊", text: "Gerçek zamanlı ilerleme takibi" },
  { icon: "💬", text: "Koç ile anlık mesajlaşma" },
  { icon: "📅", text: "Kişiselleştirilmiş program takvimi" },
  { icon: "🏆", text: "Detaylı analiz ve raporlar" },
];

export function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const roleParam    = searchParams.get("role");
  const isCoach      = roleParam === "coach";

  const [error, setError]       = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setError(null);
    const result = await signIn("credentials", { ...values, redirect: false });
    if (result?.error) { setError("Giriş başarısız. Bilgileri kontrol edin."); return; }

    const sessionRes = await fetch("/api/auth/session");
    const session    = await sessionRes.json();
    router.push(session?.user?.role === "COACH" ? "/coach/dashboard" : "/client/dashboard");
    router.refresh();
  };

  const grad = isCoach
    ? "linear-gradient(160deg, #1A365D 0%, #2D4A7A 100%)"
    : "linear-gradient(160deg, #FB923C 0%, #EA580C 100%)";

  const submitStyle = isCoach
    ? { background: "linear-gradient(135deg, #1A365D, #2D4A7A)", boxShadow: "0 4px 14px rgba(26,54,93,0.4)" }
    : { background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" };

  const formEl = (
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
        {form.formState.errors.email && (
          <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
          Şifre
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
            onClick={() => setShowPass((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="mt-1 text-xs text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-bold text-red-700"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
        style={submitStyle}
      >
        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {form.formState.isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );

  const roleSwitcher = (
    <>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ya da</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href="/login?role=client"
          className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition"
          style={
            !isCoach
              ? { background: "rgba(249,115,22,0.1)", color: "#EA580C", border: "1px solid rgba(249,115,22,0.2)" }
              : { background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }
          }
        >
          🏃 Danışan Girişi
        </Link>
        <Link
          href="/login?role=coach"
          className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition"
          style={
            isCoach
              ? { background: "rgba(26,54,93,0.1)", color: "#1A365D", border: "1px solid rgba(26,54,93,0.2)" }
              : { background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }
          }
        >
          🏋️ Koç Girişi
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">

      {/* ── LEFT: Colored branding panel ── */}
      <div
        className="relative flex flex-col overflow-hidden px-6 pb-14 pt-8 md:sticky md:top-0 md:h-screen md:flex-1 md:px-14 md:pb-12 md:pt-12"
        style={{ background: grad }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="pointer-events-none absolute -left-8 bottom-16 hidden h-40 w-40 rounded-full md:block" style={{ background: "rgba(255,255,255,0.04)" }} />

        {/* Logo + back */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FitCoach" width={32} height={32} className="object-contain" style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }} />
            <span className="text-base font-black tracking-tight text-white">FitCoach OS</span>
          </div>
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:brightness-110"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
        </div>

        {/* Headline */}
        <div className="relative z-10 mt-8 md:mt-12">
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/65">
            {isCoach ? "Koç Girişi" : "Danışan Girişi"}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            Tekrar Hoşgeldin 👋
          </h1>
          <p className="mt-3 hidden text-[15px] leading-relaxed text-white/65 md:block">
            Antrenmanlarını takip et, koçunla bağlantıda kal ve hedeflerine ulaş.
          </p>
          <div className="mt-8 hidden md:flex md:flex-col md:gap-4">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-[14px] font-medium text-white/80">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial (desktop) */}
        <div
          className="relative z-10 mt-auto hidden rounded-2xl p-4 md:block"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <p className="mb-3 text-sm italic leading-relaxed text-white/80">
            "FitCoach sayesinde antrenmanlarımı düzenli takip ediyor, koçumla her an iletişimde olabiliyorum."
          </p>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white">SA</div>
            <div>
              <p className="text-[12px] font-bold text-white">Selin Arslan</p>
              <p className="text-[11px] text-white/50">Danışan · 6 aydır kullanıyor</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="relative z-10 flex flex-col bg-white md:w-[480px] md:min-h-screen md:justify-center md:shadow-[-24px_0_48px_rgba(0,0,0,0.07)]">

        {/* Mobile: floating card */}
        <div className="mx-auto w-full max-w-sm flex-1 px-4 pb-8 md:hidden">
          <div className="-mt-8 relative rounded-2xl bg-white p-6" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            {formEl}
            {roleSwitcher}
          </div>
          <p className="mt-5 text-center text-sm text-slate-500">
            Hesabın yok mu?{" "}
            <Link href="/register" className="font-black text-orange-500 hover:underline">Üye Ol</Link>
          </p>
        </div>

        {/* Desktop: clean form */}
        <div className="hidden w-full px-10 py-12 md:block">
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-800">Giriş Yap</h2>
            <p className="mt-1 text-sm text-slate-400">Hesabına erişmek için bilgilerini gir</p>
          </div>
          {formEl}
          {roleSwitcher}
          <p className="mt-6 text-center text-sm text-slate-500">
            Hesabın yok mu?{" "}
            <Link href="/register" className="font-black text-orange-500 hover:underline">Üye Ol</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
