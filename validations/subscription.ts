import { z } from "zod";

export const subscriptionCheckoutSchema = z.object({
  tier: z.enum(["PRO", "ELITE"]),
  cycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const commentUpdateSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export const coachCheckInQuerySchema = z.object({
  clientId: z.string().min(1).optional(),
  status: z.enum(["all", "pending", "answered"]).default("all"),
  take: z.coerce.number().int().positive().max(100).default(50),
});

export type SubscriptionCheckoutInput = z.infer<typeof subscriptionCheckoutSchema>;