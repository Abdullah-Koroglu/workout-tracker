import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

function dateAt(hour: number, minute = 0, plusDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + plusDays);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
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

  const [coachA, coachB] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Demo Coach",
        email: "coach@fitcoach.dev",
        password: passwordHash,
        role: "COACH"
      }
    }),
    prisma.user.create({
      data: {
        name: "Elif Yilmaz",
        email: "coach2@fitcoach.dev",
        password: passwordHash,
        role: "COACH"
      }
    })
  ]);

  const [clientA, clientB, clientC, clientD] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Demo Client",
        email: "client@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Ayse Kaya",
        email: "client2@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Mehmet Demir",
        email: "client3@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Can Su",
        email: "client4@fitcoach.dev",
        password: passwordHash,
        role: "CLIENT"
      }
    })
  ]);

  await prisma.coachClientRelation.createMany({
    data: [
      { coachId: coachA.id, clientId: clientA.id, status: "ACCEPTED" },
      { coachId: coachA.id, clientId: clientB.id, status: "ACCEPTED" },
      { coachId: coachA.id, clientId: clientC.id, status: "PENDING" },
      { coachId: coachA.id, clientId: clientD.id, status: "REJECTED" },
      { coachId: coachB.id, clientId: clientC.id, status: "ACCEPTED" },
      { coachId: coachB.id, clientId: clientD.id, status: "ACCEPTED" },
      { coachId: coachB.id, clientId: clientA.id, status: "PENDING" }
    ]
  });

  const exercises = await Promise.all([
    prisma.exercise.create({ data: { name: "Back Squat", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Front Squat", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Bench Press", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Incline DB Press", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Deadlift", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Romanian Deadlift", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Pull Up", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Barbell Row", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Shoulder Press", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Leg Press", type: "WEIGHT" } }),
    prisma.exercise.create({ data: { name: "Treadmill", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "Bike Erg", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "RowErg", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "StairMaster", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "Elliptical", type: "CARDIO" } }),
    prisma.exercise.create({ data: { name: "Jump Rope", type: "CARDIO" } })
  ]);

  const byName = new Map(exercises.map((exercise) => [exercise.name, exercise]));

  const [templateA1, templateA2, templateA3, templateB1, templateB2] = await Promise.all([
    prisma.workoutTemplate.create({
      data: {
        coachId: coachA.id,
        name: "Strength A - Push + Cardio",
        description: "Guc odakli ust vucut + kontrollu cardio",
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
              exerciseId: byName.get("Shoulder Press")!.id,
              order: 1,
              targetSets: 3,
              targetReps: 8,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Treadmill")!.id,
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
        coachId: coachA.id,
        name: "Strength B - Pull + Legs",
        description: "Cekis odakli guc ve alt vucut",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Deadlift")!.id,
              order: 0,
              targetSets: 3,
              targetReps: 5,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Barbell Row")!.id,
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
        coachId: coachA.id,
        name: "Conditioning Day",
        description: "Cardio ve genel kondisyon odakli gun",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Bike Erg")!.id,
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
              exerciseId: byName.get("RowErg")!.id,
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
    prisma.workoutTemplate.create({
      data: {
        coachId: coachB.id,
        name: "Hypertrophy Full Body",
        description: "Kas gelisimi odakli tum vucut",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Back Squat")!.id,
              order: 0,
              targetSets: 4,
              targetReps: 8,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Incline DB Press")!.id,
              order: 1,
              targetSets: 4,
              targetReps: 10,
              targetRir: 2
            },
            {
              exerciseId: byName.get("Pull Up")!.id,
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
        coachId: coachB.id,
        name: "Endurance Mix",
        description: "Uzun sureli dayanıklılık antrenmani",
        exercises: {
          create: [
            {
              exerciseId: byName.get("Elliptical")!.id,
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
              exerciseId: byName.get("Jump Rope")!.id,
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
    })
  ]);

  const [assignmentA1, assignmentA2, assignmentA3, assignmentB1, assignmentB2] = await Promise.all([
    prisma.templateAssignment.create({
      data: {
        templateId: templateA1.id,
        clientId: clientA.id,
        assignedBy: coachA.id,
        scheduledFor: dateAt(8, 30, 0),
        isOneTime: true
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templateA2.id,
        clientId: clientA.id,
        assignedBy: coachA.id,
        scheduledFor: dateAt(18, 0, 1),
        isOneTime: true
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templateA3.id,
        clientId: clientB.id,
        assignedBy: coachA.id,
        scheduledFor: dateAt(7, 45, 0),
        isOneTime: true
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templateB1.id,
        clientId: clientC.id,
        assignedBy: coachB.id,
        scheduledFor: dateAt(19, 0, 0),
        isOneTime: true
      }
    }),
    prisma.templateAssignment.create({
      data: {
        templateId: templateB2.id,
        clientId: clientD.id,
        assignedBy: coachB.id,
        scheduledFor: dateAt(9, 15, -1),
        isOneTime: true
      }
    })
  ]);

  const completedWorkout = await prisma.workout.create({
    data: {
      clientId: clientA.id,
      templateId: templateA1.id,
      assignmentId: assignmentA1.id,
      status: "COMPLETED",
      startedAt: dateAt(8, 35, -7),
      finishedAt: dateAt(9, 20, -7),
      sets: {
        create: [
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 1, weightKg: 70, reps: 6, rir: 2, completed: true },
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 2, weightKg: 72.5, reps: 6, rir: 2, completed: true },
          { exerciseId: byName.get("Bench Press")!.id, setNumber: 3, weightKg: 75, reps: 5, rir: 1, completed: true },
          { exerciseId: byName.get("Shoulder Press")!.id, setNumber: 1, weightKg: 32.5, reps: 8, rir: 2, completed: true },
          { exerciseId: byName.get("Shoulder Press")!.id, setNumber: 2, weightKg: 35, reps: 8, rir: 2, completed: true },
          { exerciseId: byName.get("Shoulder Press")!.id, setNumber: 3, weightKg: 35, reps: 7, rir: 1, completed: true },
          { exerciseId: byName.get("Treadmill")!.id, setNumber: 1, durationMinutes: 16, durationSeconds: 960, completed: true }
        ]
      }
    }
  });

  await prisma.comment.createMany({
    data: [
      {
        workoutId: completedWorkout.id,
        authorId: coachA.id,
        content: "Bench press formun cok iyi. Bir sonraki hafta ilk seti 72.5 ile acabiliriz."
      },
      {
        workoutId: completedWorkout.id,
        authorId: coachA.id,
        content: "Cardio temposu dengeli, son 4 dakikada hizi koruman guzel."
      }
    ]
  });

  await prisma.workout.create({
    data: {
      clientId: clientD.id,
      templateId: templateB2.id,
      assignmentId: assignmentB2.id,
      status: "ABANDONED",
      startedAt: dateAt(9, 20, -1),
      finishedAt: dateAt(9, 44, -1),
      sets: {
        create: [
          { exerciseId: byName.get("Elliptical")!.id, setNumber: 1, durationMinutes: 14, durationSeconds: 842, completed: true },
          { exerciseId: byName.get("Jump Rope")!.id, setNumber: 1, durationMinutes: 3, durationSeconds: 186, completed: true }
        ]
      }
    }
  });

  await prisma.workout.create({
    data: {
      clientId: clientA.id,
      templateId: templateA2.id,
      assignmentId: assignmentA2.id,
      status: "IN_PROGRESS",
      startedAt: dateAt(18, 5, 1),
      sets: {
        create: [
          { exerciseId: byName.get("Deadlift")!.id, setNumber: 1, weightKg: 100, reps: 5, rir: 2, completed: true }
        ]
      }
    }
  });

  console.log("Seed completed with comprehensive data set");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
