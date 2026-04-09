import { z } from "zod";

export const cardioProtocolEntrySchema = z.object({
  minute: z.number().int().positive(),
  speed: z.number().nonnegative(),
  incline: z.number().nonnegative()
});

const weightExerciseSchema = z.object({
  exerciseType: z.literal("WEIGHT"),
  exerciseId: z.string().min(1),
  order: z.number().int().nonnegative(),
  targetSets: z.number().int().positive(),
  targetReps: z.number().int().positive(),
  targetRir: z.number().int().min(0).max(5),
  durationMinutes: z.null().optional().default(null),
  protocol: z.null().optional().default(null)
});

const cardioExerciseSchema = z.object({
  exerciseType: z.literal("CARDIO"),
  exerciseId: z.string().min(1),
  order: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive(),
  protocol: z.array(cardioProtocolEntrySchema).min(1),
  targetSets: z.null().optional().default(null),
  targetReps: z.null().optional().default(null),
  targetRir: z.null().optional().default(null)
});

export const templateExerciseSchema = z.discriminatedUnion("exerciseType", [
  weightExerciseSchema,
  cardioExerciseSchema
]);

export const templateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  exercises: z.array(templateExerciseSchema).min(1)
});

export type TemplateFormValues = z.infer<typeof templateSchema>;
