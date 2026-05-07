import { promises as fs } from "fs";
import path from "path";

type CoachWithId = { id: string };

export async function getCoachAvatarUrl(userId: string): Promise<string | null> {
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");

  try {
    const entries = await fs.readdir(dir);
    const fileName = entries.find((name) => name.startsWith(`${userId}.`));
    if (!fileName) return null;
    return `/uploads/avatars/${fileName}`;
  } catch {
    return null;
  }
}

export async function attachCoachAvatars<T extends CoachWithId>(
  coaches: T[]
): Promise<Array<T & { avatarUrl: string | null }>> {
  const avatarPairs = await Promise.all(
    coaches.map(async (coach) => ({
      id: coach.id,
      avatarUrl: await getCoachAvatarUrl(coach.id),
    }))
  );

  const avatarById = new Map(avatarPairs.map((pair) => [pair.id, pair.avatarUrl]));

  return coaches.map((coach) => ({
    ...coach,
    avatarUrl: avatarById.get(coach.id) ?? null,
  }));
}
