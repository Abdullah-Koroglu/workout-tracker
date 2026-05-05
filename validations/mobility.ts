import { z } from "zod";

const SCRIPT_INJECTION_PATTERN = /<\s*\/?\s*script\b|javascript:|on\w+\s*=|<[^>]+>/i;

const nullableSafeText = (maxLength: number) =>
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

const safeRequiredText = (fieldName: string, maxLength: number) =>
  z
    .string({ required_error: `${fieldName} zorunludur.` })
    .trim()
    .min(2, `${fieldName} en az 2 karakter olmalıdır.`)
    .max(maxLength, `${fieldName} en fazla ${maxLength} karakter olabilir.`)
    .refine((value) => !SCRIPT_INJECTION_PATTERN.test(value), {
      message: `${fieldName} alanında script/html içeriği kullanılamaz.`,
    });

export const mobilityMovementCreateSchema = z.object({
  name: safeRequiredText("Hareket adı", 120),
  videoUrl: z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().url("Geçerli bir video URL girin.").max(500).nullable().optional(),
  ),
  description: nullableSafeText(2000),
});

export const mobilityMovementUpdateSchema = mobilityMovementCreateSchema.partial();

export const routineMovementSchema = z.object({
  movementId: z.string().min(1, "Hareket seçimi zorunludur."),
  durationSeconds: z
    .number({ invalid_type_error: "Süre saniye cinsinden sayı olmalıdır." })
    .int("Süre tam sayı olmalıdır.")
    .min(15, "Süre en az 15 saniye olmalıdır.")
    .max(3600, "Süre en fazla 3600 saniye olabilir."),
  order: z.number().int().min(0).optional(),
});

export const mobilityRoutineCreateSchema = z.object({
  name: safeRequiredText("Rutin adı", 120),
  description: nullableSafeText(2000),
  movements: z.array(routineMovementSchema).min(1, "Rutin en az 1 hareket içermelidir."),
});

export const mobilityRoutineUpdateSchema = mobilityRoutineCreateSchema.partial();

export type MobilityMovementCreateInput = z.infer<typeof mobilityMovementCreateSchema>;
export type MobilityMovementUpdateInput = z.infer<typeof mobilityMovementUpdateSchema>;
export type MobilityRoutineCreateInput = z.infer<typeof mobilityRoutineCreateSchema>;
export type MobilityRoutineUpdateInput = z.infer<typeof mobilityRoutineUpdateSchema>;
