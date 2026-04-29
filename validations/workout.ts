import { z } from "zod";

export const startWorkoutSchema = z.object({
  assignmentId: z.string().min(1)
});

export const saveSetSchema = z.object({
  exerciseId: z.string().min(1),
  setNumber: z.number().int().positive(),
  weightKg: z.number().nonnegative().optional(),
  reps: z.number().int().positive().optional(),
  rir: z.number().int().min(0).max(10).optional(),
  durationMinutes: z.number().int().positive().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  completed: z.boolean().default(true)
});

export const completeWorkoutSchema = z.object({
  mode: z.enum(["COMPLETED", "ABANDONED"]).optional().default("COMPLETED")
});

export const commentSchema = z.object({
  content: z.string().min(1).max(1000)
});
