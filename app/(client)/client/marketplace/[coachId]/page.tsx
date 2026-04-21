import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, ChevronLeft, ExternalLink, MessageCircle, Star, Tag } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function CoachVitrinPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") return null;

  const { coachId } = await params;

  const coach = await prisma.user.findUnique({
    where: { id: coachId, role: "COACH" },
    select: {
      id: true,
      name: true,
      coachProfile: {
        select: {
          bio: true,
          specialties: true,
          experienceYears: true,
          socialMediaUrl: true,
          packages: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!coach) return notFound();

  const profile = coach.coachProfile;
  const specialties = Array.isArray(profile?.specialties) ? (profile.specialties as string[]) : [];
  const messageHref = `/messages?withUserId=${coachId}`;

  function getInitials(name: string) {
    return name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Back */}
      <Link
        href="/client/marketplace"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Koç Keşfet
      </Link>

      {/* Coach hero */}
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-sm">
        <div className="p-5 md:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-black text-white shadow-md">
              {getInitials(coach.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 md:text-2xl">{coach.name}</h1>
              {profile?.experienceYears != null && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {profile.experienceYears} yıl tecrübe
                </p>
              )}
              {profile?.socialMediaUrl && (
                <a
                  href={profile.socialMediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Sosyal Medya
                </a>
              )}
            </div>

            <Link
              href={messageHref}
              className="hidden shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition sm:flex"
            >
              <MessageCircle className="h-4 w-4" />
              Mesaj Gönder
            </Link>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="mt-4 text-sm leading-relaxed text-slate-700">{profile.bio}</p>
          )}

          {/* Specialties */}
          {specialties.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Tag className="h-3 w-3" />
                Uzmanlık Alanları
              </p>
              <div className="flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mobile message button */}
          <Link
            href={messageHref}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition sm:hidden"
          >
            <MessageCircle className="h-4 w-4" />
            Mesaj Gönder
          </Link>
        </div>
      </div>

      {/* Packages */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Eğitim Paketleri
          </h2>
          {profile?.packages && profile.packages.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {profile.packages.length}
            </span>
          )}
        </div>

        {!profile?.packages || profile.packages.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Bu koç henüz paket bilgisi paylaşmamıştır.
            </p>
            <Link
              href={messageHref}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Fiyat Sor / İletişime Geç
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {profile.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex flex-col rounded-2xl border bg-card p-4 shadow-sm md:p-5"
              >
                <div className="flex-1 space-y-2">
                  <p className="font-bold text-slate-900">{pkg.title}</p>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
                  {pkg.price != null ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">
                      {pkg.price.toLocaleString("tr-TR")} ₺
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Fiyat belirtilmemiş</span>
                  )}

                  <Link
                    href={messageHref}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {pkg.price != null
                      ? `Paket: ${pkg.price.toLocaleString("tr-TR")} ₺ — İletişime Geç`
                      : "Fiyat Sor / İletişime Geç"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
