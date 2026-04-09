import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { isPrismaUniqueError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/validations/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        role: parsed.data.role
      }
    });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
