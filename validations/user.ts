import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalı"),
  email: z.string().email("Geçerli e-posta giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  role: z.enum(["COACH", "CLIENT"])
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
