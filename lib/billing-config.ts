import { SubscriptionTier } from "@prisma/client";

export type BillingCycle = "monthly" | "yearly";

export type BillingPlanDefinition = {
  tier: SubscriptionTier;
  label: string;
  maxClients: number | null;
  maxTemplates: number | null;
  price: {
    monthly: number;
    yearly: number | null;
  };
  features: string[];
  popular?: boolean;
  stripePriceIds?: Partial<Record<BillingCycle, string>>;
  iyzicoPricingPlanCodes?: Partial<Record<BillingCycle, string>>;
};

export const BILLING_PLANS: Record<SubscriptionTier, BillingPlanDefinition> = {
  FREE: {
    tier: "FREE",
    label: "Free",
    maxClients: 3,
    maxTemplates: 8,
    price: { monthly: 0, yearly: 0 },
    features: [
      "3 aktif danışan",
      "8 antrenman şablonu",
      "Temel mesajlaşma",
      "Marketplace vitrin profili",
      "Davet linki ile danışan alma",
    ],
  },
  TIER_1: {
    tier: "TIER_1",
    label: "Pro",
    maxClients: 15,
    maxTemplates: 20,
    price: { monthly: 2500, yearly: 2300 },
    features: [
      "15 aktif danışan",
      "20 özel antrenman şablonu",
      "Check-in, ölçüm ve beslenme takibi",
      "Marketplace görünürlük önerileri",
      "Haftalık sessiz AI koç raporu",
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_PRO_PRICE_ID ?? "",
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
    },
    iyzicoPricingPlanCodes: {
      monthly: process.env.IYZICO_PRO_MONTHLY_PLAN_CODE ?? "",
      yearly: process.env.IYZICO_PRO_YEARLY_PLAN_CODE ?? "",
    },
  },
  TIER_2: {
    tier: "TIER_2",
    label: "Elite",
    maxClients: 50,
    maxTemplates: null,
    price: { monthly: 7900, yearly: 6300 },
    features: [
      "50 aktif danışan",
      "Limitsiz antrenman şablonu",
      "Gelişmiş performans ve risk analitiği",
      "Toplu mesaj ve aksiyon merkezi",
      "Dönüşüm vitrini ve öncelikli destek",
    ],
    popular: true,
    stripePriceIds: {
      monthly: process.env.STRIPE_ELITE_PRICE_ID ?? "",
      yearly: process.env.STRIPE_ELITE_YEARLY_PRICE_ID ?? "",
    },
    iyzicoPricingPlanCodes: {
      monthly: process.env.IYZICO_ELITE_MONTHLY_PLAN_CODE ?? "",
      yearly: process.env.IYZICO_ELITE_YEARLY_PLAN_CODE ?? "",
    },
  },
  AGENCY: {
    tier: "AGENCY",
    label: "Agency",
    maxClients: 9999,
    maxTemplates: null,
    price: { monthly: 19900, yearly: null },
    features: [
      "Çoklu koç ve ekip hazırlığı",
      "Yüksek danışan kapasitesi",
      "Gym ve ajans operasyon akışı",
      "RTC görüşme katmanı entegrasyon hazırlığı",
      "Öncelikli onboarding ve destek",
    ],
  },
};

export function getBillingPlan(tier: SubscriptionTier) {
  return BILLING_PLANS[tier];
}

export function getPaidPlanCatalog() {
  return [BILLING_PLANS.TIER_1, BILLING_PLANS.TIER_2, BILLING_PLANS.AGENCY];
}

export function getSupportedBillingCycles() {
  const yearlyEnabled = [BILLING_PLANS.TIER_1, BILLING_PLANS.TIER_2].every(
    (plan) => Boolean(plan.stripePriceIds?.yearly || plan.iyzicoPricingPlanCodes?.yearly || plan.price.yearly),
  );

  return yearlyEnabled ? (["monthly", "yearly"] as BillingCycle[]) : (["monthly"] as BillingCycle[]);
}

export function getTierFromStripePriceId(priceId: string | null | undefined): SubscriptionTier | null {
  if (!priceId) return null;

  for (const plan of Object.values(BILLING_PLANS)) {
    if (plan.stripePriceIds?.monthly === priceId || plan.stripePriceIds?.yearly === priceId) {
      return plan.tier;
    }
  }

  return null;
}
