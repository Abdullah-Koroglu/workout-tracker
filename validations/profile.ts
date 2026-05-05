import { z } from "zod";

const SCRIPT_INJECTION_PATTERN = /<\s*\/?\s*script\b|javascript:|on\w+\s*=|<[^>]+>/i;

const safeText = (fieldLabel: string, minLength: number, maxLength: number) =>
  z
    .string({ required_error: `${fieldLabel} zorunludur.` })
    .trim()
    .min(minLength, `${fieldLabel} en az ${minLength} karakter olmalıdır.`)
    .max(maxLength, `${fieldLabel} en fazla ${maxLength} karakter olabilir.`)
    .refine((value) => !SCRIPT_INJECTION_PATTERN.test(value), {
      message: `${fieldLabel} alanında script/html içeriği kullanılamaz.`,
    });

const nullableTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value !== "string") return value;

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z
      .string()
      .max(maxLength)
      .refine((value) => !SCRIPT_INJECTION_PATTERN.test(value), {
        message: "Script/html içeriği kullanılamaz.",
      })
      .nullable()
      .optional(),
  );

const nullablePositiveNumber = (maxValue: number, integer = false) => {
  const numberSchema = integer
    ? z
        .number({ invalid_type_error: "Geçerli bir sayı girin." })
        .int("Tam sayı girin.")
        .min(0, "Negatif sayı kabul edilmez.")
        .max(maxValue, `Değer ${maxValue} değerini aşamaz.`)
    : z
        .number({ invalid_type_error: "Geçerli bir sayı girin." })
        .min(0, "Negatif sayı kabul edilmez.")
        .max(maxValue, `Değer ${maxValue} değerini aşamaz.`);

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
  name: safeText("Ad soyad", 2, 100).optional(),
  email: z
    .string()
    .trim()
    .email("Geçersiz e-posta formatı.")
    .max(255, "E-posta en fazla 255 karakter olabilir.")
    .refine((value) => !SCRIPT_INJECTION_PATTERN.test(value), {
      message: "E-posta alanında script/html içeriği kullanılamaz.",
    })
    .optional(),
  age: nullablePositiveNumber(120, true),
  gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]).nullable().optional(),
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