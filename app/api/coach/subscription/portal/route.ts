import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: auth.session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!profile?.stripeCustomerId) {
    return NextResponse.json({ error: "Stripe musteri kaydi bulunamadi." }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = request.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${origin}/coach/billing`,
  });

  return NextResponse.json({ url: session.url });
}
