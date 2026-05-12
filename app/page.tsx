import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart2, MessageCircle, Target, Zap } from "lucide-react";

import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (session) {
    redirect(session.user.role === "COACH" ? "/coach/dashboard" : "/client/dashboard");
  }

  const features = [
    { icon: Zap,           label: "Program Takibi",   sub: "Kişisel antrenman şablonları" },
    { icon: BarChart2,     label: "Anlık İlerleme",   sub: "Gerçek zamanlı veriler"       },
    { icon: MessageCircle, label: "Koç İletişimi",    sub: "Anlık mesajlaşma"             },
    { icon: Target,        label: "Hedef Odaklı",     sub: "Kişisel programlar"           },
  ];

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0F172A 0%, #1A365D 60%, #0F172A 100%)" }}
    >
      {/* ── Ambient glow orbs ── */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -left-20 top-60 h-[300px] w-[300px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-40 -right-16 h-[260px] w-[260px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)" }}
      />

      {/* ── Grid lines ── */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035]"
        preserveAspectRatio="xMidYMid slice"
      >
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`v${i}`} x1={`${i * 16.66}%`} y1="0" x2={`${i * 16.66}%`} y2="100%" stroke="white" strokeWidth="1" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <line key={`h${i}`} x1="0" y1={`${i * 11.11}%`} x2="100%" y2={`${i * 11.11}%`} stroke="white" strokeWidth="1" />
        ))}
      </svg>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-6 py-12 md:max-w-2xl lg:max-w-4xl lg:py-16">

        {/* ── Top nav ── */}
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Fit Coach"
              width={44}
              height={44}
              className="object-contain"
              style={{ filter: "drop-shadow(0 4px 12px rgba(249,115,22,0.5))" }}
            />
            <div>
              <p className="text-base font-black leading-none tracking-tight text-white">Fit Coach</p>
              {/* <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Performance Platform
              </p> */}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-bold text-white/70 transition hover:text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="rounded-xl px-4 py-2 text-sm font-black text-white transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #FB923C, #EA580C)",
                boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
              }}
            >
              Üye Ol
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <div className="mt-16 flex-1 lg:mt-24">
          <div
            className="mb-6 inline-block rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em]"
            style={{ background: "rgba(249,115,22,0.15)", color: "#FB923C", border: "1px solid rgba(249,115,22,0.25)" }}
          >
            Fitness Ekosistemi
          </div>

          <div
            className="mb-3 h-0.5 w-10 rounded-full"
            style={{ background: "linear-gradient(90deg, #FB923C, #EA580C)" }}
          />

          <h1 className="text-4xl font-black leading-[1.1] tracking-[-1.5px] text-white sm:text-5xl lg:text-6xl">
            Antrenmanını{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FB923C, #FDBA74)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Yönet.
            </span>
            <br />
            Sonuçları Takip Et.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/55">
            Koç ve danışanları birleştiren modern fitness ekosistemi. Program, mesajlaşma ve ilerleme takibini tek ekranda yönet.
          </p>

          {/* ── CTA buttons ── */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register?role=client"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black text-white transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #FB923C, #EA580C)",
                boxShadow: "0 6px 20px rgba(249,115,22,0.4)",
              }}
            >
              Danışan Olarak Başla
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register?role=coach"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black text-white/80 transition hover:text-white"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              Koç Olarak Kayıt Ol
            </Link>
          </div>

          {/* ── Feature grid ── */}
          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {features.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div
                  className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "rgba(249,115,22,0.15)" }}
                >
                  <Icon className="h-4 w-4 text-orange-400" />
                </div>
                <p className="text-sm font-black text-white">{label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/40">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Social proof ── */}
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["#FB923C", "#1A365D", "#2563EB", "#16A34A"].map((c, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black text-white ring-2 ring-[#0F172A]"
                  style={{ background: c }}
                >
                  {["K", "D", "A", "M"][i]}
                </div>
              ))}
            </div>
            <p className="text-[12px] text-white/45">
              <span className="font-black text-white/70">+200 kullanıcı</span> platforma güveniyor
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-16 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-[11px] text-white/30">© 2025 Fit Coach</p>
          <Link
            href="/login"
            className="text-[11px] font-bold text-white/40 transition hover:text-white/70"
          >
            Zaten hesabın var mı? Giriş yap →
          </Link>
        </footer>
      </div>
    </main>
  );
}
