CREATE TYPE "CallInviteStatus" AS ENUM ('RINGING', 'ACCEPTED', 'REJECTED', 'MISSED', 'CANCELLED', 'ENDED', 'FAILED');

CREATE TABLE "CallInvite" (
    "id" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "calleeId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" "SessionCallMode" NOT NULL,
    "status" "CallInviteStatus" NOT NULL DEFAULT 'RINGING',
    "rtcProvider" TEXT DEFAULT 'link',
    "providerRoomCode" TEXT,
    "providerHostUserId" TEXT,
    "startedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallInvite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CallInvite_callerId_createdAt_idx" ON "CallInvite"("callerId", "createdAt");
CREATE INDEX "CallInvite_calleeId_status_expiresAt_idx" ON "CallInvite"("calleeId", "status", "expiresAt");
CREATE INDEX "CallInvite_sessionId_createdAt_idx" ON "CallInvite"("sessionId", "createdAt");

ALTER TABLE "CallInvite"
ADD CONSTRAINT "CallInvite_callerId_fkey"
FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CallInvite"
ADD CONSTRAINT "CallInvite_calleeId_fkey"
FOREIGN KEY ("calleeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CallInvite"
ADD CONSTRAINT "CallInvite_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
