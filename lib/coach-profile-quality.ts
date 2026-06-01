type CoachPackageLike = {
  price?: number | null;
};

type CoachProfileQualityInput = {
  bio?: string | null;
  slogan?: string | null;
  city?: string | null;
  specialties?: unknown;
  experienceYears?: number | null;
  socialMediaUrl?: string | null;
  transformationPhotos?: unknown;
  packages?: CoachPackageLike[];
  avatarUrl?: string | null;
  rating?: number | string | null;
  reviewCount?: number | null;
  isVerified?: boolean | null;
  certifications?: unknown;
  videoIntroUrl?: string | null;
};

export type CoachProfileQuality = {
  score: number;
  label: string;
  tone: "low" | "medium" | "high";
  missing: string[];
  strengths: string[];
};

function hasArrayValue(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

export function calculateCoachProfileQuality(profile: CoachProfileQualityInput): CoachProfileQuality {
  const checks = [
    { key: "avatar", label: "Avatar", done: hasText(profile.avatarUrl), points: 10 },
    { key: "bio", label: "Bio", done: hasText(profile.bio), points: 12 },
    { key: "slogan", label: "Slogan", done: hasText(profile.slogan), points: 8 },
    { key: "specialties", label: "Uzmanlık", done: hasArrayValue(profile.specialties), points: 12 },
    { key: "city", label: "Şehir", done: hasText(profile.city), points: 8 },
    { key: "experience", label: "Deneyim", done: profile.experienceYears !== null && profile.experienceYears !== undefined, points: 8 },
    { key: "package", label: "Aktif paket", done: (profile.packages?.length ?? 0) > 0, points: 14 },
    {
      key: "pricedPackage",
      label: "Fiyatlı paket",
      done: Boolean(profile.packages?.some((pkg) => typeof pkg.price === "number" && pkg.price > 0)),
      points: 8,
    },
    { key: "transformation", label: "Dönüşüm vitrini", done: hasArrayValue(profile.transformationPhotos), points: 10 },
    { key: "social", label: "Sosyal medya", done: hasText(profile.socialMediaUrl), points: 4 },
    { key: "proof", label: "Yorum veya doğrulama", done: Boolean((profile.reviewCount ?? 0) > 0 || profile.isVerified), points: 4 },
    { key: "credentials", label: "Sertifika", done: hasArrayValue(profile.certifications), points: 2 },
  ];

  const rawScore = checks.reduce((sum, item) => sum + (item.done ? item.points : 0), 0);
  const score = Math.min(100, rawScore);
  const missing = checks.filter((item) => !item.done).map((item) => item.label).slice(0, 4);
  const strengths = checks.filter((item) => item.done).map((item) => item.label).slice(0, 4);

  if (score >= 80) {
    return { score, label: "Güçlü vitrin", tone: "high", missing, strengths };
  }

  if (score >= 55) {
    return { score, label: "Gelişiyor", tone: "medium", missing, strengths };
  }

  return { score, label: "Eksik vitrin", tone: "low", missing, strengths };
}
