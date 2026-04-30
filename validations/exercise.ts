import { ExerciseType } from "@prisma/client";
import { z } from "zod";

export const MUSCLE_GROUPS = ["Göğüs", "Sırt", "Bacak", "Omuz", "Kol", "Core", "Diğer"] as const;

export const exerciseSchema = z.object({
  name: z.string().min(2, "Egzersiz adı en az 2 karakter olmalı"),
  type: z.nativeEnum(ExerciseType),
  targetMuscle: z.enum(MUSCLE_GROUPS).optional().nullable(),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
