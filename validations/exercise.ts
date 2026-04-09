import { ExerciseType } from "@prisma/client";
import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string().min(2, "Egzersiz adı en az 2 karakter olmalı"),
  type: z.nativeEnum(ExerciseType)
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
