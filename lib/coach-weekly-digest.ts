import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type DigestRange = {
  start: Date;
  end: Date;
};

type DigestClient = {
  clientId: string;
  name: string;
  reason: string;
};

export type CoachWeeklyDigest = {
  coachId: string;
  weekLabel: string;
  period: DigestRange;
  activeClients: number;
  completedCount: number;
  abandonedCount: number;
  completionRate: number;
  prCount: number;
  bodyLogCount: number;
  nutritionLogCount: number;
  nutritionAdherenceRate: number;
  checkInSentCount: number;
  checkInResponseRate: number;
  summary: string;
  topPerformer: DigestClient | null;
  atRiskClients: DigestClient[];
  inactiveClients: DigestClient[];
  riskSignals: string[];
  suggestedActions: string[];
};

type CheckInSnapshot = {
  sleepScore: number;
  stressScore: number;
  motivationScore: number;
};

type SnapshotMetrics = {
  summary: string;
  topPerformerClientId: string | null;
  atRiskClientIds: string[];
  inactiveClientIds: string[];
  prCount: number;
  checkInResponseRate: number;
  coachActionSuggestions: string[];
  completionRate: number;
  completedCount: number;
  abandonedCount: number;
  activeClients: number;
  bodyLogCount: number;
  nutritionLogCount: number;
  nutritionAdherenceRate: number;
  riskSignals: string[];
};

export function getPreviousWeekRange(referenceDate = new Date()): DigestRange {
  const day = referenceDate.getDay();
  const mondayOffset = (day + 6) % 7;

  const thisMonday = new Date(referenceDate);
  thisMonday.setDate(referenceDate.getDate() - mondayOffset);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  return { start: lastMonday, end: thisMonday };
}

