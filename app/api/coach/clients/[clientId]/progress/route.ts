import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth("COACH");
  if (auth.error) return auth.error;

  const { clientId } = await params;
  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get("exerciseId");
  const range = searchParams.get("range") || "all";

  if (!exerciseId) {
    return NextResponse.json(
      { error: "exerciseId parametresi gerekli." },
      { status: 400 }
    );
  }

  // Calculate date range
  const now = new Date();
  let startDate = new Date();

  switch (range) {
    case "4weeks":
      startDate.setDate(now.getDate() - 28);
      break;
    case "3months":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "all":
    default:
      startDate = new Date("2000-01-01");
  }

  // Get all workout sets for this client/exercise in the date range
  const sets = await prisma.workoutSet.findMany({
    where: {
      exerciseId,
      workout: {
        clientId,
        startedAt: {
          gte: startDate,
        },
      },
    },
    include: {
      workout: {
        select: {
          startedAt: true,
        },
      },
    },
    orderBy: {
      workout: {
        startedAt: "asc",
      },
    },
  });

  // Group sets by date
  const dataByDate: Record<
    string,
    {
      date: string;
      maxWeight: number;
      totalVolume: number;
      setCount: number;
    }
  > = {};

  sets.forEach((set) => {
    const dateStr = set.workout.startedAt.toISOString().split("T")[0];

    if (!dataByDate[dateStr]) {
      dataByDate[dateStr] = {
        date: dateStr,
        maxWeight: 0,
        totalVolume: 0,
        setCount: 0,
      };
    }

    if (set.weightKg && set.reps) {
      dataByDate[dateStr].maxWeight = Math.max(
        dataByDate[dateStr].maxWeight,
        set.weightKg
      );
      dataByDate[dateStr].totalVolume += set.weightKg * set.reps;
      dataByDate[dateStr].setCount += 1;
    }
  });

  const data = Object.values(dataByDate);

  return NextResponse.json({
    exerciseId,
    range,
    data,
  });
}
