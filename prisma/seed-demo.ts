import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

const PASSWORD = "123456";

const DEMO_EMAILS = [
  "demo.coach@fitcoach.dev",
  "demo.client.aylin@fitcoach.dev",
  "demo.client.mert@fitcoach.dev",
  "demo.client.deniz@fitcoach.dev",
  "demo.client.elif@fitcoach.dev",
  "demo.market.coach@fitcoach.dev",
];

function dateAt(hour: number, minute = 0, plusDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + plusDays);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dayOfWeekForAvailability(day: number) {
  return day % 7;
}

function mondayAtMidnight(plusDays = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const date = new Date(now);
  date.setDate(now.getDate() - diffToMonday + plusDays);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function clearExistingDemoData() {
  const users = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true },
  });

  const userIds = users.map((user) => user.id);
  if (userIds.length === 0) return;

  const workouts = await prisma.workout.findMany({
    where: { clientId: { in: userIds } },
    select: { id: true },
  });
  const workoutIds = workouts.map((workout) => workout.id);

  const videos = await prisma.movementVideo.findMany({
    where: { OR: [{ clientId: { in: userIds } }, { coachId: { in: userIds } }] },
    select: { id: true },
  });
  const videoIds = videos.map((video) => video.id);

  await prisma.$transaction([
    prisma.movementVideoComment.deleteMany({ where: { OR: [{ coachId: { in: userIds } }, { videoId: { in: videoIds } }] } }),
    prisma.movementVideo.deleteMany({ where: { id: { in: videoIds } } }),
    prisma.comment.deleteMany({ where: { OR: [{ authorId: { in: userIds } }, { workoutId: { in: workoutIds } }] } }),
    prisma.workoutSet.deleteMany({ where: { workoutId: { in: workoutIds } } }),
    prisma.personalRecord.deleteMany({ where: { OR: [{ clientId: { in: userIds } }, { workoutId: { in: workoutIds } }] } }),
    prisma.workout.deleteMany({ where: { id: { in: workoutIds } } }),
    prisma.templateAssignment.deleteMany({ where: { OR: [{ clientId: { in: userIds } }, { assignedBy: { in: userIds } }] } }),
    prisma.workoutTemplateExercise.deleteMany({ where: { template: { coachId: { in: userIds } } } }),
    prisma.workoutTemplate.deleteMany({ where: { coachId: { in: userIds } } }),
    prisma.templateCategory.deleteMany({ where: { coachId: { in: userIds } } }),
    prisma.clientNotes.deleteMany({ where: { relation: { OR: [{ coachId: { in: userIds } }, { clientId: { in: userIds } }] } } }),
    prisma.coachClientRelation.deleteMany({ where: { OR: [{ coachId: { in: userIds } }, { clientId: { in: userIds } }] } }),
    prisma.checkInResponse.deleteMany({ where: { checkIn: { OR: [{ coachId: { in: userIds } }, { clientId: { in: userIds } }] } } }),
    prisma.checkIn.deleteMany({ where: { OR: [{ coachId: { in: userIds } }, { clientId: { in: userIds } }] } }),
    prisma.nutritionMealLog.deleteMany({ where: { clientId: { in: userIds } } }),
    prisma.nutritionPlan.deleteMany({ where: { OR: [{ clientId: { in: userIds } }, { coachId: { in: userIds } }] } }),
    prisma.bodyMetricLog.deleteMany({ where: { clientId: { in: userIds } } }),
    prisma.bodyTrackingPreference.deleteMany({ where: { clientId: { in: userIds } } }),
    prisma.messageReaction.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.messageAttachment.deleteMany({ where: { message: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] } } }),
    prisma.message.deleteMany({ where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] } }),
    prisma.notification.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.review.deleteMany({ where: { OR: [{ coachId: { in: userIds } }, { clientId: { in: userIds } }] } }),
    prisma.callInvite.deleteMany({ where: { OR: [{ callerId: { in: userIds } }, { calleeId: { in: userIds } }] } }),
    prisma.session.deleteMany({ where: { OR: [{ coachId: { in: userIds } }, { clientId: { in: userIds } }] } }),
    prisma.subscription.deleteMany({ where: { OR: [{ coachId: { in: userIds } }, { clientId: { in: userIds } }] } }),
    prisma.payment.deleteMany({ where: { subscription: null } }),
    prisma.coachAvailability.deleteMany({ where: { coachId: { in: userIds } } }),
    prisma.availabilityException.deleteMany({ where: { coachId: { in: userIds } } }),
    prisma.coachBadge.deleteMany({ where: { coachId: { in: userIds } } }),
    prisma.clientProfile.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.coachProfile.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.mediaAsset.deleteMany({ where: { ownerId: { in: userIds } } }),
    prisma.goal.deleteMany({ where: { OR: [{ clientId: { in: userIds } }, { coachId: { in: userIds } }] } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);

}

