import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

function daysAgo(days: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysLater(days: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function createHistoricalCompletedWorkout(params: {
  clientId: string;
  templateId: string;
  assignmentId: string;
  startedAt: Date;
  finishedAt: Date;
  notes: string;
  setEntries: Array<{
    exerciseId: string;
    setNumber: number;
    weightKg?: number;
    reps?: number;
    rir?: number;
    durationMinutes?: number;
    durationSeconds?: number;
  }>;
}) {
  const workout = await prisma.workout.create({
    data: {
      clientId: params.clientId,
      templateId: params.templateId,
      assignmentId: params.assignmentId,
      startedAt: params.startedAt,
      finishedAt: params.finishedAt,
      status: "COMPLETED",
      notes: params.notes,
      sets: {
        create: params.setEntries.map((set) => ({
          exerciseId: set.exerciseId,
          setNumber: set.setNumber,
          weightKg: set.weightKg,
          reps: set.reps,
          rir: set.rir,
          durationMinutes: set.durationMinutes,
          durationSeconds: set.durationSeconds,
          completed: true
        }))
      }
    }
  });

  return workout;
}

async function clearDatabase() {
  await prisma.messageReaction.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();

  await prisma.movementVideoComment.deleteMany();
  await prisma.movementVideo.deleteMany();

  await prisma.personalRecord.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.workoutSet.deleteMany();
  await prisma.workout.deleteMany();

  await prisma.checkInResponse.deleteMany();
  await prisma.checkIn.deleteMany();

  await prisma.bodyMetricLog.deleteMany();
  await prisma.bodyTrackingPreference.deleteMany();

  await prisma.clientNotes.deleteMany();
  await prisma.session.deleteMany();
  await prisma.coachAvailability.deleteMany();
  await prisma.availabilityException.deleteMany();

  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.review.deleteMany();

  await prisma.milestone.deleteMany();
  await prisma.goal.deleteMany();

  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();

  await prisma.referral.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.coachBadge.deleteMany();
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.agencySharedClient.deleteMany();
  await prisma.agencyMembership.deleteMany();
  await prisma.agencyWorkspace.deleteMany();

  await prisma.nutritionMealLog.deleteMany();
  await prisma.nutritionPlan.deleteMany();

  await prisma.templateAssignment.deleteMany();
  await prisma.workoutTemplateExercise.deleteMany();
  await prisma.workoutTemplate.deleteMany();
  await prisma.templateCategory.deleteMany();

  await prisma.exercise.deleteMany();

  await prisma.coachPackage.deleteMany();
  await prisma.coachProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.coachClientRelation.deleteMany();

  await prisma.user.deleteMany();
}

async function main() {
  await clearDatabase();

  const passwordHash = await bcrypt.hash("123456", 10);

  const coach = await prisma.user.create({
    data: {
      name: "Serkan Arslan",
      email: "serkan@fitcoach.demo",
      password: passwordHash,
      role: "COACH",
      phone: "+90 532 111 22 33",
      timezone: "Europe/Istanbul",
      locale: "tr-TR",
      lastActiveAt: daysAgo(0, 8, 45)
    }
  });

  const teammateCoach = await prisma.user.create({
    data: {
      name: "Asli Cetin",
      email: "asli@fitcoach.demo",
      password: passwordHash,
      role: "COACH",
      phone: "+90 539 220 11 88",
      timezone: "Europe/Istanbul",
      locale: "tr-TR",
      lastActiveAt: daysAgo(0, 9, 10)
    }
  });

  await prisma.coachProfile.create({
    data: {
      userId: coach.id,
      bio: "10 yıllık online fitness koçu. Yağ kaybı, kas kazanımı ve sürdürülebilir alışkanlık dönüşümü odaklı çalışıyorum.",
      slogan: "Bilimsel yaklaşım, sürdürülebilir sonuç",
      accentColor: "#0EA5E9",
      specialties: ["Yağ Yakımı", "Kas Kazanımı", "Postür", "Ofis Çalışanları"],
      experienceYears: 10,
      socialMediaUrl: "https://instagram.com/coach.serkan",
      city: "İstanbul",
      rating: 4.9,
      reviewCount: 4,
      successRate: 92,
      videoIntroUrl: "https://cdn.fitcoach.demo/videos/serkan-intro.mp4",
      languages: ["Türkçe", "İngilizce"],
      certifications: ["NASM CPT", "Precision Nutrition L1"],
      education: "Marmara Üniversitesi Spor Bilimleri",
      hourlyRate: 1750,
      responseTimeHours: 2,
      totalClientsHelped: 380,
      beforeAfterStories: [
        { title: "12 haftada -9.4 kg", segment: "Masa başı çalışan" },
        { title: "6 ayda yağ oranı %31'den %22'ye", segment: "Yeni başlayan" }
      ],
      faqs: [
        { q: "Program kişiye özel mi?", a: "Evet, haftalık takiplerle sürekli güncellenir." },
        { q: "Supplement zorunlu mu?", a: "Hayır, öncelik beslenme ve düzenli antrenman." }
      ],
      isVerified: true,
      isAcceptingClients: true,
      subscriptionTier: "TIER_2",
      subscriptionStatus: "active",
      inviteCode: "SERKANFIT"
    }
  });

  const coachProfile = await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } });

  await prisma.coachProfile.create({
    data: {
      userId: teammateCoach.id,
      bio: "Strength ve habit coaching tarafinda ekip ici destek veriyorum.",
      slogan: "Ekip ici ikinci koc destegi.",
      accentColor: "#7C3AED",
      specialties: ["Strength", "Habit Coaching"],
      experienceYears: 5,
      city: "Istanbul",
      rating: 4.8,
      successRate: 88,
      reviewCount: 2,
      totalClientsHelped: 116,
      isVerified: true,
      isAcceptingClients: true,
      subscriptionTier: "AGENCY",
      subscriptionStatus: "active",
      inviteCode: "ASLIFIT"
    }
  });

  await prisma.coachPackage.createMany({
    data: [
      {
        profileId: coachProfile.id,
        title: "Başlangıç 8 Hafta",
        description: "Haftalık program güncelleme + mesaj desteği",
        price: 6500,
        isActive: true,
        isPopular: false,
        features: JSON.stringify(["Haftalık check-in", "Program güncelleme", "Sınırsız mesaj"]),
        durationWeeks: 8,
        sessionsIncluded: 2,
        sortOrder: 1
      },
      {
        profileId: coachProfile.id,
        title: "Dönüşüm 16 Hafta",
        description: "Yüksek temaslı premium takip",
        price: 13200,
        originalPrice: 14800,
        discount: 10.8,
        isActive: true,
        isPopular: true,
        features: JSON.stringify(["Haftalık check-in", "Beslenme planı", "Ayda 2 canlı görüşme", "Form analizi"]),
        durationWeeks: 16,
        sessionsIncluded: 8,
        sortOrder: 2
      }
    ]
  });

  const clients = await Promise.all([
    prisma.user.create({
      data: {
        name: "Merve Kaya",
        email: "merve@fitcoach.demo",
        password: passwordHash,
        role: "CLIENT",
        phone: "+90 533 421 19 84",
        locale: "tr-TR",
        timezone: "Europe/Istanbul",
        lastActiveAt: daysAgo(0, 7, 35)
      }
    }),
    prisma.user.create({
      data: {
        name: "Oğuz Demir",
        email: "oguz@fitcoach.demo",
        password: passwordHash,
        role: "CLIENT",
        phone: "+90 536 812 45 01",
        locale: "tr-TR",
        timezone: "Europe/Istanbul",
        lastActiveAt: daysAgo(0, 6, 50)
      }
    }),
    prisma.user.create({
      data: {
        name: "Sena Yıldırım",
        email: "sena@fitcoach.demo",
        password: passwordHash,
        role: "CLIENT",
        phone: "+90 530 922 77 18",
        locale: "tr-TR",
        timezone: "Europe/Istanbul",
        lastActiveAt: daysAgo(1, 21, 5)
      }
    }),
    prisma.user.create({
      data: {
        name: "Batuhan Çelik",
        email: "batuhan@fitcoach.demo",
        password: passwordHash,
        role: "CLIENT",
        phone: "+90 535 717 63 29",
        locale: "tr-TR",
        timezone: "Europe/Istanbul",
        lastActiveAt: daysAgo(0, 8, 10)
      }
    }),
    prisma.user.create({
      data: {
        name: "Derya Aksoy",
        email: "derya@fitcoach.demo",
        password: passwordHash,
        role: "CLIENT",
        phone: "+90 537 420 92 66",
        locale: "tr-TR",
        timezone: "Europe/Istanbul",
        lastActiveAt: daysAgo(12, 10, 25)
      }
    })
  ]);

  const [aktif, riskli, kiloVeren, yeniBaslayan, pasif] = clients;

  await prisma.clientProfile.createMany({
    data: [
      {
        userId: aktif.id,
        age: 31,
        gender: "FEMALE",
        heightCm: 167,
        weightKg: 64.4,
        goal: "Kas tonusu artırmak ve yarı maratona hazırlanmak",
        fitnessLevel: "Orta"
      },
      {
        userId: riskli.id,
        age: 36,
        gender: "MALE",
        heightCm: 178,
        weightKg: 92.1,
        goal: "Bel çevresini azaltmak ve düzenli antrenman alışkanlığı",
        fitnessLevel: "Orta"
      },
      {
        userId: kiloVeren.id,
        age: 29,
        gender: "FEMALE",
        heightCm: 170,
        weightKg: 74.8,
        goal: "Yağ kaybı ve metabolik sağlık",
        fitnessLevel: "Orta"
      },
      {
        userId: yeniBaslayan.id,
        age: 24,
        gender: "MALE",
        heightCm: 181,
        weightKg: 83.5,
        goal: "Temel kuvvet kazanımı",
        fitnessLevel: "Başlangıç"
      },
      {
        userId: pasif.id,
        age: 34,
        gender: "FEMALE",
        heightCm: 164,
        weightKg: 70.2,
        goal: "Rutin oluşturmak",
        fitnessLevel: "Başlangıç"
      }
    ]
  });

  const relations = await Promise.all(
    clients.map((client) =>
      prisma.coachClientRelation.create({
        data: {
          coachId: coach.id,
          clientId: client.id,
          status: "ACCEPTED"
        }
      })
    )
  );

  const workspace = await prisma.agencyWorkspace.create({
    data: {
      name: "Marmara Strength Lab",
      slug: "marmara-strength-lab",
      ownerId: coach.id,
      billingEmail: "ops@marmarastrengthlab.demo",
      city: "Istanbul",
      isGym: true,
      seatsIncluded: 8,
      members: {
        create: [
          {
            userId: coach.id,
            role: "OWNER",
            status: "ACTIVE",
            joinedAt: daysAgo(120, 10, 0),
            permissions: {
              billing: true,
              coachInvites: true,
              reporting: true,
              sharedClients: true
            }
          },
          {
            userId: teammateCoach.id,
            role: "COACH",
            status: "ACTIVE",
            joinedAt: daysAgo(45, 10, 0),
            permissions: {
              ownRoster: true,
              sharedClients: true,
              sessions: true
            }
          }
        ]
      }
    }
  });

  await prisma.agencySharedClient.createMany({
    data: [
      {
        workspaceId: workspace.id,
        clientId: aktif.id,
        primaryCoachId: coach.id,
        visibility: "shared"
      },
      {
        workspaceId: workspace.id,
        clientId: kiloVeren.id,
        primaryCoachId: coach.id,
        visibility: "shared"
      },
      {
        workspaceId: workspace.id,
        clientId: yeniBaslayan.id,
        primaryCoachId: teammateCoach.id,
        visibility: "shared"
      }
    ]
  });

  await prisma.clientNotes.createMany({
    data: [
      {
        relationId: relations[0].id,
        notes: "Son 3 haftadır tüm antrenmanları tamamlıyor. Yük progresyonu stabil.",
        tags: JSON.stringify(["aktif", "yüksek-adherence", "enerjik"])
      },
      {
        relationId: relations[1].id,
        notes: "Son iki check-in'de uyku ve stres skoru düşük. İş yükü arttı.",
        tags: JSON.stringify(["riskli", "yüksek-stres", "uyku-problemi"])
      },
      {
        relationId: relations[2].id,
        notes: "8 haftada 6.2 kg kayıp. Beslenme uyumu çok iyi.",
        tags: JSON.stringify(["kilo-veren", "başarılı", "motivasyonu-yüksek"])
      },
      {
        relationId: relations[3].id,
        notes: "İlk ayı. Hareket kalıbı öğretimi odakta.",
        tags: JSON.stringify(["yeni-başlayan", "öğrenme-aşaması"])
      },
      {
        relationId: relations[4].id,
        notes: "10 gündür uygulamaya giriş yapmadı. Yeniden aktivasyon gerekli.",
        tags: JSON.stringify(["pasif", "takip-gerekli"])
      }
    ]
  });

  await prisma.bodyTrackingPreference.createMany({
    data: clients.map((client) => ({
      clientId: client.id,
      weightFreq: "WEEKLY",
      measurementFreq: "WEEKLY",
      photoFreq: "BIWEEKLY",
      activeMeasurements: JSON.stringify(["waist", "hips", "chest"])
    }))
  });

  const egzersizler = await Promise.all([
    prisma.exercise.create({ data: { name: "Back Squat", type: "WEIGHT", targetMuscle: "Quadriceps" } }),
    prisma.exercise.create({ data: { name: "Romanian Deadlift", type: "WEIGHT", targetMuscle: "Hamstring" } }),
    prisma.exercise.create({ data: { name: "Bench Press", type: "WEIGHT", targetMuscle: "Chest" } }),
    prisma.exercise.create({ data: { name: "Lat Pulldown", type: "WEIGHT", targetMuscle: "Back" } }),
    prisma.exercise.create({ data: { name: "Dumbbell Shoulder Press", type: "WEIGHT", targetMuscle: "Shoulders" } }),
    prisma.exercise.create({ data: { name: "Split Squat", type: "WEIGHT", targetMuscle: "Glute" } }),
    prisma.exercise.create({ data: { name: "Leg Press", type: "WEIGHT", targetMuscle: "Quadriceps" } }),
    prisma.exercise.create({ data: { name: "Koşu Bandı", type: "CARDIO", targetMuscle: "Cardio" } }),
    prisma.exercise.create({ data: { name: "Bisiklet", type: "CARDIO", targetMuscle: "Cardio" } }),
    prisma.exercise.create({ data: { name: "Kürek", type: "CARDIO", targetMuscle: "Cardio" } })
  ]);
  const ex = new Map(egzersizler.map((e) => [e.name, e]));

  const kategoriGuc = await prisma.templateCategory.create({
    data: {
      coachId: coach.id,
      name: "Kuvvet",
      color: "#2563EB"
    }
  });

  const kategoriYagKaybi = await prisma.templateCategory.create({
    data: {
      coachId: coach.id,
      name: "Yağ Kaybı",
      color: "#16A34A"
    }
  });

  const [templateA, templateB, templateYagKaybi, templateBaslangic] = await Promise.all([
    prisma.workoutTemplate.create({
      data: {
        coachId: coach.id,
        categoryId: kategoriGuc.id,
        name: "Üst/Alt Bölmeli Kuvvet A",
        description: "Temel bileşik hareketlerle progresif yüklenme",
        exercises: {
          create: [
            { exerciseId: ex.get("Back Squat")!.id, order: 0, targetSets: 4, targetReps: 6, targetRir: 2 },
            { exerciseId: ex.get("Bench Press")!.id, order: 1, targetSets: 4, targetReps: 6, targetRir: 2 },
            { exerciseId: ex.get("Lat Pulldown")!.id, order: 2, targetSets: 3, targetReps: 10, targetRir: 2 }
          ]
        }
      }
    }),
    prisma.workoutTemplate.create({
      data: {
        coachId: coach.id,
        categoryId: kategoriGuc.id,
        name: "Üst/Alt Bölmeli Kuvvet B",
        description: "Arka zincir ve omuz odaklı ikinci gün",
        exercises: {
          create: [
            { exerciseId: ex.get("Romanian Deadlift")!.id, order: 0, targetSets: 4, targetReps: 8, targetRir: 2 },
            { exerciseId: ex.get("Dumbbell Shoulder Press")!.id, order: 1, targetSets: 4, targetReps: 8, targetRir: 2 },
            { exerciseId: ex.get("Split Squat")!.id, order: 2, targetSets: 3, targetReps: 10, targetRir: 2 }
          ]
        }
      }
    }),
    prisma.workoutTemplate.create({
      data: {
        coachId: coach.id,
        categoryId: kategoriYagKaybi.id,
        name: "Yağ Kaybı - Metabolik Devre",
        description: "Orta yoğunluk interval + direnç kombinasyonu",
        exercises: {
          create: [
            { exerciseId: ex.get("Leg Press")!.id, order: 0, targetSets: 4, targetReps: 12, targetRir: 2 },
            {
              exerciseId: ex.get("Koşu Bandı")!.id,
              order: 1,
              durationMinutes: 18,
              protocol: [
                { minute: 1, speed: 5.8, incline: 1 },
                { minute: 6, speed: 6.4, incline: 2 },
                { minute: 12, speed: 6.9, incline: 2 },
                { minute: 18, speed: 5.9, incline: 1 }
              ]
            },
            { exerciseId: ex.get("Kürek")!.id, order: 2, durationMinutes: 10 }
          ]
        }
      }
    }),
    prisma.workoutTemplate.create({
      data: {
        coachId: coach.id,
        categoryId: kategoriGuc.id,
        name: "Başlangıç Adaptasyon Programı",
        description: "Yeni başlayanlar için teknik odaklı düşük hacim program",
        exercises: {
          create: [
            { exerciseId: ex.get("Leg Press")!.id, order: 0, targetSets: 3, targetReps: 12, targetRir: 3 },
            { exerciseId: ex.get("Lat Pulldown")!.id, order: 1, targetSets: 3, targetReps: 12, targetRir: 3 },
            { exerciseId: ex.get("Bisiklet")!.id, order: 2, durationMinutes: 15 }
          ]
        }
      }
    })
  ]);

  const assignments = await Promise.all([
    prisma.templateAssignment.create({
      data: {
        templateId: templateA.id,
        clientId: aktif.id,
        assignedBy: coach.id,
        scheduledFor: daysAgo(2, 7, 30),
        isOneTime: false
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templateB.id,
        clientId: riskli.id,
        assignedBy: coach.id,
        scheduledFor: daysAgo(3, 7, 0),
        isOneTime: false
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templateYagKaybi.id,
        clientId: kiloVeren.id,
        assignedBy: coach.id,
        scheduledFor: daysAgo(1, 8, 0),
        isOneTime: false
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templateBaslangic.id,
        clientId: yeniBaslayan.id,
        assignedBy: coach.id,
        scheduledFor: daysAgo(1, 18, 30),
        isOneTime: false
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templateYagKaybi.id,
        clientId: pasif.id,
        assignedBy: coach.id,
        scheduledFor: daysAgo(10, 9, 0),
        isOneTime: false
      }
    })
  ]);

  const workoutAktifTamamlandi = await prisma.workout.create({
    data: {
      clientId: aktif.id,
      templateId: templateA.id,
      assignmentId: assignments[0].id,
      startedAt: daysAgo(2, 7, 40),
      finishedAt: daysAgo(2, 8, 42),
      status: "COMPLETED",
      energyLevel: 8,
      moodBefore: 7,
      moodAfter: 9,
      durationSeconds: 3720,
      totalVolumeKg: 8420,
      notes: "Son sette tempo korundu, form çok iyi.",
      sets: {
        create: [
          { exerciseId: ex.get("Back Squat")!.id, setNumber: 1, weightKg: 67.5, reps: 6, rir: 2, completed: true },
          { exerciseId: ex.get("Back Squat")!.id, setNumber: 2, weightKg: 70, reps: 6, rir: 2, completed: true },
          { exerciseId: ex.get("Bench Press")!.id, setNumber: 1, weightKg: 45, reps: 6, rir: 2, completed: true },
          { exerciseId: ex.get("Bench Press")!.id, setNumber: 2, weightKg: 47.5, reps: 6, rir: 2, completed: true },
          { exerciseId: ex.get("Lat Pulldown")!.id, setNumber: 1, weightKg: 45, reps: 10, rir: 2, completed: true }
        ]
      }
    }
  });

  const workoutRiskliYarim = await prisma.workout.create({
    data: {
      clientId: riskli.id,
      templateId: templateB.id,
      assignmentId: assignments[1].id,
      startedAt: daysAgo(3, 22, 10),
      finishedAt: daysAgo(3, 22, 43),
      status: "ABANDONED",
      energyLevel: 3,
      moodBefore: 4,
      moodAfter: 3,
      durationSeconds: 1980,
      notes: "Uykusuzluk nedeniyle antrenman yarım kaldı.",
      sets: {
        create: [
          { exerciseId: ex.get("Romanian Deadlift")!.id, setNumber: 1, weightKg: 70, reps: 8, rir: 4, completed: true },
          { exerciseId: ex.get("Romanian Deadlift")!.id, setNumber: 2, weightKg: 70, reps: 7, rir: 4, completed: true }
        ]
      }
    }
  });

  const workoutKiloVerenTamamlandi = await prisma.workout.create({
    data: {
      clientId: kiloVeren.id,
      templateId: templateYagKaybi.id,
      assignmentId: assignments[2].id,
      startedAt: daysAgo(1, 8, 12),
      finishedAt: daysAgo(1, 9, 5),
      status: "COMPLETED",
      energyLevel: 7,
      moodBefore: 6,
      moodAfter: 8,
      durationSeconds: 3180,
      totalVolumeKg: 6200,
      notes: "Koşu bandı protokolünü tamamen tamamladı.",
      sets: {
        create: [
          { exerciseId: ex.get("Leg Press")!.id, setNumber: 1, weightKg: 105, reps: 12, rir: 2, completed: true },
          { exerciseId: ex.get("Leg Press")!.id, setNumber: 2, weightKg: 110, reps: 12, rir: 2, completed: true },
          { exerciseId: ex.get("Koşu Bandı")!.id, setNumber: 1, durationMinutes: 18, durationSeconds: 1080, completed: true },
          { exerciseId: ex.get("Kürek")!.id, setNumber: 1, durationMinutes: 10, durationSeconds: 600, completed: true }
        ]
      }
    }
  });

  const workoutYeniBaslayanTamamlandi = await prisma.workout.create({
    data: {
      clientId: yeniBaslayan.id,
      templateId: templateBaslangic.id,
      assignmentId: assignments[3].id,
      startedAt: daysAgo(1, 18, 42),
      finishedAt: daysAgo(1, 19, 25),
      status: "COMPLETED",
      energyLevel: 6,
      moodBefore: 6,
      moodAfter: 8,
      durationSeconds: 2580,
      notes: "Teknik odaklı, ağrısız ve düzgün bir seans.",
      sets: {
        create: [
          { exerciseId: ex.get("Leg Press")!.id, setNumber: 1, weightKg: 70, reps: 12, rir: 3, completed: true },
          { exerciseId: ex.get("Leg Press")!.id, setNumber: 2, weightKg: 70, reps: 12, rir: 3, completed: true },
          { exerciseId: ex.get("Lat Pulldown")!.id, setNumber: 1, weightKg: 35, reps: 12, rir: 3, completed: true },
          { exerciseId: ex.get("Bisiklet")!.id, setNumber: 1, durationMinutes: 15, durationSeconds: 900, completed: true }
        ]
      }
    }
  });

  await prisma.workout.create({
    data: {
      clientId: pasif.id,
      templateId: templateYagKaybi.id,
      assignmentId: assignments[4].id,
      startedAt: daysAgo(11, 19, 10),
      status: "IN_PROGRESS",
      energyLevel: 4,
      moodBefore: 5,
      notes: "Uzun süredir devam edilmiyor, takip gerekli.",
      sets: {
        create: [{ exerciseId: ex.get("Leg Press")!.id, setNumber: 1, weightKg: 80, reps: 10, rir: 4, completed: true }]
      }
    }
  });

  const historicalWorkouts = await Promise.all([
    createHistoricalCompletedWorkout({
      clientId: aktif.id,
      templateId: templateB.id,
      assignmentId: assignments[0].id,
      startedAt: daysAgo(9, 7, 50),
      finishedAt: daysAgo(9, 8, 48),
      notes: "Geçen hafta kuvvet B seansı sorunsuz tamamlandı.",
      setEntries: [
        { exerciseId: ex.get("Romanian Deadlift")!.id, setNumber: 1, weightKg: 62.5, reps: 8, rir: 2 },
        { exerciseId: ex.get("Romanian Deadlift")!.id, setNumber: 2, weightKg: 65, reps: 8, rir: 2 },
        { exerciseId: ex.get("Dumbbell Shoulder Press")!.id, setNumber: 1, weightKg: 14, reps: 8, rir: 2 },
        { exerciseId: ex.get("Split Squat")!.id, setNumber: 1, weightKg: 20, reps: 10, rir: 2 }
      ]
    }),
    createHistoricalCompletedWorkout({
      clientId: kiloVeren.id,
      templateId: templateYagKaybi.id,
      assignmentId: assignments[2].id,
      startedAt: daysAgo(8, 8, 15),
      finishedAt: daysAgo(8, 9, 0),
      notes: "Kardiyo temposu korunarak plan bitirildi.",
      setEntries: [
        { exerciseId: ex.get("Leg Press")!.id, setNumber: 1, weightKg: 100, reps: 12, rir: 2 },
        { exerciseId: ex.get("Koşu Bandı")!.id, setNumber: 1, durationMinutes: 18, durationSeconds: 1080 },
        { exerciseId: ex.get("Kürek")!.id, setNumber: 1, durationMinutes: 8, durationSeconds: 480 }
      ]
    }),
    createHistoricalCompletedWorkout({
      clientId: riskli.id,
      templateId: templateB.id,
      assignmentId: assignments[1].id,
      startedAt: daysAgo(13, 21, 40),
      finishedAt: daysAgo(13, 22, 26),
      notes: "Yoğun hafta öncesi son tam seans.",
      setEntries: [
        { exerciseId: ex.get("Romanian Deadlift")!.id, setNumber: 1, weightKg: 67.5, reps: 8, rir: 3 },
        { exerciseId: ex.get("Dumbbell Shoulder Press")!.id, setNumber: 1, weightKg: 12, reps: 8, rir: 3 },
        { exerciseId: ex.get("Split Squat")!.id, setNumber: 1, weightKg: 16, reps: 10, rir: 3 }
      ]
    })
  ]);

  await prisma.personalRecord.createMany({
    data: [
      {
        clientId: aktif.id,
        exerciseId: ex.get("Back Squat")!.id,
        weightKg: 70,
        reps: 6,
        estimatedOneRM: 84,
        workoutId: workoutAktifTamamlandi.id,
        achievedAt: daysAgo(2, 8, 5)
      },
      {
        clientId: kiloVeren.id,
        exerciseId: ex.get("Leg Press")!.id,
        weightKg: 110,
        reps: 12,
        estimatedOneRM: 154,
        workoutId: workoutKiloVerenTamamlandi.id,
        achievedAt: daysAgo(1, 8, 40)
      }
    ]
  });

  await prisma.comment.createMany({
    data: [
      {
        workoutId: workoutAktifTamamlandi.id,
        authorId: coach.id,
        content: "Merve, squat derinliği çok iyi. Önümüzdeki hafta 72.5 kg deneyebiliriz."
      },
      {
        workoutId: workoutRiskliYarim.id,
        authorId: coach.id,
        content: "Oğuz, bu hafta yoğunluk fazla. Yarın düşük yoğunluk mobilite planı gönderiyorum."
      },
      {
        workoutId: workoutKiloVerenTamamlandi.id,
        authorId: coach.id,
        content: "Sena, nabız kontrolün çok iyi. Yağ kaybı sürecin harika gidiyor."
      },
      {
        workoutId: workoutYeniBaslayanTamamlandi.id,
        authorId: coach.id,
        content: "Batuhan, teknik çok hızlı oturuyor. Gelecek hafta hacmi ufak artıracağız."
      }
    ]
  });

  const checkins = await Promise.all([
    prisma.checkIn.create({
      data: {
        coachId: coach.id,
        clientId: aktif.id,
        message: "Haftalık check-in: enerji ve toparlanma durumunu paylaşır mısın?",
        createdAt: daysAgo(1, 10, 0),
        response: {
          create: {
            sleepScore: 8,
            stressScore: 3,
            motivationScore: 9,
            notes: "Uyku iyi, antrenman isteğim yüksek."
          }
        }
      }
    }),
    prisma.checkIn.create({
      data: {
        coachId: coach.id,
        clientId: riskli.id,
        message: "Bu hafta stres seviyen nasıldı? Gerekiyorsa planı hafifletelim.",
        createdAt: daysAgo(1, 11, 0),
        response: {
          create: {
            sleepScore: 4,
            stressScore: 9,
            motivationScore: 4,
            notes: "Toplantılar çok yoğundu, 2 gece 5 saat uyudum."
          }
        }
      }
    }),
    prisma.checkIn.create({
      data: {
        coachId: coach.id,
        clientId: kiloVeren.id,
        message: "Bu hafta kilo, bel çevresi ve genel his nasıl?",
        createdAt: daysAgo(2, 9, 30),
        response: {
          create: {
            sleepScore: 7,
            stressScore: 4,
            motivationScore: 8,
            notes: "Tartıda 0.8 kg düşüş gördüm, planı sürdürebiliyorum."
          }
        }
      }
    }),
    prisma.checkIn.create({
      data: {
        coachId: coach.id,
        clientId: yeniBaslayan.id,
        message: "İlk hafta sonrası kas ağrısı ve hareket güvenin nasıl?",
        createdAt: daysAgo(1, 20, 0),
        response: {
          create: {
            sleepScore: 6,
            stressScore: 5,
            motivationScore: 8,
            notes: "Hareketleri daha iyi anlıyorum, motivasyonum arttı."
          }
        }
      }
    }),
    prisma.checkIn.create({
      data: {
        coachId: coach.id,
        clientId: pasif.id,
        message: "Seni 1 haftadır göremedim, tekrar başlamak için birlikte plan yapalım mı?",
        createdAt: daysAgo(4, 10, 45),
        response: {
          create: {
            sleepScore: 5,
            stressScore: 8,
            motivationScore: 3,
            notes: "İş yoğunluğundan aksattım, yeniden adapte olmam lazım."
          }
        }
      }
    })
  ]);

  await prisma.bodyMetricLog.createMany({
    data: [
      { clientId: aktif.id, date: daysAgo(21, 7, 0), weight: 66.1, waist: 76, hips: 97, sleepHours: 7.2, restingHR: 63 },
      { clientId: aktif.id, date: daysAgo(14, 7, 0), weight: 65.3, waist: 75, hips: 96, sleepHours: 7.3, restingHR: 62 },
      { clientId: aktif.id, date: daysAgo(7, 7, 0), weight: 64.8, waist: 74, hips: 95, sleepHours: 7.4, restingHR: 61 },
      { clientId: aktif.id, date: daysAgo(0, 7, 0), weight: 64.4, waist: 74, hips: 95, sleepHours: 7.5, restingHR: 60 },

      { clientId: riskli.id, date: daysAgo(21, 6, 50), weight: 91.8, waist: 103, sleepHours: 6.6, restingHR: 74 },
      { clientId: riskli.id, date: daysAgo(14, 6, 50), weight: 92.2, waist: 104, sleepHours: 5.8, restingHR: 77 },
      { clientId: riskli.id, date: daysAgo(7, 6, 50), weight: 92.5, waist: 104, sleepHours: 5.4, restingHR: 79 },
      { clientId: riskli.id, date: daysAgo(0, 6, 50), weight: 92.1, waist: 103, sleepHours: 5.6, restingHR: 78 },

      { clientId: kiloVeren.id, date: daysAgo(28, 7, 20), weight: 81.0, waist: 94, hips: 107, sleepHours: 6.9, restingHR: 73 },
      { clientId: kiloVeren.id, date: daysAgo(21, 7, 20), weight: 79.2, waist: 92, hips: 106, sleepHours: 7.0, restingHR: 71 },
      { clientId: kiloVeren.id, date: daysAgo(14, 7, 20), weight: 77.1, waist: 90, hips: 104, sleepHours: 7.1, restingHR: 70 },
      { clientId: kiloVeren.id, date: daysAgo(7, 7, 20), weight: 75.8, waist: 88, hips: 103, sleepHours: 7.3, restingHR: 69 },
      { clientId: kiloVeren.id, date: daysAgo(0, 7, 20), weight: 74.8, waist: 87, hips: 102, sleepHours: 7.4, restingHR: 68 },

      { clientId: yeniBaslayan.id, date: daysAgo(14, 8, 0), weight: 84.2, waist: 91, sleepHours: 6.5, restingHR: 72 },
      { clientId: yeniBaslayan.id, date: daysAgo(7, 8, 0), weight: 83.8, waist: 90, sleepHours: 6.8, restingHR: 71 },
      { clientId: yeniBaslayan.id, date: daysAgo(0, 8, 0), weight: 83.5, waist: 90, sleepHours: 7.0, restingHR: 70 },

      { clientId: pasif.id, date: daysAgo(28, 9, 30), weight: 70.0, waist: 86, sleepHours: 6.6, restingHR: 74 },
      { clientId: pasif.id, date: daysAgo(14, 9, 30), weight: 70.1, waist: 86, sleepHours: 6.1, restingHR: 76 },
      { clientId: pasif.id, date: daysAgo(0, 9, 30), weight: 70.2, waist: 87, sleepHours: 5.9, restingHR: 77 }
    ]
  });

  await prisma.message.createMany({
    data: [
      {
        senderId: coach.id,
        receiverId: aktif.id,
        content: "Günaydın Merve, bugün A antrenmanı için hazır mısın?",
        isRead: true,
        createdAt: daysAgo(0, 7, 10)
      },
      {
        senderId: aktif.id,
        receiverId: coach.id,
        content: "Hazırım hocam, akşam 19:00 gibi tamamlamış olurum.",
        isRead: true,
        createdAt: daysAgo(0, 7, 18)
      },
      {
        senderId: coach.id,
        receiverId: riskli.id,
        content: "Oğuz, bu hafta yükü %20 azaltıyorum. Öncelik uyku ve rutin.",
        isRead: false,
        createdAt: daysAgo(0, 9, 5)
      },
      {
        senderId: kiloVeren.id,
        receiverId: coach.id,
        content: "Hocam tartıda bu hafta da düşüş var, çok motive oldum!",
        isRead: true,
        createdAt: daysAgo(0, 8, 40)
      },
      {
        senderId: coach.id,
        receiverId: yeniBaslayan.id,
        content: "Batuhan, yarınki seans öncesi squat videosunu ısınmadan sonra çekelim.",
        isRead: true,
        createdAt: daysAgo(0, 12, 0)
      },
      {
        senderId: coach.id,
        receiverId: pasif.id,
        content: "Derya merhaba, tekrar başlamak için 20 dakikalık hafif plan hazırladım.",
        isRead: false,
        createdAt: daysAgo(1, 18, 30)
      }
    ]
  });

  await prisma.session.createMany({
    data: [
      {
        coachId: coach.id,
        clientId: aktif.id,
        scheduledFor: daysLater(1, 20, 0),
        duration: 45,
        type: "weekly-review",
        status: "SCHEDULED",
        agenda: "Kuvvet progresyonu ve koşu hacmi güncellemesi",
        meetingUrl: "https://meet.fitcoach.demo/serkan-merve-weekly",
        rtcProvider: "custom_rtc",
        rtcRoomId: "serkan-merve-weekly-review",
        rtcCallStatus: "READY",
        isPaid: true
      },
      {
        coachId: coach.id,
        clientId: riskli.id,
        scheduledFor: daysLater(0, 21, 0),
        duration: 30,
        type: "support-call",
        status: "SCHEDULED",
        agenda: "Stres yönetimi ve uyku planı",
        meetingUrl: "https://meet.fitcoach.demo/serkan-oguz-support",
        rtcProvider: "custom_rtc",
        rtcRoomId: "serkan-oguz-support-call",
        rtcCallStatus: "READY",
        isPaid: true
      },
      {
        coachId: coach.id,
        clientId: kiloVeren.id,
        scheduledFor: daysAgo(5, 19, 0),
        duration: 45,
        type: "progress-review",
        status: "COMPLETED",
        summary: "8 haftalık süreçte yağ kaybı çok iyi, protein hedefi korundu.",
        rtcProvider: "custom_rtc",
        rtcRoomId: "serkan-sena-progress-review",
        rtcCallStatus: "ENDED",
        recordingUrl: "https://cdn.fitcoach.demo/recordings/serkan-sena-progress-review.mp4",
        rating: 5,
        isPaid: true
      }
    ]
  });

  await prisma.review.createMany({
    data: [
      {
        coachId: coach.id,
        clientId: aktif.id,
        rating: 5,
        title: "Disiplinli ve çok ilgili",
        content: "Programlar çok anlaşılır. Her hafta geri bildirim geliyor, motivasyonum hiç düşmüyor.",
        verifiedPurchase: true,
        durationWithCoach: 6,
        helpfulCount: 12,
        coachReply: "Güzel geri bildirimin için teşekkür ederim Merve.",
        coachReplyAt: daysAgo(2, 15, 0),
        createdAt: daysAgo(3, 13, 20)
      },
      {
        coachId: coach.id,
        clientId: kiloVeren.id,
        rating: 5,
        title: "Sürdürülebilir kilo kaybı",
        content: "Aç kalmadan kilo verdim. Sistemli takip sayesinde süreci bırakmadım.",
        verifiedPurchase: true,
        durationWithCoach: 4,
        helpfulCount: 8,
        createdAt: daysAgo(4, 11, 30)
      },
      {
        coachId: coach.id,
        clientId: yeniBaslayan.id,
        rating: 4.5,
        title: "Yeni başlayan için çok iyi",
        content: "Hareketleri adım adım öğretiyor. Kafamda soru kalmıyor.",
        verifiedPurchase: true,
        durationWithCoach: 1,
        helpfulCount: 6,
        createdAt: daysAgo(6, 10, 10)
      },
      {
        coachId: coach.id,
        clientId: riskli.id,
        rating: 4,
        title: "Yoğun dönemde bile esnek plan",
        content: "İş temposuna göre planı revize etmesi çok yardımcı oldu.",
        verifiedPurchase: true,
        durationWithCoach: 3,
        helpfulCount: 4,
        createdAt: daysAgo(8, 20, 45)
      }
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: coach.id,
        title: "Yeni check-in cevabı",
        body: "Oğuz Demir check-in sorularını yanıtladı. Risk seviyesi yüksek görünüyor.",
        type: "checkin",
        isRead: false,
        priority: "high",
        actionUrl: "/coach/checkins",
        metadata: { clientStatus: "riskli", motivationScore: 4 },
        createdAt: daysAgo(0, 9, 12)
      },
      {
        userId: coach.id,
        title: "Yeni mesaj",
        body: "Sena Yıldırım: 'Bu hafta da düşüş var!'",
        type: "message",
        isRead: false,
        actionUrl: "/chat",
        createdAt: daysAgo(0, 8, 41)
      },
      {
        userId: coach.id,
        title: "Tamamlanan antrenman",
        body: "Batuhan Çelik başlangıç programını tamamladı.",
        type: "workout",
        isRead: true,
        actionUrl: "/coach/workouts",
        createdAt: daysAgo(1, 19, 30)
      },
      {
        userId: aktif.id,
        title: "Koç yorum bıraktı",
        body: "Serkan hocan antrenmanına geri bildirim ekledi.",
        type: "comment",
        isRead: false,
        actionUrl: "/client/workouts",
        createdAt: daysAgo(2, 9, 15)
      },
      {
        userId: pasif.id,
        title: "Plan güncellendi",
        body: "Sana uygun kısa bir dönüş programı hazırlandı.",
        type: "plan_update",
        isRead: false,
        actionUrl: "/client/program",
        createdAt: daysAgo(1, 18, 32)
      }
    ]
  });

  await prisma.goal.createMany({
    data: [
      {
        clientId: kiloVeren.id,
        coachId: coach.id,
        title: "12 haftada 8 kg yağ kaybı",
        type: "weight_loss",
        targetValue: 72,
        currentValue: 74.8,
        unit: "kg",
        targetDate: daysLater(30, 9, 0),
        status: "active"
      },
      {
        clientId: aktif.id,
        coachId: coach.id,
        title: "Back Squat 80 kg x 5",
        type: "strength",
        targetValue: 80,
        currentValue: 70,
        unit: "kg",
        targetDate: daysLater(45, 9, 0),
        status: "active"
      }
    ]
  });

  await prisma.analyticsSnapshot.createMany({
    data: [
      {
        scope: "coach_dashboard",
        scopeId: coach.id,
        date: daysAgo(0, 0, 0),
        metrics: {
          activeClients: 5,
          completedWorkoutsLast7Days: 7,
          riskClients: 1,
          unreadMessages: 2,
          pendingCheckIns: 1,
          avgAdherence: 78,
          weeklyWeightLossKg: 1.2,
          generatedAt: new Date().toISOString()
        }
      },
      {
        scope: "coach_digest_weekly",
        scopeId: coach.id,
        date: daysAgo(7, 0, 0),
        metrics: {
          summary: "Son 7 günde 7 antrenman tamamlandı, 1 riskli danışan takipte.",
          topPerformerClientId: kiloVeren.id,
          atRiskClientIds: [riskli.id],
          inactiveClientIds: [pasif.id],
          prCount: 2,
          checkInResponseRate: 0.8,
          coachActionSuggestions: [
            "Oğuz için bu hafta deload planı uygula",
            "Derya için 20 dakikalık yeniden başlama planını kilitle",
            "Sena için kardiyo protokolünü 2 hafta daha koru"
          ]
        }
      }
    ]
  });

  const seededCounts = {
    coach: 1,
    clients: clients.length,
    workouts: 5 + historicalWorkouts.length,
    checkIns: checkins.length,
    templates: 4,
    reviews: 4,
    analyticsSnapshots: 2
  };

  console.log("Staging demo seed tamamlandı.");
  console.log(`Koç: ${seededCounts.coach}`);
  console.log(`Danışan: ${seededCounts.clients}`);
  console.log(`Program şablonu: ${seededCounts.templates}`);
  console.log(`Check-in: ${seededCounts.checkIns}`);
  console.log(`Workout kaydı: ${seededCounts.workouts}`);
  console.log(`Yorum/review: ${seededCounts.reviews}`);
  console.log(`Dashboard snapshot: ${seededCounts.analyticsSnapshots}`);
  console.log("Demo giriş bilgileri:");
  console.log("Koç -> serkan@fitcoach.demo / 123456");
  console.log("Danışanlar -> merve@fitcoach.demo, oguz@fitcoach.demo, sena@fitcoach.demo, batuhan@fitcoach.demo, derya@fitcoach.demo / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
