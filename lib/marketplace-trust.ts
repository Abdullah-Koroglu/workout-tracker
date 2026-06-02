export type MarketplaceTrustInput = {
  profileQualityScore: number;
  isVerified?: boolean | null;
  rating?: number | null;
  reviewCount?: number | null;
  verifiedReviewCount?: number | null;
  successRate?: number | null;
  responseTimeHours?: number | null;
  totalClientsHelped?: number | null;
  hasTransformationPhotos?: boolean;
  hasPricedPackages?: boolean;
};

export type MarketplaceTrustScore = {
  score: number;
  label: string;
  tone: "low" | "medium" | "high";
  summary: string;
  signals: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateMarketplaceTrustScore(
  input: MarketplaceTrustInput
): MarketplaceTrustScore {
  const profileScore = clamp(input.profileQualityScore, 0, 100);
  const ratingScore = input.rating ? clamp((input.rating / 5) * 100, 0, 100) : 0;
  const reviewScore = clamp(((input.reviewCount ?? 0) / 12) * 100, 0, 100);
  const verifiedReviewScore = clamp(((input.verifiedReviewCount ?? 0) / 6) * 100, 0, 100);
  const successScore = input.successRate ? clamp(input.successRate, 0, 100) : 0;
  const responseScore =
    input.responseTimeHours == null
      ? 0
      : input.responseTimeHours <= 4
        ? 100
        : input.responseTimeHours <= 12
          ? 80
          : input.responseTimeHours <= 24
            ? 60
            : 35;
  const socialProofScore = clamp(((input.totalClientsHelped ?? 0) / 120) * 100, 0, 100);

  const rawScore =
    profileScore * 0.32 +
    ratingScore * 0.16 +
    reviewScore * 0.12 +
    verifiedReviewScore * 0.14 +
    successScore * 0.12 +
    responseScore * 0.06 +
    socialProofScore * 0.04 +
    (input.isVerified ? 4 : 0) +
    (input.hasTransformationPhotos ? 3 : 0) +
    (input.hasPricedPackages ? 3 : 0);

  const score = clamp(Math.round(rawScore), 0, 100);

  const signals: string[] = [];
  if (input.isVerified) signals.push("Doğrulanmış koç");
  if ((input.verifiedReviewCount ?? 0) > 0) {
    signals.push(`${input.verifiedReviewCount} doğrulanmış yorum`);
  }
  if ((input.reviewCount ?? 0) >= 3 && input.rating && input.rating >= 4.7) {
    signals.push(`Yüksek puan ${input.rating.toFixed(1)}`);
  }
  if ((input.successRate ?? 0) >= 80) signals.push(`Başarı oranı %${input.successRate}`);
  if ((input.totalClientsHelped ?? 0) >= 50) {
    signals.push(`${input.totalClientsHelped}+ danışan deneyimi`);
  }
  if (input.responseTimeHours != null && input.responseTimeHours <= 12) {
    signals.push(`${input.responseTimeHours} sa içinde dönüş`);
  }
  if (input.hasTransformationPhotos) signals.push("Dönüşüm vitrini mevcut");

  if (score >= 78) {
    return {
      score,
      label: "Yüksek güven",
      tone: "high",
      summary: "Bu profil, açık marketplace'te hızlı karar vermek için yeterli güven sinyali taşıyor.",
      signals: signals.slice(0, 4),
    };
  }

  if (score >= 58) {
    return {
      score,
      label: "Güven oluşuyor",
      tone: "medium",
      summary: "Profilde güçlü işaretler var, ancak birkaç sosyal kanıt daha karar hızını artırır.",
      signals: signals.slice(0, 4),
    };
  }

  return {
    score,
    label: "Güven geliştirilmeli",
    tone: "low",
    summary: "Profil satış için temel sinyaller veriyor, ancak daha fazla kanıt ve tamamlama alanı gerekiyor.",
    signals: signals.slice(0, 4),
  };
}
