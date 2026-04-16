"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/validations/user";

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (values: LoginInput) => {
    setError(null);
    const result = await signIn("credentials", {
      ...values,
      redirect: false
    });

    if (result?.error) {
      setError("Giriş başarısız. Bilgileri kontrol edin.");
      return;
    }

    const sessionResponse = await fetch("/api/auth/session");
    const session = await sessionResponse.json();
    const nextPath = session?.user?.role === "COACH" ? "/coach/dashboard" : "/client/dashboard";

    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="mx-auto mt-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Fit Coach Giriş</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <Input type="email" placeholder="E-posta" {...form.register("email")} />
            <Input type="password" placeholder="Şifre" {...form.register("password")} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Giriş Yap
            </Button>
            <p className="text-sm text-muted-foreground">
              Hesabın yok mu? <Link href="/register" className="underline">Kayıt ol</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
