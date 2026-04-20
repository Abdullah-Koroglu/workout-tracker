import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowRight, BellRing, CalendarDays, Dumbbell, MessageSquareText, ShieldCheck, Users } from "lucide-react";

import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    if (session.user.role === "COACH") {
      redirect("/coach/dashboard");
    }

    redirect("/client/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_32%),linear-gradient(180deg,_#f8fffb_0%,_#ffffff_52%,_#f6f8fb_100%)] text-slate-900">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">FitCoach OS</p>
            <p className="mt-2 text-sm text-slate-600">Coach ve client akisini tek merkezde yoneten modern workout platformu</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
              Giris Yap
            </Link>
            <Link href="/register" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Kayit Ol
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="overflow-hidden rounded-[32px] border border-emerald-200/70 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
            <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800">
              Coach ve Client icin tek platform
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Program, mesajlasma ve ilerleme takibini ayni ekranda birlestiren workout merkezi.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Coach tarafinda operasyonu, client tarafinda gunluk aksiyonu hizlandiran; KPI, gorev akisi, mesajlasma ve yorumlari tek ritimde toplayan bir deneyim.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Platforma Basla
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
                Mevcut Hesapla Gir
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">Canli Mesaj</p>
                <p className="mt-2 text-3xl font-black text-emerald-950">Anlik</p>
                <p className="mt-2 text-sm text-emerald-900/80">WS destekli birebir iletisim ve push fallback.</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-800">Performans</p>
                <p className="mt-2 text-3xl font-black text-sky-950">KPI</p>
                <p className="mt-2 text-sm text-sky-900/80">Haftalik tempo, tamamlama ve geribildirim gorunurlugu.</p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-800">Plan Akisi</p>
                <p className="mt-2 text-3xl font-black text-orange-950">Net</p>
                <p className="mt-2 text-sm text-orange-900/80">Template atama, gunluk liste ve yorum takibi ayni duzende.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.2)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Coach Dashboard</p>
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Aktif Client</p>
                  <p className="mt-2 text-3xl font-black">24</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Haftalik Baslangic</p>
                  <p className="mt-2 text-3xl font-black">31</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Tamamlama</p>
                  <p className="mt-2 text-3xl font-black">%84</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Bekleyen Istek</p>
                  <p className="mt-2 text-3xl font-black">4</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Client Dashboard</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Bugun hazir plan</p>
                      <p className="text-xs text-slate-500">Hemen baslanabilecek gorevler</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-slate-950">3</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <BellRing className="h-5 w-5 text-sky-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Okunmamis geri bildirim</p>
                      <p className="text-xs text-slate-500">Coach yorumu ve mesajlari</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-slate-950">6</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Disiplin ritmi</p>
                      <p className="text-xs text-slate-500">Haftalik devam ve tempo izi</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-slate-950">Yuksek</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border bg-white p-5 shadow-sm">
            <Users className="h-6 w-6 text-emerald-600" />
            <p className="mt-4 text-lg font-black text-slate-950">Coach tarafinda operasyon netligi</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Client istekleri, template atamalari ve haftalik aktivite ayni dashboard mantiginda bir araya gelir.</p>
          </div>
          <div className="rounded-[28px] border bg-white p-5 shadow-sm">
            <Dumbbell className="h-6 w-6 text-sky-600" />
            <p className="mt-4 text-lg font-black text-slate-950">Client tarafinda gunluk aksiyon</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Bugun, gelecek, aktif workout ve yorum akisi sayesinde kullanici ne yapacagini aninda gorur.</p>
          </div>
          <div className="rounded-[28px] border bg-white p-5 shadow-sm">
            <MessageSquareText className="h-6 w-6 text-orange-600" />
            <p className="mt-4 text-lg font-black text-slate-950">Profesyonel mesajlasma omurgasi</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">WebSocket ile anlik iletisim, API senkronu ile veri tutarliligi ve push ile offline erisim.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