async function ensureExercise(name: string, type: "WEIGHT" | "CARDIO", targetMuscle?: string) {
  const existing = await prisma.exercise.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.exercise.create({ data: { name, type, targetMuscle } });
}

async function main() {
  await clearExistingDemoData();

  const password = await bcrypt.hash(PASSWORD, 10);
  const [coach, clientAylin, clientMert, clientDeniz, clientElif, marketplaceCoach] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Ece Arslan",
        email: "demo.coach@fitcoach.dev",
        password,
        role: "COACH",
      },
    }),
    prisma.user.create({ data: { name: "Aylin Demir", email: "demo.client.aylin@fitcoach.dev", password, role: "CLIENT" } }),
    prisma.user.create({ data: { name: "Mert Kaya", email: "demo.client.mert@fitcoach.dev", password, role: "CLIENT" } }),
    prisma.user.create({ data: { name: "Deniz Soyer", email: "demo.client.deniz@fitcoach.dev", password, role: "CLIENT" } }),
    prisma.user.create({ data: { name: "Elif Korkmaz", email: "demo.client.elif@fitcoach.dev", password, role: "CLIENT" } }),
    prisma.user.create({ data: { name: "Baran Özkan", email: "demo.market.coach@fitcoach.dev", password, role: "COACH" } }),
  ]);

  const coachProfile = await prisma.coachProfile.create({
    data: {
      userId: coach.id,
      bio: "Online dönüşüm ve performans koçluğu yapıyorum. Haftalık check-in, video form analizi ve sürdürülebilir beslenme takibiyle danışanlarımın sürecini tek panelden yönetiyorum.",
      slogan: "Sürdürülebilir dönüşüm, ölçülebilir performans.",
      accentColor: "#F97316",
      transformationPhotos: [
        {
          id: "demo-transformation-1",
          title: "12 haftalık yağ kaybı",
          beforeUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&auto=format&fit=crop",
          afterUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=900&auto=format&fit=crop",
        },
      ],
      specialties: ["Yağ Kaybı", "Performans", "Kadın Fitness", "Online Koçluk"],
      experienceYears: 6,
      socialMediaUrl: "https://instagram.com/fitcoach-demo",
      city: "İstanbul",
      rating: 4.9,
      successRate: 86,
      reviewCount: 2,
      languages: ["tr"],
      certifications: ["NASM CPT", "Precision Nutrition L1"],
      education: ["Spor Bilimleri Lisans"],
      hourlyRate: 1800,
      responseTimeHours: 4,
      totalClientsHelped: 148,
      isVerified: true,
      isAcceptingClients: true,
      subscriptionTier: "TIER_2",
      subscriptionStatus: "ACTIVE",
      inviteCode: "ECE-DEMO",
      packages: {
        create: [
          {
            title: "Online Dönüşüm Koçluğu",
            description: "Haftalık antrenman planı, check-in, beslenme takibi ve mesaj desteği.",
            price: 4500,
            isPopular: true,
            features: JSON.stringify(["Haftalık plan güncelleme", "Beslenme log analizi", "Form videosu değerlendirme", "Haftalık koç raporu"]),
            durationWeeks: 4,
            sessionsIncluded: 1,
            recurringInterval: "monthly",
            sortOrder: 1,
          },
          {
            title: "Premium Performans Paketi",
            description: "Performans hedefi olan danışanlar için hacim, PR ve toparlanma analizi.",
            price: 7900,
            isPopular: false,
            features: JSON.stringify(["2 haftalık periodizasyon", "PR takibi", "Video form analizi", "Öncelikli mesaj desteği"]),
            durationWeeks: 8,
            sessionsIncluded: 2,
            recurringInterval: "monthly",
            sortOrder: 2,
          },
        ],
      },
    },
    include: { packages: true },
  });

  await prisma.coachProfile.create({
    data: {
      userId: marketplaceCoach.id,
      bio: "Yeni başlayanlara uygun fiyatlı online koçluk ve alışkanlık temelli takip sunuyorum.",
      slogan: "İlk adımı kolaylaştıran koçluk.",
      accentColor: "#2563EB",
      specialties: ["Yeni Başlayan", "Kilo Verme", "Ev Antrenmanı"],
      experienceYears: 3,
      city: "Ankara",
      rating: 4.7,
      successRate: 78,
      reviewCount: 1,
      totalClientsHelped: 42,
      isVerified: false,
      isAcceptingClients: true,
      subscriptionTier: "TIER_1",
      subscriptionStatus: "ACTIVE",
      inviteCode: "BARAN-DEMO",
      packages: {
        create: [
          {
            title: "Uygun Başlangıç Paketi",
            description: "Yeni başlayanlar için haftalık program ve mesaj desteği.",
            price: 1900,
            features: JSON.stringify(["Haftalık program", "Mesaj desteği", "Basit beslenme hedefleri"]),
            durationWeeks: 4,
            recurringInterval: "monthly",
          },
        ],
      },
    },
  });

  await Promise.all([
    prisma.clientProfile.create({ data: { userId: clientAylin.id, age: 31, gender: "FEMALE", heightCm: 166, weightKg: 72, goal: "12 haftada yağ kaybı", fitnessLevel: "Orta" } }),
    prisma.clientProfile.create({ data: { userId: clientMert.id, age: 28, gender: "MALE", heightCm: 181, weightKg: 84, goal: "Bench press PR ve kas kazanımı", fitnessLevel: "İleri" } }),
    prisma.clientProfile.create({ data: { userId: clientDeniz.id, age: 36, gender: "MALE", heightCm: 176, weightKg: 92, goal: "Bel çevresi düşürme", fitnessLevel: "Başlangıç" } }),
    prisma.clientProfile.create({ data: { userId: clientElif.id, age: 24, gender: "FEMALE", heightCm: 169, weightKg: 63, goal: "Duruş ve mobilite", fitnessLevel: "Başlangıç" } }),
  ]);

  const [relationAylin, relationMert, relationDeniz] = await Promise.all([
    prisma.coachClientRelation.create({ data: { coachId: coach.id, clientId: clientAylin.id, status: "ACCEPTED" } }),
    prisma.coachClientRelation.create({ data: { coachId: coach.id, clientId: clientMert.id, status: "ACCEPTED" } }),
    prisma.coachClientRelation.create({ data: { coachId: coach.id, clientId: clientDeniz.id, status: "ACCEPTED" } }),
    prisma.coachClientRelation.create({ data: { coachId: coach.id, clientId: clientElif.id, status: "PENDING" } }),
  ]);

  await Promise.all([
    prisma.clientNotes.create({ data: { relationId: relationAylin.id, notes: "Yağ kaybı hedefi güçlü. Pazartesi tartı, cuma check-in.", tags: JSON.stringify(["dönüşüm", "yüksek motivasyon"]) } }),
    prisma.clientNotes.create({ data: { relationId: relationMert.id, notes: "Bench PR hedefi var. Omuz yorgunluğu takip edilmeli.", tags: JSON.stringify(["performans", "risk:omuz"]) } }),
    prisma.clientNotes.create({ data: { relationId: relationDeniz.id, notes: "İlk 2 hafta alışkanlık ve yürüyüş hedefi öncelik.", tags: JSON.stringify(["başlangıç", "uyum"]) } }),
  ]);

  await Promise.all([0, 1, 2, 3, 4].map((day) =>
    prisma.coachAvailability.create({
      data: {
        coachId: coach.id,
        dayOfWeek: dayOfWeekForAvailability(day),
        startTime: day < 3 ? "09:00" : "13:00",
        endTime: day < 3 ? "17:00" : "19:00",
      },
    }),
  ));

  const exercises = await Promise.all([
    ensureExercise("Goblet Squat", "WEIGHT", "Legs"),
    ensureExercise("Bench Press", "WEIGHT", "Chest"),
    ensureExercise("Romanian Deadlift", "WEIGHT", "Hamstrings"),
    ensureExercise("Lat Pulldown", "WEIGHT", "Back"),
    ensureExercise("Dumbbell Shoulder Press", "WEIGHT", "Shoulders"),
    ensureExercise("Incline Walk", "CARDIO", "Cardio"),
    ensureExercise("Bike Intervals", "CARDIO", "Cardio"),
  ]);
  const byName = new Map(exercises.map((exercise) => [exercise.name, exercise]));

  const [strengthCategory, transformationCategory] = await Promise.all([
    prisma.templateCategory.create({ data: { coachId: coach.id, name: "Performans", color: "#2563EB" } }),
    prisma.templateCategory.create({ data: { coachId: coach.id, name: "Dönüşüm", color: "#F97316" } }),
  ]);

  const [templateA, templateB] = await Promise.all([
    prisma.workoutTemplate.create({
      data: {
        coachId: coach.id,
        categoryId: transformationCategory.id,
        name: "12 Hafta Dönüşüm - Full Body A",
        description: "Yağ kaybı ve temel kuvvet için uygulanabilir full body antrenman.",
        exercises: {
          create: [
            { exerciseId: byName.get("Goblet Squat")!.id, order: 0, targetSets: 3, targetReps: 10, targetRir: 2, prescribedRestSeconds: 90 },
            { exerciseId: byName.get("Bench Press")!.id, order: 1, targetSets: 4, targetReps: 8, targetRir: 2, prescribedRestSeconds: 120 },
            { exerciseId: byName.get("Lat Pulldown")!.id, order: 2, targetSets: 3, targetReps: 12, targetRir: 2, prescribedRestSeconds: 90 },
            { exerciseId: byName.get("Incline Walk")!.id, order: 3, durationMinutes: 18, prescribedRestSeconds: 60 },
          ],
        },
      },
    }),
    prisma.workoutTemplate.create({
      data: {
        coachId: coach.id,
        categoryId: strengthCategory.id,
        name: "Premium Performans - Üst Vücut Güç",
        description: "Bench PR hedefi olan danışan için hacim ve teknik odaklı gün.",
        exercises: {
          create: [
            { exerciseId: byName.get("Bench Press")!.id, order: 0, targetSets: 5, targetReps: 5, targetRir: 2, prescribedRestSeconds: 150 },
            { exerciseId: byName.get("Dumbbell Shoulder Press")!.id, order: 1, targetSets: 3, targetReps: 8, targetRir: 2, prescribedRestSeconds: 120 },
            { exerciseId: byName.get("Romanian Deadlift")!.id, order: 2, targetSets: 3, targetReps: 8, targetRir: 2, prescribedRestSeconds: 120 },
            { exerciseId: byName.get("Bike Intervals")!.id, order: 3, durationMinutes: 12, prescribedRestSeconds: 60 },
          ],
        },
      },
    }),
  ]);

  const [assignmentAylin, assignmentMert, assignmentDeniz] = await Promise.all([
    prisma.templateAssignment.create({ data: { templateId: templateA.id, clientId: clientAylin.id, assignedBy: coach.id, scheduledFor: dateAt(8, 30, 0) } }),
    prisma.templateAssignment.create({ data: { templateId: templateB.id, clientId: clientMert.id, assignedBy: coach.id, scheduledFor: dateAt(18, 0, 0) } }),
    prisma.templateAssignment.create({ data: { templateId: templateA.id, clientId: clientDeniz.id, assignedBy: coach.id, scheduledFor: dateAt(9, 30, 1) } }),
  ]);

  const completedWorkout = await prisma.workout.create({
    data: {
      clientId: clientAylin.id,
      templateId: templateA.id,
      assignmentId: assignmentAylin.id,
      status: "COMPLETED",
      startedAt: dateAt(8, 35, -2),
      finishedAt: dateAt(9, 25, -2),
      energyLevel: 8,
      moodBefore: 6,
      moodAfter: 8,
      intensityScore: 7,
      durationSeconds: 3000,
      totalVolumeKg: 3250,
      notes: "Son sette tempo korundu. Bir sonraki hafta squat yükü artabilir.",
      sets: {
        create: [
          { exerciseId: byName.get("Goblet Squat")!.id, setNumber: 1, weightKg: 24, reps: 10, rir: 2, completed: true },
          { exerciseId: byName.get("Goblet Squat")!.id, setNumber: 2, weightKg: 26, reps: 10, rir: 2, completed: true },
          { exerciseId: byName.get("Goblet Squat")!.id, setNumber: 3, weightKg: 28, reps: 9, rir: 1, completed: true },
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 1, weightKg: 45, reps: 8, rir: 2, completed: true },
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 2, weightKg: 47.5, reps: 8, rir: 2, completed: true },
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 3, weightKg: 50, reps: 7, rir: 1, completed: true },
        ],
      },
    },
  });

  const inProgressWorkout = await prisma.workout.create({
    data: {
      clientId: clientMert.id,
      templateId: templateB.id,
      assignmentId: assignmentMert.id,
      status: "IN_PROGRESS",
      startedAt: dateAt(18, 5, 0),
      energyLevel: 7,
      moodBefore: 7,
      sets: {
        create: [
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 1, weightKg: 90, reps: 5, rir: 2, completed: true },
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 2, weightKg: 92.5, reps: 4, rir: 1, completed: true },
        ],
      },
    },
  });

  await Promise.all([
    prisma.workout.create({
      data: {
        clientId: clientDeniz.id,
        templateId: templateA.id,
        assignmentId: assignmentDeniz.id,
        status: "ABANDONED",
        startedAt: dateAt(9, 35, -1),
        finishedAt: dateAt(9, 55, -1),
        intensityScore: 4,
        sets: {
          create: [
            { exerciseId: byName.get("Goblet Squat")!.id, setNumber: 1, weightKg: 16, reps: 8, rir: 4, completed: true },
          ],
        },
      },
    }),
    prisma.comment.createMany({
      data: [
        { workoutId: completedWorkout.id, authorId: coach.id, content: "Squat temposu çok iyi. Haftaya ilk seti 26 kg ile açalım." },
        { workoutId: completedWorkout.id, authorId: clientAylin.id, content: "Yürüyüş bölümünde zorlandım ama genel olarak çok iyi hissettim." },
        { workoutId: inProgressWorkout.id, authorId: coach.id, content: "Bench ikinci sette omuz hissi artarsa video gönder, yükü sabitleyelim." },
      ],
    }),
  ]);

  await Promise.all([
    prisma.personalRecord.create({ data: { clientId: clientMert.id, exerciseId: byName.get("Bench Press")!.id, weightKg: 92.5, reps: 4, estimatedOneRM: 104.8, workoutId: inProgressWorkout.id, achievedAt: dateAt(18, 20, 0) } }),
    prisma.bodyTrackingPreference.create({ data: { clientId: clientAylin.id, weightFreq: "WEEKLY", measurementFreq: "WEEKLY", photoFreq: "BIWEEKLY", activeMeasurements: JSON.stringify(["waist", "hips", "chest"]) } }),
    prisma.bodyMetricLog.create({ data: { clientId: clientAylin.id, date: mondayAtMidnight(-14), weight: 74.2, waist: 86, hips: 104, sleepHours: 6.5, restingHR: 68, hrv: 52 } }),
    prisma.bodyMetricLog.create({ data: { clientId: clientAylin.id, date: mondayAtMidnight(-7), weight: 72.9, waist: 84.5, hips: 103, sleepHours: 7, restingHR: 65, hrv: 57 } }),
    prisma.bodyMetricLog.create({ data: { clientId: clientAylin.id, date: mondayAtMidnight(0), weight: 72, waist: 83.8, hips: 102.4, sleepHours: 7.2, restingHR: 64, hrv: 59 } }),
    prisma.nutritionPlan.create({ data: { clientId: clientAylin.id, coachId: coach.id, targetCalories: 1900, targetProtein: 135, targetCarbs: 180, targetFats: 60, instructions: "Haftalık ortalamaya odaklan. Antrenman günlerinde karbonhidratı antrenman öncesine taşı." } }),
    prisma.nutritionMealLog.create({ data: { clientId: clientAylin.id, adherenceTag: "GREEN", clientNote: "Öğlen tavuk, pilav ve salata. Akşam yoğurt ekledim.", aiSummary: "Plan uyumu iyi. Protein hedefi korunuyor, akşam öğünü dengeli." } }),
    prisma.nutritionMealLog.create({ data: { clientId: clientDeniz.id, adherenceTag: "RED", clientNote: "Dün gece atıştırma oldu, bugün motivasyon düşük.", aiSummary: "Motivasyon ve uyum riski var. Bugün küçük bir yürüyüş hedefi ve basit öğün planı öner." } }),
  ]);

  const checkInForDeniz = await prisma.checkIn.create({
    data: { coachId: coach.id, clientId: clientDeniz.id, message: "Bu hafta enerji, uyku ve motivasyon durumunu 1 dakikada paylaşır mısın?" },
  });

  await Promise.all([
    prisma.checkIn.create({
      data: {
        coachId: coach.id,
        clientId: clientAylin.id,
        message: "Haftalık check-in: uyku, stres ve motivasyon nasıl?",
        response: { create: { sleepScore: 8, stressScore: 4, motivationScore: 9, notes: "Bu hafta daha düzenliyim, bel ölçüsü düşüyor." } },
      },
    }),
    prisma.checkInResponse.create({ data: { checkInId: checkInForDeniz.id, sleepScore: 5, stressScore: 8, motivationScore: 4, notes: "İş yoğun, iki antrenmanı kaçırdım." } }),
    prisma.message.create({ data: { senderId: clientDeniz.id, receiverId: coach.id, content: "Koç bugün planı biraz kısaltabilir miyiz?", isRead: false, createdAt: dateAt(10, 15, 0) } }),
    prisma.message.create({ data: { senderId: coach.id, receiverId: clientAylin.id, content: "Harika ilerliyorsun. Bugünkü yürüyüş temposunu aynı tutalım.", isRead: true, createdAt: dateAt(11, 0, -1) } }),
    prisma.notification.create({ data: { userId: coach.id, title: "Risk sinyali", body: "Deniz son check-in'de yüksek stres ve düşük motivasyon bildirdi.", type: "CLIENT_RISK", priority: "high", actionUrl: `/coach/clients/${clientDeniz.id}` } }),
    prisma.notification.create({ data: { userId: coach.id, title: "Yeni danışan isteği", body: "Elif Korkmaz marketplace üzerinden koçluk isteği gönderdi.", type: "CLIENT_REQUEST", actionUrl: "/coach/clients" } }),
  ]);

  await Promise.all([
    prisma.session.create({
      data: {
        coachId: coach.id,
        clientId: clientAylin.id,
        scheduledFor: dateAt(14, 0, 1),
        duration: 45,
        type: "weekly_checkin",
        status: "SCHEDULED",
        agenda: "Bel ölçüsü, yürüyüş temposu, haftalık plan güncellemesi",
        rtcProvider: "link",
        providerRoomCode: "demo-aylin-weekly-checkin",
        providerHostUserId: `coach:${coach.id}`,
        callMode: "VIDEO",
        callStatus: "READY",
        syncState: "SYNCED",
        recordingStatus: "NOT_REQUESTED",
        participants: {
          create: [
            { userId: coach.id, role: "COACH" },
            { userId: clientAylin.id, role: "CLIENT" },
          ],
        },
      },
    }),
    prisma.session.create({
      data: {
        coachId: coach.id,
        clientId: clientMert.id,
        scheduledFor: dateAt(20, 0, 0),
        duration: 30,
        type: "form_review",
        status: "SCHEDULED",
        agenda: "Bench press video analizi",
        rtcProvider: "link",
        providerRoomCode: "demo-mert-form-review",
        providerHostUserId: `coach:${coach.id}`,
        callMode: "AUDIO",
        callStatus: "READY",
        syncState: "SYNCED",
        recordingStatus: "NOT_REQUESTED",
        participants: {
          create: [
            { userId: coach.id, role: "COACH" },
            { userId: clientMert.id, role: "CLIENT" },
          ],
        },
      },
    }),
    prisma.review.create({ data: { coachId: coach.id, clientId: clientAylin.id, rating: 5, title: "İlk kez bu kadar takipli hissettim", content: "Ece hem antrenmanı hem beslenmeyi tek yerden takip ediyor. Haftalık raporlar motivasyonumu çok artırdı.", verifiedPurchase: true, durationWithCoach: 12 } }),
    prisma.review.create({ data: { coachId: coach.id, clientId: clientMert.id, rating: 4.8, title: "Performans odaklı ve net", content: "Bench hedefimde her hafta ne yapacağımı biliyorum. Video yorumları özellikle çok değerli.", verifiedPurchase: true, durationWithCoach: 8 } }),
    prisma.subscription.create({ data: { clientId: clientAylin.id, coachId: coach.id, packageId: coachProfile.packages[0]?.id, status: "active", startedAt: dateAt(9, 0, -20), expiresAt: dateAt(9, 0, 10), payments: { create: { amount: 4500, currency: "TRY", status: "paid", provider: "demo", providerRef: "demo-paid-aylin" } } } }),
    prisma.coachBadge.create({ data: { coachId: coach.id, code: "verified_coach" } }),
    prisma.coachBadge.create({ data: { coachId: coach.id, code: "fast_response" } }),
  ]);

  console.log("FitCoach demo seed tamamlandı.");
  console.log(`Koç: ${coach.email} / ${PASSWORD}`);
  console.log(`Danışan: ${clientAylin.email} / ${PASSWORD}`);
  console.log("Demo akışı: dashboard -> profile -> templates -> clients -> marketplace.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
