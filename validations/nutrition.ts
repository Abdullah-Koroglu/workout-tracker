import { z } from "zod";

export const nutritionPlanSchema = z.object({
  targetCalories: z.number().int().positive().max(10000).nullable().optional(),
  targetProtein: z.number().int().nonnegative().max(2000).nullable().optional(),
  targetCarbs: z.number().int().nonnegative().max(2000).nullable().optional(),
  targetFats: z.number().int().nonnegative().max(2000).nullable().optional(),
  dietDocumentUrl: z.string().url().nullable().optional(),
  instructions: z.string().max(4000).nullable().optional(),
});

export const nutritionMealLogSchema = z.object({
  photoUrl: z.string().url().nullable().optional(),
  adherenceTag: z.enum(["GREEN", "YELLOW", "RED"]),
  clientNote: z.string().max(2000).nullable().optional(),
});

export type NutritionPlanInput = z.infer<typeof nutritionPlanSchema>;
export type NutritionMealLogInput = z.infer<typeof nutritionMealLogSchema>;
