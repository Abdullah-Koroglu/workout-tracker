import { prisma } from "@/lib/prisma";

const ACTIVE_MEMBER_ROLES = new Set(["OWNER", "ADMIN", "COACH"]);

export async function getAgencyWorkspaceSummaryForCoach(userId: string) {
  const membership = await prisma.agencyMembership.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "INVITED"] },
    },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  coachProfile: {
                    select: {
                      subscriptionTier: true,
                    },
                  },
                },
              },
            },
            orderBy: [{ role: "asc" }, { createdAt: "asc" }],
          },
          sharedClients: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              primaryCoach: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  const memberIds = membership.workspace.members
    .filter((item) => item.status === "ACTIVE" && ACTIVE_MEMBER_ROLES.has(item.role))
    .map((item) => item.userId);

  const relationCounts = memberIds.length
    ? await prisma.coachClientRelation.groupBy({
        by: ["coachId"],
        where: {
          coachId: { in: memberIds },
          status: "ACCEPTED",
        },
        _count: { _all: true },
      })
    : [];

  const relationCountByCoach = new Map(
    relationCounts.map((item) => [item.coachId, item._count._all]),
  );

  const activeMembers = membership.workspace.members.filter((item) => item.status === "ACTIVE");
  const activeCoaches = activeMembers.filter((item) => ACTIVE_MEMBER_ROLES.has(item.role));
  const seatsUsed = activeMembers.length;
  const sharedClientCount = membership.workspace.sharedClients.length;
  const unassignedSharedClients = membership.workspace.sharedClients.filter((item) => !item.primaryCoachId).length;

  return {
    membership: {
      id: membership.id,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      permissions: membership.permissions,
    },
    workspace: {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      city: membership.workspace.city,
      billingEmail: membership.workspace.billingEmail,
      isGym: membership.workspace.isGym,
      seatsIncluded: membership.workspace.seatsIncluded,
      createdAt: membership.workspace.createdAt,
      updatedAt: membership.workspace.updatedAt,
      metrics: {
        seatsUsed,
        activeCoaches: activeCoaches.length,
        sharedClientCount,
        unassignedSharedClients,
      },
      members: membership.workspace.members.map((item) => ({
        id: item.id,
        userId: item.userId,
        role: item.role,
        status: item.status,
        joinedAt: item.joinedAt,
        createdAt: item.createdAt,
        permissions: item.permissions,
        acceptedClientCount: relationCountByCoach.get(item.userId) ?? 0,
        user: item.user,
      })),
      sharedClients: membership.workspace.sharedClients.map((item) => ({
        id: item.id,
        visibility: item.visibility,
        createdAt: item.createdAt,
        client: item.client,
        primaryCoach: item.primaryCoach,
      })),
    },
  };
}
