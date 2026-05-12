import { z } from "zod";

export const cardioProtocolEntrySchema = z.object({
  durationMinutes: z.number().int().positive(),
  speed: z.number().nonnegative(),
  incline: z.number().nonnegative()
});

const groupingFieldsSchema = {
  groupId: z.string().nullable().optional(),
  groupType: z.enum(["SUPERSET", "DROPSET"]).nullable().optional(),
  groupOrder: z.number().int().min(0).nullable().optional(),
  dropCount: z.number().int().min(2).max(6).nullable().optional()
};

const weightExerciseSchema = z.object({
  exerciseType: z.literal("WEIGHT"),
  exerciseId: z.string().min(1),
  order: z.number().int().nonnegative(),
  targetSets: z.number().int().positive(),
  targetReps: z.number().int().positive(),
  targetRir: z.number().int().min(0).max(5),
  durationMinutes: z.null().optional().default(null),
  protocol: z.null().optional().default(null),
  ...groupingFieldsSchema
});

const cardioExerciseSchema = z.object({
  exerciseType: z.literal("CARDIO"),
  exerciseId: z.string().min(1),
  order: z.number().int().nonnegative(),
  durationMinutes: z.number().int().nonnegative().optional().default(0),
  protocol: z.array(cardioProtocolEntrySchema).min(1),
  targetSets: z.null().optional().default(null),
  targetReps: z.null().optional().default(null),
  targetRir: z.null().optional().default(null),
  ...groupingFieldsSchema
});

export const templateExerciseSchema = z.union([
  weightExerciseSchema,
  cardioExerciseSchema
]);

export const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional()
});

export const templateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  exercises: z.array(templateExerciseSchema).min(1)
}).superRefine((value, ctx) => {
  value.exercises.forEach((exercise, index) => {
    if (exercise.groupType === "DROPSET" && exercise.dropCount == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dropset icin drop sayisi zorunludur.",
        path: ["exercises", index, "dropCount"]
      });
    }

    if (exercise.exerciseType !== "CARDIO") {
      return;
    }

    const total = exercise.protocol.reduce((sum, row) => sum + row.durationMinutes, 0);
    if (total <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kardiyo protokol toplam suresi sifirdan buyuk olmali.",
        path: ["exercises", index, "protocol"]
      });
    }
  });
});

export type TemplateFormValues = z.infer<typeof templateSchema>;
