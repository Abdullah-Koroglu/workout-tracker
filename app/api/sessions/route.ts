import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  coachId: z.string().min(1),
  scheduledFor: z.string().datetime(),
  duration: z.number().int().min(15).max(180).default(60),
  type: z.enum(["consultation", "follow_up", "check_in"]).default("consultation"),
  notes: z.string().max(500).optional(),
});

// GET /api/sessions  (returns sessions for the authenticated user)
export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // SCHEDULED | COMPLETED | CANCELLED

  const userId = auth.session.user.id;
  const role = auth.session.user.role;

  const where = {
    ...(role === "COACH" ? { coachId: userId } : { clientId: userId }),
    ...(status ? { status: status as "SCHEDULED" | "COMPLETED" | "CANCELLED" } : {}),
  };

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { scheduledFor: "asc" },
    include: {
      coach: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ sessions });
}

// POST /api/sessions  (CLIENT books a session)
export async function POST(request: Request) {
  const auth = await requireAuth("CLIENT");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { coachId, scheduledFor, duration, type, notes } = parsed.data;

  // Must have an accepted relation
  const relation = await prisma.coachClientRelation.findFirst({
    where: { coachId, clientId: auth.session.user.id, status: "ACCEPTED" },
  });
  if (!relation) {
    return NextResponse.json(
      { error: "Sadece bağlı olduğunuz koçla seans planlayabilirsiniz" },
      { status: 403 }
    );
  }

  const session = await prisma.session.create({
    data: {
      coachId,
      clientId: auth.session.user.id,
      scheduledFor: new Date(scheduledFor),
      duration,
      type,
      notes,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