export function getRollingWeekRange(referenceDate = new Date()): DigestRange {
  const end = new Date(referenceDate);
  const start = new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function formatWeekLabel(start: Date, end: Date) {
  return `${start.toLocaleDateString("tr-TR")} - ${new Date(end.getTime() - 1).toLocaleDateString("tr-TR")}`;
}

function ratio(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function createClientLookup(clients: Array<{ id: string; name: string }>) {
  return new Map(clients.map((client) => [client.id, client.name]));
}

function buildSuggestions(input: {
  activeClients: number;
  atRiskClients: DigestClient[];
  completionRate: number;
  nutritionAdherenceRate: number;
  nutritionLogCount: number;
  bodyLogCount: number;
  prCount: number;
}) {
  const suggestions: string[] = [];

  if (input.atRiskClients.length > 0) {
    suggestions.push(`${input.atRiskClients[0].name} ile 10 dakikalik bir toparlama gorusmesi planla.`);
  }

  if (input.completionRate < 75) {
    suggestions.push("Tamamlanmayan programlar icin mini yeniden baslatma planini bu hafta kilitle.");
  }

  if (input.nutritionLogCount > 0 && input.nutritionAdherenceRate < 70) {
    suggestions.push("Beslenme uyumu dusuk olan danisanlar icin daha kolay takip gorevleri tanimla.");
  }

  if (input.bodyLogCount < Math.max(1, Math.ceil(input.activeClients / 2))) {
    suggestions.push("Olcum ve fotograf takibini hatirlat; donusum hikayeleri icin veri biriktir.");
  }

  if (input.prCount > 0) {
    suggestions.push("PR yapan danisanlardan birini sosyal kanit olarak vitrine tasimayi dusun.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Bu hafta aksiyon merkezi ve marketplace profilini bir arada kullanarak yeni talep toplamaya odaklan.");
  }

  return suggestions.slice(0, 3);
}

function buildRiskSignals(input: {
  atRiskClients: DigestClient[];
  inactiveClients: DigestClient[];
  completionRate: number;
  nutritionAdherenceRate: number;
  nutritionLogCount: number;
  checkInResponseRate: number;
}) {
  const signals: string[] = [];

  if (input.atRiskClients.length > 0) {
    signals.push(`${input.atRiskClients.length} riskli danisan yakindan takip bekliyor.`);
  }

  if (input.inactiveClients.length > 0) {
    signals.push(`${input.inactiveClients.length} danisan 7+ gundur tamamlanan antrenman girmedi.`);
  }

  if (input.completionRate < 75) {
    signals.push(`Tamamlanma orani %${input.completionRate} seviyesinde.`);
  }

  if (input.nutritionLogCount > 0 && input.nutritionAdherenceRate < 70) {
    signals.push(`Beslenme uyumu %${input.nutritionAdherenceRate} ile destek istiyor.`);
  }

  if (input.checkInResponseRate > 0 && input.checkInResponseRate < 60) {
    signals.push(`Check-in geri donus orani %${input.checkInResponseRate}; temas ritmi dusuyor olabilir.`);
  }

  return signals.slice(0, 4);
}

export async function buildCoachWeeklyDigest(
  coachId: string,
  range: DigestRange = getRollingWeekRange()
): Promise<CoachWeeklyDigest> {
  const relationRows = await prisma.coachClientRelation.findMany({
    where: {
      coachId,
      status: "ACCEPTED",
    },
    select: {
      clientId: true,
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const clients = relationRows.map((row) => row.client);
  const clientIds = clients.map((client) => client.id);
  const clientNameById = createClientLookup(clients);

  if (clientIds.length === 0) {
    return {
      coachId,
      weekLabel: formatWeekLabel(range.start, range.end),
      period: range,
      activeClients: 0,
      completedCount: 0,
      abandonedCount: 0,
      completionRate: 0,
      prCount: 0,
      bodyLogCount: 0,
      nutritionLogCount: 0,
      nutritionAdherenceRate: 0,
      checkInSentCount: 0,
      checkInResponseRate: 0,
      summary: "Bu hafta kabul edilmis aktif danisan olmadigi icin AI ozet hazirlanmadi.",
      topPerformer: null,
      atRiskClients: [],
      inactiveClients: [],
      riskSignals: ["Yeni danisan almak icin marketplace profilini ve davet akisini guclendir."],
      suggestedActions: [
        "Marketplace profilini tamamla ve ilk sosyal kanit hikayeni ekle.",
        "Davet linkini aktif kullanarak ilk danisanlarini sisteme al.",
      ],
    };
  }

  const inactivityThreshold = new Date(range.end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const assignmentWindowStart = new Date(range.start.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    completedCount,
    abandonedCount,
    prCount,
    bodyLogCount,
    nutritionLogs,
    checkIns,
    relationHealth,
    completedWorkoutsByClient,
  ] = await Promise.all([
    prisma.workout.count({
      where: {
        clientId: { in: clientIds },
        status: "COMPLETED",
        finishedAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.workout.count({
      where: {
        clientId: { in: clientIds },
        status: "ABANDONED",
        finishedAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.personalRecord.count({
      where: {
        clientId: { in: clientIds },
        achievedAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.bodyMetricLog.count({
      where: {
        clientId: { in: clientIds },
        date: { gte: range.start, lt: range.end },
      },
    }),
    prisma.nutritionMealLog.findMany({
      where: {
        clientId: { in: clientIds },
        loggedAt: { gte: range.start, lt: range.end },
      },
      select: {
        clientId: true,
        adherenceTag: true,
      },
    }),
    prisma.checkIn.findMany({
      where: {
        coachId,
        createdAt: { gte: range.start, lt: range.end },
      },
      select: {
        clientId: true,
        response: {
          select: {
            sleepScore: true,
            stressScore: true,
            motivationScore: true,
          },
        },
      },
    }),
    prisma.coachClientRelation.findMany({
      where: {
        coachId,
        status: "ACCEPTED",
      },
      select: {
        clientId: true,
        client: {
          select: {
            name: true,
            workouts: {
              where: {
                status: "COMPLETED",
                finishedAt: { lt: range.end },
              },
              orderBy: { finishedAt: "desc" },
              take: 1,
              select: { finishedAt: true },
            },
            assignments: {
              where: {
                scheduledFor: { gte: assignmentWindowStart, lte: range.end },
              },
              select: {
                workouts: {
                  take: 1,
                  orderBy: { startedAt: "desc" },
                  select: { status: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.workout.groupBy({
      by: ["clientId"],
      where: {
        clientId: { in: clientIds },
        status: "COMPLETED",
        finishedAt: { gte: range.start, lt: range.end },
      },
      _count: { _all: true },
    }),
  ]);

  const totalRelevant = completedCount + abandonedCount;
  const completionRate = ratio(completedCount, totalRelevant);

  const nutritionLogCount = nutritionLogs.length;
  const greenNutritionCount = nutritionLogs.filter((item) => item.adherenceTag === "GREEN").length;
  const nutritionAdherenceRate = ratio(greenNutritionCount, nutritionLogCount);

  const respondedCheckIns = checkIns.filter((item) => item.response).length;
  const checkInResponseRate = ratio(respondedCheckIns, checkIns.length);

  const latestCheckInByClient = new Map<string, CheckInSnapshot>();
  for (const item of checkIns) {
    if (!item.response || latestCheckInByClient.has(item.clientId)) {
      continue;
    }
    latestCheckInByClient.set(item.clientId, item.response);
  }

  const inactiveClients: DigestClient[] = [];
  const atRiskClients: DigestClient[] = [];

  for (const relation of relationHealth) {
    const clientName = relation.client.name;
    const lastWorkout = relation.client.workouts[0]?.finishedAt ?? null;
    const missedAssignments = relation.client.assignments.filter((assignment) => {
      const lastWorkoutStatus = assignment.workouts[0]?.status ?? null;
      return lastWorkoutStatus === null || lastWorkoutStatus === "ABANDONED";
    }).length;
    const latestCheckIn = latestCheckInByClient.get(relation.clientId);

    if (lastWorkout === null || lastWorkout < inactivityThreshold) {
      inactiveClients.push({
        clientId: relation.clientId,
        name: clientName,
        reason: lastWorkout === null ? "Henuz tamamlanan antrenman yok" : "7+ gundur tamamlanan antrenman yok",
      });
    }

    if (latestCheckIn && (latestCheckIn.stressScore >= 8 || latestCheckIn.motivationScore <= 4 || latestCheckIn.sleepScore <= 4)) {
      atRiskClients.push({
        clientId: relation.clientId,
        name: clientName,
        reason: "Stres, motivasyon veya uyku skoru kritik sinyal veriyor",
      });
      continue;
    }

    if (missedAssignments >= 2) {
      atRiskClients.push({
        clientId: relation.clientId,
        name: clientName,
        reason: `${missedAssignments} plan aksamis gorunuyor`,
      });
      continue;
    }

    if (lastWorkout === null || lastWorkout < inactivityThreshold) {
      atRiskClients.push({
        clientId: relation.clientId,
        name: clientName,
        reason: "Yeniden aktivasyon ihtiyaci var",
      });
    }
  }

  const topPerformerRow = completedWorkoutsByClient.sort((a, b) => b._count._all - a._count._all)[0] ?? null;
  const topPerformer = topPerformerRow
    ? {
        clientId: topPerformerRow.clientId,
        name: clientNameById.get(topPerformerRow.clientId) ?? "Danisan",
        reason: `${topPerformerRow._count._all} tamamlanan antrenman`,
      }
    : null;

  const riskSignals = buildRiskSignals({
    atRiskClients,
    inactiveClients,
    completionRate,
    nutritionAdherenceRate,
    nutritionLogCount,
    checkInResponseRate,
  });

  const suggestedActions = buildSuggestions({
    activeClients: clientIds.length,
    atRiskClients,
    completionRate,
    nutritionAdherenceRate,
    nutritionLogCount,
    bodyLogCount,
    prCount,
  });

  const summaryParts = [
    `Son 7 gunde ${completedCount} antrenman tamamlandi`,
    prCount > 0 ? `${prCount} PR geldi` : "yeni PR kaydi cikmadi",
    atRiskClients.length > 0 ? `${atRiskClients.length} riskli danisan takipte` : "kritik risk sinyali dusuk",
  ];

  return {
    coachId,
    weekLabel: formatWeekLabel(range.start, range.end),
    period: range,
    activeClients: clientIds.length,
    completedCount,
    abandonedCount,
    completionRate,
    prCount,
    bodyLogCount,
    nutritionLogCount,
    nutritionAdherenceRate,
    checkInSentCount: checkIns.length,
    checkInResponseRate,
    summary: `${summaryParts.join(", ")}.`,
    topPerformer,
    atRiskClients: atRiskClients.slice(0, 4),
    inactiveClients: inactiveClients.slice(0, 4),
    riskSignals,
    suggestedActions,
  };
}

export async function saveCoachWeeklyDigestSnapshot(digest: CoachWeeklyDigest) {
  const metrics: SnapshotMetrics = {
    summary: digest.summary,
    topPerformerClientId: digest.topPerformer?.clientId ?? null,
    atRiskClientIds: digest.atRiskClients.map((client) => client.clientId),
    inactiveClientIds: digest.inactiveClients.map((client) => client.clientId),
    prCount: digest.prCount,
    checkInResponseRate: digest.checkInResponseRate / 100,
    coachActionSuggestions: digest.suggestedActions,
    completionRate: digest.completionRate,
    completedCount: digest.completedCount,
    abandonedCount: digest.abandonedCount,
    activeClients: digest.activeClients,
    bodyLogCount: digest.bodyLogCount,
    nutritionLogCount: digest.nutritionLogCount,
    nutritionAdherenceRate: digest.nutritionAdherenceRate,
    riskSignals: digest.riskSignals,
  };

  await prisma.analyticsSnapshot.upsert({
    where: {
      scope_scopeId_date: {
        scope: "coach_digest_weekly",
        scopeId: digest.coachId,
        date: digest.period.start,
      },
    },
    update: {
      metrics: metrics as Prisma.InputJsonValue,
    },
    create: {
      scope: "coach_digest_weekly",
      scopeId: digest.coachId,
      date: digest.period.start,
      metrics: metrics as Prisma.InputJsonValue,
    },
  });
}
