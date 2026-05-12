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
  completed: z.boolean().default(true),
  actualRestSeconds: z.number().int().min(0).optional(),
  groupInstanceId: z.string().optional(),
  dropIndex: z.number().int().min(0).max(5).optional(),
});

export const completeWorkoutSchema = z.object({
  mode: z.enum(["COMPLETED", "ABANDONED"]).optional().default("COMPLETED"),
  notes: z.string().max(2000).optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  moodBefore: z.number().int().min(1).max(5).optional(),
  moodAfter: z.number().int().min(1).max(5).optional(),
  location: z.string().max(80).optional(),
  durationSeconds: z.number().int().min(0).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(1000)
});
