import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type ThreadUser = {
  id: string;
  name: string;
  email: string;
};

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const currentUserId = auth.session.user.id;
  const isCoach = auth.session.user.role === "COACH";

  const relations = await prisma.coachClientRelation.findMany({
    where: {
      status: "ACCEPTED",
      ...(isCoach ? { coachId: currentUserId } : { clientId: currentUserId })
    },
    include: {
      coach: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } }
    }
  });

  const peers: ThreadUser[] = relations.map((relation) =>
    isCoach ? relation.client : relation.coach
  );

  const threads = await Promise.all(
    peers.map(async (peer) => {
      const [lastMessage, unreadCount] = await Promise.all([
        prisma.message.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: peer.id },
              { senderId: peer.id, receiverId: currentUserId }
            ]
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true
          }
        }),
        prisma.message.count({
          where: {
            senderId: peer.id,
            receiverId: currentUserId,
            isRead: false
          }
        })
      ]);

      return {
        user: peer,
        unreadCount,
        lastMessage
      };
    })
  );

  threads.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt?.getTime?.() || 0;
    const bTime = b.lastMessage?.createdAt?.getTime?.() || 0;
    return bTime - aTime;
  });

  return NextResponse.json({ threads });
}
