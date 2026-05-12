"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, ChevronLeft, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";

import { registerSchema } from "@/validations/user";

type RegisterInput = z.infer<typeof registerSchema>;

const COACH_FEATURES = [
  { icon: "👥", text: "Danışan yönetimi ve takibi" },
  { icon: "📋", text: "Antrenman şablonu oluşturma" },
  { icon: "📊", text: "Uyumluluk ve ilerleme analizi" },
  { icon: "💬", text: "Danışanlarla anlık iletişim" },
];

const CLIENT_FEATURES = [
  { icon: "🏋️", text: "Profesyonel koç bulma ve bağlanma" },
  { icon: "📅", text: "Kişiselleştirilmiş antrenman takvimi" },
  { icon: "📈", text: "İlerleme takibi ve istatistikler" },
  { icon: "💬", text: "Koçunla anlık mesajlaşma" },
];

function RoleCard({
  value,
  selected,
  onSelect,
}: {
  value: "CLIENT" | "COACH";
  selected: boolean;
  onSelect: () => void;
}) {
  const isCoach = value === "COACH";
  const accent  = isCoach ? "#1A365D" : "#FB923C";

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
        {isCoach ? "🏋️" : "🏃"}
      </div>
      <div className="flex-1">
        <p className="font-black text-slate-800">{isCoach ? "Koç" : "Danışan"}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
          {isCoach
            ? "Danışan yönet, program oluştur, ilerlemeyi izle."
            : "Koç bul, antrenman yap, ilerlemeni takip et."}
        </p>
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
  const router       = useRouter();
  const searchParams = useSearchParams();
  const defaultRole  = searchParams.get("role") === "coach" ? "COACH" : "CLIENT";

  const inviteCode = searchParams.get("invite") ?? undefined;

  const [step, setStep]         = useState<1 | 2>(1);
  const [error, setError]       = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: defaultRole },
  });

  const selectedRole = form.watch("role");
  const isCoach      = selectedRole === "COACH";

  const grad = isCoach
    ? "linear-gradient(160deg, #1A365D 0%, #2D4A7A 100%)"
    : "linear-gradient(160deg, #FB923C 0%, #EA580C 100%)";

  const accent = isCoach ? "#1A365D" : "#FB923C";

  const accentStyle = isCoach
    ? { background: "linear-gradient(135deg, #1A365D, #2D4A7A)", boxShadow: "0 4px 14px rgba(26,54,93,0.4)" }
    : { background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" };

  const features = isCoach ? COACH_FEATURES : CLIENT_FEATURES;

  const onSubmit = async (values: RegisterInput) => {
    setError(null);
    const payload = inviteCode ? { ...values, inviteCode } : values;
    const res  = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Kayıt oluşturulamadı."); return; }
    router.push("/login");
  };

  /* ── Colored left panel ── */
  const leftPanel = (
    <div
      className="relative flex flex-col overflow-hidden px-6 pb-14 pt-8 md:sticky md:top-0 md:h-screen md:flex-1 md:px-14 md:pb-12 md:pt-12"
      style={{ background: grad }}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="pointer-events-none absolute -left-8 bottom-16 hidden h-40 w-40 rounded-full md:block" style={{ background: "rgba(255,255,255,0.04)" }} />

      {/* Logo + nav */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Fit Coach" width={32} height={32} className="object-contain" style={{ opacity: 0.9 }} />
          <span className="text-base font-black tracking-tight text-white">Fit Coach</span>
        </div>
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
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:brightness-110"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
        )}
      </div>

      {/* Title */}
      <div className="relative z-10 mt-8 md:mt-12">
        {step === 1 ? (
          <>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Hesap Oluştur</h1>
            <p className="mt-2 text-sm text-white/65">Platformda nasıl yer almak istiyorsun?</p>
          </>
        ) : (
          <>
            <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/65">
              {isCoach ? "Koç Kaydı" : "Danışan Kaydı"}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Bilgilerini Gir
            </h1>
          </>
        )}

        <div className="mt-8 hidden md:flex md:flex-col md:gap-4">
          {features.map((f) => (
            <div key={f.text} className="flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-[14px] font-medium text-white/80">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step indicator (desktop) */}
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
          {step === 1 ? "Adım 1: Rol seç" : "Adım 2: Bilgilerini gir"}
        </p>
      </div>
    </div>
  );

  /* ── STEP 1: Role selection ── */
  if (step === 1) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Mobile: plain white header */}
        <div className="border-b border-slate-100 bg-white px-6 pb-6 pt-8 md:hidden">
          <Link href="/" className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 transition hover:bg-slate-200">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div className="mb-4 flex items-center gap-2.5">
            <Image src="/logo.png" alt="Fit Coach" width={28} height={28} className="object-contain" />
            <span className="text-sm font-black tracking-tight text-slate-800">Fit Coach</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">Hesap Oluştur</h1>
          <p className="mt-1 text-sm text-slate-400">Platformda nasıl yer almak istiyorsun?</p>
        </div>

        {/* Desktop: colored left panel */}
        <div className="hidden md:flex md:flex-1">{leftPanel}</div>

        {/* Right: role cards */}
        <div className="flex flex-col bg-white md:w-[480px] md:min-h-screen md:justify-center md:shadow-[-24px_0_48px_rgba(0,0,0,0.07)]">
          <div className="mx-auto w-full max-w-sm flex-1 space-y-3 px-4 pb-8 pt-6 md:max-w-none md:w-full md:flex-none md:px-10 md:pt-0">
            <div className="mb-6 hidden md:block">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Hesap Türünü Seç</h2>
              <p className="mt-1 text-sm text-slate-400">Platforma nasıl katılmak istiyorsun?</p>
            </div>

            {(["CLIENT", "COACH"] as const).map((r) => (
              <RoleCard key={r} value={r} selected={selectedRole === r} onSelect={() => form.setValue("role", r)} />
            ))}

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition hover:opacity-90"
              style={accentStyle}
            >
              Devam Et <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-sm text-slate-500">
              Zaten hesabın var mı?{" "}
              <Link href="/login" className="font-black text-orange-500 hover:underline">Giriş Yap</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP 2: Registration form ──
     Form rendered ONCE; card styling shown only on mobile via CSS.
  ── */
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {leftPanel}

      <div className="relative z-10 flex flex-col bg-white md:w-[480px] md:min-h-screen md:justify-center md:shadow-[-24px_0_48px_rgba(0,0,0,0.07)]">
        <div className="mx-auto w-full max-w-sm flex-1 px-4 pb-8 md:max-w-none md:w-full md:flex-none md:px-10 md:py-12">

          {/* Card wrapper: shadow + rounding on mobile only */}
          <div
            className="-mt-8 rounded-2xl bg-white p-6 "
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
          >
            {/* Desktop title */}
            <div className="mb-6 hidden md:block">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Bilgilerini Gir</h2>
              <p className="mt-1 text-sm text-slate-400">
                {isCoach ? "Koç" : "Danışan"} hesabı oluşturmak üzeresin
              </p>
            </div>

            {/* ── Form (rendered ONCE) ── */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  placeholder="Adınızı girin"
                  {...form.register("name")}
                  className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm text-slate-800 placeholder-slate-400 ring-1 ring-black/8 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

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
                    placeholder="En az 8 karakter"
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

              <div className="h-px bg-slate-100" />

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
                style={accentStyle}
              >
                {form.formState.isSubmitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <UserPlus className="h-4 w-4" />}
                {form.formState.isSubmitting ? "Oluşturuluyor..." : "Hesabı Oluştur →"}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-black text-orange-500 hover:underline">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
