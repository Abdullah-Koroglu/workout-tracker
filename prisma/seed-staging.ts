import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

function dateAt(hour: number, minute = 0, plusDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + plusDays);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  // Clear all data
  await prisma.comment.deleteMany();
  await prisma.workoutSet.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.templateAssignment.deleteMany();
  await prisma.workoutTemplateExercise.deleteMany();
  await prisma.workoutTemplate.deleteMany();
  await prisma.coachClientRelation.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  // Create Demo Coaches - Turkish Names
  const coaches = await Promise.all([
    prisma.user.create({
      data: {
        name: "Mehmet Yılmaz",
        email: "mehmet@fitcoach.dev",
        password: passwordHash,
        role: "COACH"
      }
    }),
    prisma.user.create({
      data: {
        name: "Ayşe Kaya",
        email: "ayse@fitcoach.dev",
        password: passwordHash,
        role: "COACH"
      }
    }),
    prisma.user.create({
      data: {
        name: "Emre Demir",
        email: "emre@fitcoach.dev",
        password: passwordHash,
        role: "COACH"
      }
    }),
    prisma.user.create({
      data: {
        name: "Zeynep Şimşek",
        email: "zeynep@fitcoach.dev",
        password: passwordHash,
        role: "COACH"
      }
    })
  ]);

  // Create Demo Clients - Turkish Names  
  const clients = await Promise.all([
    prisma.user.create({
      data: {
        name: "Can Öz",
        email: "can@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Selin Aydın",
        email: "selin@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Burak Arslan",
        email: "burak@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Didem Yıldız",
        email: "didem@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Kerem Çelik",
        email: "kerem@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Hülya Kara",
        email: "hulya@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Deniz Şahin",
        email: "deniz@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Fatih Esen",
        email: "fatih@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    })
  ]);

  // Create Coach-Client Relationships
  await prisma.coachClientRelation.createMany({
    data: [
      // Mehmet's clients
      { coachId: coaches[0].id, clientId: clients[0].id, status: "ACCEPTED" },
      { coachId: coaches[0].id, clientId: clients[1].id, status: "ACCEPTED" },
      { coachId: coaches[0].id, clientId: clients[2].id, status: "PENDING" },
      // Ayşe's clients
      { coachId: coaches[1].id, clientId: clients[1].id, status: "ACCEPTED" },
      { coachId: coaches[1].id, clientId: clients[3].id, status: "ACCEPTED" },
      { coachId: coaches[1].id, clientId: clients[4].id, status: "ACCEPTED" },
      // Emre's clients
      { coachId: coaches[2].id, clientId: clients[2].id, status: "ACCEPTED" },
      { coachId: coaches[2].id, clientId: clients[5].id, status: "ACCEPTED" },
      // Zeynep's clients
      { coachId: coaches[3].id, clientId: clients[6].id, status: "ACCEPTED" },
      { coachId: coaches[3].id, clientId: clients[7].id, status: "ACCEPTED" },
      { coachId: coaches[3].id, clientId: clients[0].id, status: "PENDING" }
    ]
  });

  // Create Exercises
  const exercises = await Promise.all([
    // Ağırlık Antrenmanları
    prisma.exercise.create({ data: { name: "Kütlübaşı Kaldırması", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Ön Kütlübaşı", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Bench Press", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Eğimli DB Press", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Ölü Kaldırış", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Rumen Ölü Kaldırış", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Çekme Barı", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Barbell Sıra", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Omuz Presi", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Leg Press", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Incline Barbell Press", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Dumbbell Flyes", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Barbell Curl", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Tricep Dips", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Lat Pulldown", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Pendulum Squat", type: "WEIGHT" } }),
    // Kardiyö
    prisma.exercise.create({ data: { name: "Koşu Bandı", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "Bisiklet", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "Kürek Makinesi", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "Merdiven Makinesi", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "Eliptik", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "Halat Atlama", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "Yürüyüş Bandı", type: "CARDIO" } })
  ]);

  const byName = new Map(exercises.map((exercise) => [exercise.name, exercise]));

  // Create Workout Templates
  const templates = await Promise.all([
    // Mehmet's templates
    prisma.workoutTemplate.create({
      data: {
        coachId: coaches[0].id,
        name: "Güç A - Üst Vücut Bas + Kardiyö",
        description: "Güç odaklı üst vücut + kontrollü kardiyövasküler antrenman. Bench press ve omuz presi ile başlayıp kardiyö ile bitiriyoruz.",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Bench Press")!.id,
              order: 0,
              targetSets: 4,
              targetReps: 6,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Omuz Presi")!.id,
              order: 1,
              targetSets: 3,
              targetReps: 8,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Koşu Bandı")!.id,
              order: 2,
              durationMinutes: 16,
              protocol: [
                { minute: 1, speed: 5.4, incline: 1 },
                { minute: 4, speed: 6.2, incline: 2 },
                { minute: 8, speed: 6.8, incline: 3 },
                { minute: 12, speed: 6.4, incline: 2 },
                { minute: 16, speed: 5.5, incline: 1 }
              ]
            }
          ]
        }
      }
    }),
    prisma.workoutTemplate.create({
      data: {
        coachId: coaches[0].id,
        name: "Güç B - Alt Vücut + Sıra",
        description: "Çekme odaklı güç ve alt vücut gelişimi. Ölü kaldırış, barbell sıra ve leg press kombinasyonu.",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Ölü Kaldırış")!.id,
              order: 0,
              targetSets: 3,
              targetReps: 5,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Barbell Sıra")!.id,
              order: 1,
              targetSets: 4,
              targetReps: 8,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Leg Press")!.id,
              order: 2,
              targetSets: 4,
              targetReps: 10,
              targetRir: 1
            }
          ]
        }
      }
    }),
    prisma.workoutTemplate.create({
      data: {
        coachId: coaches[0].id,
        name: "Kondisyon Günü",
        description: "Kardiyö ve genel kondisyon odaklı gün. Yüksek intensiteli interval antrenman.",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Bisiklet")!.id,
              order: 0,
              durationMinutes: 20,
              protocol: [
                { minute: 1, speed: 60, incline: 0 },
                { minute: 6, speed: 75, incline: 0 },
                { minute: 12, speed: 85, incline: 0 },
                { minute: 20, speed: 65, incline: 0 }
              ]
            },
            {
              exerciseId: byName.get("Kürek Makinesi")!.id,
              order: 1,
              durationMinutes: 12,
              protocol: [
                { minute: 1, speed: 20, incline: 0 },
                { minute: 6, speed: 26, incline: 0 },
                { minute: 12, speed: 22, incline: 0 }
              ]
            }
          ]
        }
      }
    }),
    // Ayşe's templates
    prisma.workoutTemplate.create({
      data: {
        coachId: coaches[1].id,
        name: "Hipertrofi Tam Vücut",
        description: "Kas gelişimi odaklı tam vücut antrenmanı. Yüksek set hacmi ve orta reps ile kas pompası oluşturma.",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Kütlübaşı Kaldırması")!.id,
              order: 0,
              targetSets: 4,
              targetReps: 8,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Eğimli DB Press")!.id,
              order: 1,
              targetSets: 4,
              targetReps: 10,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Çekme Barı")!.id,
              order: 2,
              targetSets: 3,
              targetReps: 8,
              targetRir: 1
            }
          ]
        }
      }
    }),
    prisma.workoutTemplate.create({
      data: {
        coachId: coaches[1].id,
        name: "Dayanıklılık Mix",
        description: "Uzun süreli dayanıklılık antrenmanı. Düşük intensite, yüksek hacim kardiyö.",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Eliptik")!.id,
              order: 0,
              durationMinutes: 25,
              protocol: [
                { minute: 1, speed: 4.5, incline: 1 },
                { minute: 10, speed: 5.2, incline: 2 },
                { minute: 18, speed: 5.8, incline: 2 },
                { minute: 25, speed: 4.8, incline: 1 }
              ]
            },
            {
              exerciseId: byName.get("Halat Atlama")!.id,
              order: 1,
              durationMinutes: 8,
              protocol: [
                { minute: 1, speed: 80, incline: 0 },
                { minute: 4, speed: 95, incline: 0 },
                { minute: 8, speed: 85, incline: 0 }
              ]
            }
          ]
        }
      }
    }),
    // Emre's templates
    prisma.workoutTemplate.create({
      data: {
        coachId: coaches[2].id,
        name: "Push Day - Bas Odaklı",
        description: "Tüm bas kasları hedef alan antrenman. Bench, omuz ve üst bacak.",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Incline Barbell Press")!.id,
              order: 0,
              targetSets: 3,
              targetReps: 6,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Dumbbell Flyes")!.id,
              order: 1,
              targetSets: 3,
              targetReps: 12,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Kütlübaşı Kaldırması")!.id,
              order: 2,
              targetSets: 3,
              targetReps: 8,
              targetRir: 1
            }
          ]
        }
      }
    }),
    // Zeynep's templates
    prisma.workoutTemplate.create({
      data: {
        coachId: coaches[3].id,
        name: "Pull & Legs - Çekme Günü",
        description: "Sırt, biseps ve bacak odaklı antrenman. Gücü ve hacmi birleştiren antrenman.",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Barbell Sıra")!.id,
              order: 0,
              targetSets: 4,
              targetReps: 6,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Lat Pulldown")!.id,
              order: 1,
              targetSets: 3,
              targetReps: 10,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Leg Press")!.id,
              order: 2,
              targetSets: 3,
              targetReps: 12,
              targetRir: 1
            }
          ]
        }
      }
    })
  ]);

  // Create Template Assignments
  const assignments = await Promise.all([
    // Mehmet's assignments
    prisma.templateAssignment.create({
      data: {
        templateId: templates[0].id,
        clientId: clients[0].id,
        assignedBy: coaches[0].id,
        scheduledFor: dateAt(8, 30, 0),
        isOneTime: true
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templates[1].id,
        clientId: clients[0].id,
        assignedBy: coaches[0].id,
        scheduledFor: dateAt(18, 0, 1),
        isOneTime: true
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templates[2].id,
        clientId: clients[1].id,
        assignedBy: coaches[0].id,
        scheduledFor: dateAt(7, 45, 0),
        isOneTime: true
      }
    }),
    // Ayşe's assignments
    prisma.templateAssignment.create({
      data: {
        templateId: templates[3].id,
        clientId: clients[1].id,
        assignedBy: coaches[1].id,
        scheduledFor: dateAt(19, 0, 0),
        isOneTime: true
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templates[4].id,
        clientId: clients[3].id,
        assignedBy: coaches[1].id,
        scheduledFor: dateAt(9, 15, -1),
        isOneTime: true
      }
    }),
    // Emre's assignments
    prisma.templateAssignment.create({
      data: {
        templateId: templates[5].id,
        clientId: clients[2].id,
        assignedBy: coaches[2].id,
        scheduledFor: dateAt(8, 0, 0),
        isOneTime: true
      }
    }),
    // Zeynep's assignments
    prisma.templateAssignment.create({
      data: {
        templateId: templates[6].id,
        clientId: clients[6].id,
        assignedBy: coaches[3].id,
        scheduledFor: dateAt(18, 30, 0),
        isOneTime: true
      }
    })
  ]);

  // Create completed workouts with detailed sets
  const completedWorkout1 = await prisma.workout.create({
    data: {
      clientId: clients[0].id,
      templateId: templates[0].id,
      assignmentId: assignments[0].id,
      status: "COMPLETED",
      startedAt: dateAt(8, 35, -7),
      finishedAt: dateAt(9, 20, -7),
      sets: {
        create: [
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 1, weightKg: 70, reps: 6, rir: 2, completed: true },
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 2, weightKg: 72.5, reps: 6, rir: 2, completed: true },
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 3, weightKg: 75, reps: 5, rir: 1, completed: true },
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 4, weightKg: 75, reps: 5, rir: 2, completed: true },
          { exerciseId: byName.get("Omuz Presi")!.id, setNumber: 1, weightKg: 32.5, reps: 8, rir: 2, completed: true },
          { exerciseId: byName.get("Omuz Presi")!.id, setNumber: 2, weightKg: 35, reps: 8, rir: 2, completed: true },
          { exerciseId: byName.get("Omuz Presi")!.id, setNumber: 3, weightKg: 35, reps: 7, rir: 1, completed: true },
          { exerciseId: byName.get("Koşu Bandı")!.id, setNumber: 1, durationMinutes: 16, durationSeconds: 960, completed: true }
        ]
      }
    }
  });

  await prisma.comment.createMany({
    data: [
      {
        workoutId: completedWorkout1.id,
        authorId: coaches[0].id,
        content: "Bench press formun çok iyi. Bir sonraki hafta ilk seti 72.5 ile açabiliriz."
      },
      {
        workoutId: completedWorkout1.id,
        authorId: coaches[0].id,
        content: "Kardiyö temposu dengeli, son 4 dakikada hızı korunman güzel."
      },
      {
        workoutId: completedWorkout1.id,
        authorId: clients[0].id,
        content: "Bugün çok enerjik hissettim! Antrenman süperi geçti."
      }
    ]
  });

  const completedWorkout2 = await prisma.workout.create({
    data: {
      clientId: clients[1].id,
      templateId: templates[2].id,
      assignmentId: assignments[2].id,
      status: "COMPLETED",
      startedAt: dateAt(7, 50, -5),
      finishedAt: dateAt(8, 55, -5),
      sets: {
        create: [
          { exerciseId: byName.get("Bisiklet")!.id, setNumber: 1, durationMinutes: 20, durationSeconds: 1200, completed: true },
          { exerciseId: byName.get("Kürek Makinesi")!.id, setNumber: 1, durationMinutes: 12, durationSeconds: 720, completed: true }
        ]
      }
    }
  });

  await prisma.comment.createMany({
    data: [
      {
        workoutId: completedWorkout2.id,
        authorId: coaches[0].id,
        content: "HIIT temponu çok iyi kontrol ettin. Kalp atış hızı progresyonu ideal."
      }
    ]
  });

  // Create in-progress workout
  await prisma.workout.create({
    data: {
      clientId: clients[0].id,
      templateId: templates[1].id,
      assignmentId: assignments[1].id,
      status: "IN_PROGRESS",
      startedAt: dateAt(18, 5, 0),
      sets: {
        create: [
          { exerciseId: byName.get("Ölü Kaldırış")!.id, setNumber: 1, weightKg: 100, reps: 5, rir: 2, completed: true },
          { exerciseId: byName.get("Ölü Kaldırış")!.id, setNumber: 2, weightKg: 105, reps: 4, rir: 1, completed: true }
        ]
      }
    }
  });

  // Create abandoned workout
  await prisma.workout.create({
    data: {
      clientId: clients[3].id,
      templateId: templates[4].id,
      assignmentId: assignments[4].id,
      status: "ABANDONED",
      startedAt: dateAt(9, 20, -1),
      finishedAt: dateAt(9, 44, -1),
      sets: {
        create: [
          { exerciseId: byName.get("Eliptik")!.id, setNumber: 1, durationMinutes: 14, durationSeconds: 842, completed: true },
          { exerciseId: byName.get("Halat Atlama")!.id, setNumber: 1, durationMinutes: 3, durationSeconds: 186, completed: true }
        ]
      }
    }
  });

  // Create more completed workouts for richer demo
  const completedWorkout3 = await prisma.workout.create({
    data: {
      clientId: clients[2].id,
      templateId: templates[5].id,
      assignmentId: assignments[5].id,
      status: "COMPLETED",
      startedAt: dateAt(8, 0, -3),
      finishedAt: dateAt(8, 50, -3),
      sets: {
        create: [
          { exerciseId: byName.get("Incline Barbell Press")!.id, setNumber: 1, weightKg: 60, reps: 6, rir: 2, completed: true },
          { exerciseId: byName.get("Incline Barbell Press")!.id, setNumber: 2, weightKg: 62.5, reps: 6, rir: 2, completed: true },
          { exerciseId: byName.get("Incline Barbell Press")!.id, setNumber: 3, weightKg: 65, reps: 5, rir: 1, completed: true },
          { exerciseId: byName.get("Dumbbell Flyes")!.id, setNumber: 1, weightKg: 20, reps: 12, rir: 2, completed: true },
          { exerciseId: byName.get("Dumbbell Flyes")!.id, setNumber: 2, weightKg: 20, reps: 11, rir: 2, completed: true },
          { exerciseId: byName.get("Dumbbell Flyes")!.id, setNumber: 3, weightKg: 20, reps: 10, rir: 1, completed: true },
          { exerciseId: byName.get("Kütlübaşı Kaldırması")!.id, setNumber: 1, weightKg: 80, reps: 8, rir: 2, completed: true },
          { exerciseId: byName.get("Kütlübaşı Kaldırması")!.id, setNumber: 2, weightKg: 80, reps: 7, rir: 1, completed: true },
          { exerciseId: byName.get("Kütlübaşı Kaldırması")!.id, setNumber: 3, weightKg: 80, reps: 6, rir: 1, completed: true }
        ]
      }
    }
  });

  await prisma.comment.createMany({
    data: [
      {
        workoutId: completedWorkout3.id,
        authorId: coaches[2].id,
        content: "Form çok temiz! Göğüs aktivasyonu mükemmel. Bacak stabilitesi için biraz daha dikkat ver."
      },
      {
        workoutId: completedWorkout3.id,
        authorId: coaches[2].id,
        content: "Bu haftanın sonunda ağırlığı 2.5 kg artırabiliriz."
      }
    ]
  });

  const completedWorkout4 = await prisma.workout.create({
    data: {
      clientId: clients[6].id,
      templateId: templates[6].id,
      assignmentId: assignments[6].id,
      status: "COMPLETED",
      startedAt: dateAt(18, 35, -2),
      finishedAt: dateAt(19, 40, -2),
      sets: {
        create: [
          { exerciseId: byName.get("Barbell Sıra")!.id, setNumber: 1, weightKg: 90, reps: 6, rir: 2, completed: true },
          { exerciseId: byName.get("Barbell Sıra")!.id, setNumber: 2, weightKg: 95, reps: 5, rir: 2, completed: true },
          { exerciseId: byName.get("Barbell Sıra")!.id, setNumber: 3, weightKg: 100, reps: 4, rir: 1, completed: true },
          { exerciseId: byName.get("Barbell Sıra")!.id, setNumber: 4, weightKg: 95, reps: 6, rir: 2, completed: true },
          { exerciseId: byName.get("Lat Pulldown")!.id, setNumber: 1, weightKg: 80, reps: 10, rir: 2, completed: true },
          { exerciseId: byName.get("Lat Pulldown")!.id, setNumber: 2, weightKg: 80, reps: 10, rir: 2, completed: true },
          { exerciseId: byName.get("Lat Pulldown")!.id, setNumber: 3, weightKg: 80, reps: 9, rir: 1, completed: true },
          { exerciseId: byName.get("Leg Press")!.id, setNumber: 1, weightKg: 200, reps: 12, rir: 2, completed: true },
          { exerciseId: byName.get("Leg Press")!.id, setNumber: 2, weightKg: 200, reps: 12, rir: 2, completed: true },
          { exerciseId: byName.get("Leg Press")!.id, setNumber: 3, weightKg: 200, reps: 10, rir: 1, completed: true }
        ]
      }
    }
  });

  await prisma.comment.createMany({
    data: [
      {
        workoutId: completedWorkout4.id,
        authorId: coaches[3].id,
        content: "Sıra tekniğin harika! Sırt aktivasyonu çok iyi, ağırlık tahminleri doğru."
      },
      {
        workoutId: completedWorkout4.id,
        authorId: coaches[3].id,
        content: "Lat pulldown'da son sette biraz daha agresif olabilirsin. Ama genel olarak süper antrenman!"
      },
      {
        workoutId: completedWorkout4.id,
        authorId: clients[6].id,
        content: "Çok iyi hissettim, teşekkürler koç!"
      }
    ]
  });

  console.log("✓ Staging seed tamamlandı - Zengin Türkçe demo veri seti yüklendi");
  console.log(`✓ ${coaches.length} koç oluşturuldu`);
  console.log(`✓ ${clients.length} müşteri oluşturuldu`);
  console.log(`✓ ${templates.length} antrenman şablonu oluşturuldu`);
  console.log(`✓ 5 tamamlanmış antrenman kaydı oluşturuldu`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
