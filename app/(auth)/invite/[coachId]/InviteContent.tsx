"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/validations/user";

type RegisterInput = z.infer<typeof registerSchema>;

type Coach = {
  id: string;
  name: string;
  coachProfile: {
    bio: string | null;
    specialties: string[] | null;
    experienceYears: number | null;
  } | null;
};

export function InviteContent({ coachId }: { coachId: string }) {
  const router = useRouter();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "CLIENT" },
  });

  useEffect(() => {
    fetch(`/api/invite/${coachId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setCoach(d.coach))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [coachId]);

  const onSubmit = async (values: RegisterInput) => {
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, coachId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Kayıt oluşturulamadı."); return; }
    router.push("/login?invited=1");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-2xl font-black text-slate-800">Koç bulunamadı</p>
        <p className="text-sm text-slate-400">Bu davet linki geçersiz veya süresi dolmuş.</p>
        <Link href="/register" className="mt-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-black text-white hover:bg-orange-600">
          Kayıt Ol
        </Link>
      </div>
    );
  }

  const accentStyle = {
    background: "linear-gradient(135deg, #FB923C, #EA580C)",
    boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left panel */}
      <div
        className="relative flex flex-col overflow-hidden px-6 pb-14 pt-8 md:sticky md:top-0 md:h-screen md:flex-1 md:px-14 md:pb-12 md:pt-12"
        style={{ background: "linear-gradient(160deg, #FB923C 0%, #EA580C 100%)" }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />

        <div className="relative z-10 flex items-center gap-2.5">
          <Image src="/logo.png" alt="FitCoach" width={32} height={32} className="object-contain opacity-90" />
          <span className="text-base font-black tracking-tight text-white">FitCoach OS</span>
        </div>

        <div className="relative z-10 mt-10">
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/65">Davet</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            {coach?.name} seni<br />platforma davet etti
          </h1>

          {coach?.coachProfile?.bio && (
            <p className="mt-4 text-sm leading-relaxed text-white/75">{coach.coachProfile.bio}</p>
          )}

          {Array.isArray(coach?.coachProfile?.specialties) && coach!.coachProfile!.specialties!.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {(coach!.coachProfile!.specialties as string[]).map((s) => (
                <span
                  key={s}
                  className="rounded-full px-3 py-1 text-[12px] font-bold text-white"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 hidden md:flex md:flex-col md:gap-4">
            {[
              { icon: "🏋️", text: "Profesyonel koçtan kişisel program" },
              { icon: "📅", text: "Kişiselleştirilmiş antrenman takvimi" },
              { icon: "📈", text: "İlerleme takibi ve istatistikler" },
              { icon: "💬", text: "Koçunla anlık mesajlaşma" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-[14px] font-medium text-white/80">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="relative z-10 flex flex-col bg-white md:w-[480px] md:min-h-screen md:justify-center md:shadow-[-24px_0_48px_rgba(0,0,0,0.07)]">
        <div className="mx-auto w-full max-w-sm flex-1 px-4 pb-8 md:max-w-none md:w-full md:flex-none md:px-10 md:py-12">
          <div className="-mt-8 rounded-2xl bg-white p-6" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div className="mb-6 hidden md:block">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Hesabını Oluştur</h2>
              <p className="mt-1 text-sm text-slate-400">
                {coach?.name} ile çalışmaya başlamak için kayıt ol
              </p>
            </div>

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
                    {showPass ? "🙈" : "👁"}
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
