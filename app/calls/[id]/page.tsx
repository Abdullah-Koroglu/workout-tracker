import { notFound, redirect } from "next/navigation";

import { CallInviteScreen } from "@/components/shared/CallInviteScreen";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CallInvitePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const call = await prisma.callInvite.findUnique({
    where: { id },
    select: {
      id: true,
      callerId: true,
      calleeId: true,
    },
  });

  if (!call) {
    notFound();
  }

  if (call.callerId !== session.user.id && call.calleeId !== session.user.id) {
    redirect(session.user.role === "COACH" ? "/coach/messages" : "/client/messages");
  }

  return (
    <CallInviteScreen
      callId={call.id}
      currentUserId={session.user.id}
      fallbackPath={session.user.role === "COACH" ? "/coach/messages" : "/client/messages"}
    />
  );
}
