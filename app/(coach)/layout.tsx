import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TestDateSelector } from "@/components/coach/TestDateSelector";
import { RoleNavShell } from "@/components/shared/RoleNavShell";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "COACH") redirect("/client/dashboard");

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: session.user.id },
    select: { subscriptionTier: true },
  });
  const tier = profile?.subscriptionTier ?? "FREE";

  return (
    <RoleNavShell role="COACH" userName={session.user.name} tier={tier}>
      <div className="space-y-4">
        {children}
        <TestDateSelector />
      </div>
    </RoleNavShell>
  );
}
