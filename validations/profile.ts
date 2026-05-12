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

const nullableHexColor = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  },
  z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Geçerli bir HEX renk kodu girin.")
    .nullable()
    .optional(),
);

const nullableTransformationPhotos = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return value;
  },
  z
    .array(
      z.object({
        id: z.string().min(1),
        beforeUrl: z.string().trim().url().max(1000),
        afterUrl: z.string().trim().url().max(1000),
        title: z.string().trim().max(120).nullable().optional(),
      }),
    )
    .max(24)
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

const nullableUrl = (max = 500) =>
  z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().url().max(max).nullable().optional(),
  );

export const coachProfileSchema = baseProfileSchema.extend({
  bio: nullableTrimmedString(2000),
  slogan: nullableTrimmedString(140),
  accentColor: nullableHexColor,
  transformationPhotos: nullableTransformationPhotos,
  specialties: z
    .array(z.string().trim().min(1).max(80))
    .max(20)
    .nullable()
    .optional(),
  experienceYears: nullablePositiveNumber(80, true),
  socialMediaUrl: nullableUrl(),
  city: nullableTrimmedString(100),
  videoIntroUrl: nullableUrl(1000),
  languages: z.array(z.string().trim().min(1).max(40)).max(10).nullable().optional(),
  certifications: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        issuer: z.string().trim().max(120).optional(),
        year: z.number().int().min(1950).max(2100).optional(),
        url: z.string().url().max(1000).optional(),
      }),
    )
    .max(20)
    .nullable()
    .optional(),
  education: z
    .array(
      z.object({
        school: z.string().trim().min(1).max(120),
        degree: z.string().trim().max(120).optional(),
        year: z.number().int().min(1950).max(2100).optional(),
      }),
    )
    .max(10)
    .nullable()
    .optional(),
  hourlyRate: nullablePositiveNumber(100000),
  responseTimeHours: nullablePositiveNumber(168, true),
  totalClientsHelped: nullablePositiveNumber(100000, true),
  beforeAfterStories: z
    .array(
      z.object({
        clientName: z.string().trim().max(120).optional(),
        beforeUrl: z.string().url().max(1000),
        afterUrl: z.string().url().max(1000),
        description: z.string().max(500).optional(),
        durationWeeks: z.number().int().min(0).max(520).optional(),
      }),
    )
    .max(24)
    .nullable()
    .optional(),
  faqs: z
    .array(
      z.object({
        q: z.string().trim().min(1).max(200),
        a: z.string().trim().min(1).max(1000),
      }),
    )
    .max(20)
    .nullable()
    .optional(),
  isVerified: z.boolean().optional(),
  isAcceptingClients: z.boolean().optional(),
});

export const clientProfileSchema = baseProfileSchema.extend({
  goal: nullableTrimmedString(120),
  fitnessLevel: nullableTrimmedString(60),
});

export type CoachProfileInput = z.infer<typeof coachProfileSchema>;
export type ClientProfileInput = z.infer<typeof clientProfileSchema>;