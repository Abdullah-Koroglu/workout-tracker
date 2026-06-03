import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionCallScreen } from "@/components/shared/SessionCallScreen";

export default async function SessionCallPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const rtcSession = await prisma.session.findUnique({
    where: { id },
    include: {
      coach: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      participants: true,
    },
  });

  if (!rtcSession) {
    notFound();
  }

  const participant = rtcSession.participants.find((item) => item.userId === session.user.id);
  if (!participant) {
    redirect("/login");
  }

  const peerName = session.user.role === "COACH" ? rtcSession.client.name : rtcSession.coach.name;

  return (
    <SessionCallScreen
      sessionId={rtcSession.id}
      title={rtcSession.type}
      peerName={peerName}
      callMode={rtcSession.callMode}
      canEnd={session.user.role === "COACH"}
      fallbackPath={session.user.role === "COACH" ? "/coach/dashboard" : "/client/dashboard"}
    />
  );
}
