-- CreateEnum
CREATE TYPE "AgencyMembershipRole" AS ENUM ('OWNER', 'ADMIN', 'COACH', 'STAFF');

-- CreateEnum
CREATE TYPE "AgencyMembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateTable
CREATE TABLE "AgencyWorkspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "billingEmail" TEXT,
    "city" TEXT,
    "isGym" BOOLEAN NOT NULL DEFAULT false,
    "seatsIncluded" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyMembership" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AgencyMembershipRole" NOT NULL DEFAULT 'COACH',
    "status" "AgencyMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "permissions" JSONB,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencySharedClient" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "primaryCoachId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'shared',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencySharedClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyWorkspace_slug_key" ON "AgencyWorkspace"("slug");

-- CreateIndex
CREATE INDEX "AgencyWorkspace_ownerId_createdAt_idx" ON "AgencyWorkspace"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyMembership_workspaceId_userId_key" ON "AgencyMembership"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "AgencyMembership_userId_status_idx" ON "AgencyMembership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AgencySharedClient_workspaceId_clientId_key" ON "AgencySharedClient"("workspaceId", "clientId");

-- CreateIndex
CREATE INDEX "AgencySharedClient_primaryCoachId_idx" ON "AgencySharedClient"("primaryCoachId");

-- AddForeignKey
ALTER TABLE "AgencyWorkspace" ADD CONSTRAINT "AgencyWorkspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyMembership" ADD CONSTRAINT "AgencyMembership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "AgencyWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyMembership" ADD CONSTRAINT "AgencyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySharedClient" ADD CONSTRAINT "AgencySharedClient_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "AgencyWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySharedClient" ADD CONSTRAINT "AgencySharedClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySharedClient" ADD CONSTRAINT "AgencySharedClient_primaryCoachId_fkey" FOREIGN KEY ("primaryCoachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
