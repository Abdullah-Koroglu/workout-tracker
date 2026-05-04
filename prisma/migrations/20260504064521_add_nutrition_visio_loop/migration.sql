/*
  Warnings:

  - The `status` column on the `CoachClientRelation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Workout` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[inviteCode]` on the table `CoachProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `CoachProfile` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type` on the `Exercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COACH', 'CLIENT');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'TIER_1', 'TIER_2', 'AGENCY');

-- CreateEnum
CREATE TYPE "RelationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('WEIGHT', 'CARDIO');

-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "AdherenceTag" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- AlterTable
ALTER TABLE "ClientProfile" ALTER COLUMN "heightCm" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "weightKg" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "CoachClientRelation" DROP COLUMN "status",
ADD COLUMN     "status" "RelationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "CoachPackage" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "targetMuscle" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "ExerciseType" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;

-- AlterTable
ALTER TABLE "Workout" DROP COLUMN "status",
ADD COLUMN     "status" "WorkoutStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "WorkoutSet" ADD COLUMN     "actualRestSeconds" INTEGER,
ALTER COLUMN "weightKg" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WorkoutTemplateExercise" ADD COLUMN     "prescribedRestSeconds" INTEGER DEFAULT 90;

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInResponse" (
    "id" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,
    "sleepScore" INTEGER NOT NULL,
    "stressScore" INTEGER NOT NULL,
    "motivationScore" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionPlan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "targetCalories" INTEGER,
    "targetProtein" INTEGER,
    "targetCarbs" INTEGER,
    "targetFats" INTEGER,
    "dietDocumentUrl" TEXT,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionMealLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "adherenceTag" "AdherenceTag" NOT NULL,
    "clientNote" TEXT,
    "aiSummary" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionMealLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckIn_clientId_createdAt_idx" ON "CheckIn"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckIn_coachId_createdAt_idx" ON "CheckIn"("coachId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInResponse_checkInId_key" ON "CheckInResponse"("checkInId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionPlan_clientId_key" ON "NutritionPlan"("clientId");

-- CreateIndex
CREATE INDEX "NutritionMealLog_clientId_loggedAt_idx" ON "NutritionMealLog"("clientId", "loggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_inviteCode_key" ON "CoachProfile"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_stripeCustomerId_key" ON "CoachProfile"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInResponse" ADD CONSTRAINT "CheckInResponse_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionPlan" ADD CONSTRAINT "NutritionPlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionMealLog" ADD CONSTRAINT "NutritionMealLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
