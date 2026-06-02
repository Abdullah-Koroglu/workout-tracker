import { prisma } from "@/lib/prisma";

const VERIFIED_SUBSCRIPTION_STATUSES = [
  "active",
  "paused",
  "expired",
  "cancelled",
  "canceled",
  "ACTIVE",
  "PAUSED",
  "EXPIRED",
  "CANCELLED",
  "CANCELED",
] as const;

export type ReviewVerificationContext = {
  canReview: boolean;
  verifiedPurchase: boolean;
  durationWithCoach: number | null;
  relationStatus: string | null;
  hasSubscriptionHistory: boolean;
  hasCompletedSessionHistory: boolean;
  eligibilityReason: string | null;
};

function computeDurationWeeks(startDate: Date | null) {
  if (!startDate) return null;
  return Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
}

export async function getReviewVerificationContext(coachId: string, clientId: string): Promise<ReviewVerificationContext> {
  const [relation, subscription, completedSession] = await Promise.all([
    prisma.coachClientRelation.findFirst({
      where: { coachId, clientId },
      orderBy: { createdAt: "asc" },
      select: {
        status: true,
        createdAt: true,
      },
    }),
    prisma.subscription.findFirst({
      where: {
        coachId,
        clientId,
        status: { in: [...VERIFIED_SUBSCRIPTION_STATUSES] },
      },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
      },
    }),
    prisma.session.findFirst({
      where: {
        coachId,
        clientId,
        status: "COMPLETED",
      },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
      },
    }),
  ]);

  const hasRelation = Boolean(relation);
  const hasSubscriptionHistory = Boolean(subscription);
  const hasCompletedSessionHistory = Boolean(completedSession);
  const canReview = hasRelation || hasSubscriptionHistory || hasCompletedSessionHistory;
  const verifiedPurchase =
    relation?.status === "ACCEPTED" || hasSubscriptionHistory || hasCompletedSessionHistory;

  const earliestDate = [relation?.createdAt, subscription?.createdAt, completedSession?.createdAt]
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

  return {
    canReview,
    verifiedPurchase,
    durationWithCoach: computeDurationWeeks(earliestDate),
    relationStatus: relation?.status ?? null,
    hasSubscriptionHistory,
    hasCompletedSessionHistory,
    eligibilityReason: canReview
      ? null
      : "Yalnizca gercek koçluk iliskisi, seans veya abonelik gecmisi olan danisanlar yorum birakabilir.",
  };
}
