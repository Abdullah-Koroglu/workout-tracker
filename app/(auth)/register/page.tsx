"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { registerSchema } from "@/validations/user";

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "CLIENT" }
  });

  const onSubmit = async (values: RegisterInput) => {
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!res.ok) {
      setError("Kayıt oluşturulamadı.");
      return;
    }

    router.push("/login");
  };

  return (
    <div className="mx-auto mt-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>FitCoach Kayıt</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <Input placeholder="Ad Soyad" {...form.register("name")} />
            <Input type="email" placeholder="E-posta" {...form.register("email")} />
            <Input type="password" placeholder="Şifre" {...form.register("password")} />

            <select
              {...form.register("role")}
              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="COACH">COACH</option>
              <option value="CLIENT">CLIENT</option>
            </select>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Kayıt Ol
            </Button>
            <p className="text-sm text-muted-foreground">
              Hesabın var mı? <Link href="/login" className="underline">Giriş yap</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
