import { z } from "zod";

const nullableTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value !== "string") return value;

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().max(maxLength).nullable().optional(),
  );

const nullablePositiveNumber = (maxValue: number, integer = false) => {
  const numberSchema = integer
    ? z.number().int().positive().max(maxValue)
    : z.number().positive().max(maxValue);

  return z.preprocess(
    (value) => (value === undefined ? undefined : value === null ? null : value),
    numberSchema.nullable().optional(),
  );
};

const nullableIsoDateString = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  },
  z
    .string()
    .datetime({ offset: true })
    .or(z.string().date())
    .nullable()
    .optional(),
);

export const baseProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(255).optional(),
  age: nullablePositiveNumber(120, true),
  birthDate: nullableIsoDateString,
  heightCm: nullablePositiveNumber(300),
  weightKg: nullablePositiveNumber(500),
});

export const coachProfileSchema = baseProfileSchema.extend({
  bio: nullableTrimmedString(2000),
  specialties: z
    .array(z.string().trim().min(1).max(80))
    .max(20)
    .nullable()
    .optional(),
  experienceYears: nullablePositiveNumber(80, true),
  socialMediaUrl: z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value !== "string") return value;

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().url().max(500).nullable().optional(),
  ),
});

export const clientProfileSchema = baseProfileSchema.extend({
  goal: nullableTrimmedString(120),
  fitnessLevel: nullableTrimmedString(60),
});

export type CoachProfileInput = z.infer<typeof coachProfileSchema>;
export type ClientProfileInput = z.infer<typeof clientProfileSchema>;