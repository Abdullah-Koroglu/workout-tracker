import { prisma } from "@/lib/prisma";

export const BUILT_IN_ACHIEVEMENTS = [
  // Consistency — workout count
  { code: "FIRST_WORKOUT",  title: "İlk Antrenman",   description: "İlk antrenmanını tamamladın.",   category: "consistency", points: 10 },
  { code: "FIVE_WORKOUTS",  title: "5 Antrenman",     description: "5 antrenmanı tamamladın.",       category: "consistency", points: 25 },
  { code: "TEN_WORKOUTS",   title: "10 Antrenman",    description: "10 antrenmanı tamamladın.",      category: "consistency", points: 50 },
  { code: "FIFTY_WORKOUTS", title: "50 Antrenman",    description: "50 antrenmana ulaştın!",         category: "consistency", points: 200 },
  // Streaks
  { code: "STREAK_3_DAYS",  title: "3 Günlük Seri",   description: "3 gün üst üste antrenman yaptın.",  category: "streak", points: 20 },
  { code: "STREAK_7_DAYS",  title: "7 Günlük Seri",   description: "Tam bir hafta kesintisiz!",         category: "streak", points: 75 },
  { code: "STREAK_30_DAYS", title: "30 Günlük Seri",  description: "30 gün hiç bırakmadın. Efsane!",   category: "streak", points: 300 },
  // Strength / PRs
  { code: "FIRST_PR",       title: "İlk PR",          description: "İlk kişisel rekorunu kırdın.",      category: "strength", points: 30 },
  // Social
  { code: "FIRST_REVIEW",   title: "İlk Yorum",       description: "İlk koç yorumunu bıraktın.",        category: "social",   points: 15 },
  // Tracking
  { code: "PHOTO_LOGGED",   title: "İlk Foto",        description: "İlk vücut fotoğrafını logladın.",   category: "tracking", points: 10 },
];

export async function ensureAchievementsSeeded() {
  const count = await prisma.achievement.count();
  if (count >= BUILT_IN_ACHIEVEMENTS.length) return;
  for (const a of BUILT_IN_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      create: a,
      update: { title: a.title, description: a.description, category: a.category, points: a.points },
    });
  }
}

export async function unlockAchievement(userId: string, code: string) {
  const achievement = await prisma.achievement.findUnique({ where: { code } });
  if (!achievement) return null;
  try {
    return await prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });
  } catch {
    return null;
  }
}

export async function checkWorkoutAchievements(clientId: string) {
  const count = await prisma.workout.count({
    where: { clientId, status: "COMPLETED" },
  });
  if (count >= 1) await unlockAchievement(clientId, "FIRST_WORKOUT");
  if (count >= 5) await unlockAchievement(clientId, "FIVE_WORKOUTS");
  if (count >= 10) await unlockAchievement(clientId, "TEN_WORKOUTS");
  if (count >= 50) await unlockAchievement(clientId, "FIFTY_WORKOUTS");
}
