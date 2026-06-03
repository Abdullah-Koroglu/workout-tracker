CREATE TYPE "SessionCallMode" AS ENUM ('AUDIO', 'VIDEO');
CREATE TYPE "SessionCallStatus" AS ENUM ('SCHEDULED', 'PROVISIONING', 'READY', 'LIVE', 'ENDED', 'FAILED');
CREATE TYPE "SessionRtcSyncState" AS ENUM ('PENDING', 'SYNCED', 'ERROR');
CREATE TYPE "SessionRecordingStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'READY', 'FAILED');
CREATE TYPE "SessionParticipantRole" AS ENUM ('COACH', 'CLIENT');
CREATE TYPE "SessionParticipantJoinState" AS ENUM ('INVITED', 'JOINED', 'LEFT', 'REMOVED');

ALTER TABLE "Session"
ADD COLUMN "providerRoomCode" TEXT,
ADD COLUMN "providerHostUserId" TEXT,
ADD COLUMN "callMode" "SessionCallMode" NOT NULL DEFAULT 'VIDEO',
ADD COLUMN "callStatus" "SessionCallStatus" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN "syncState" "SessionRtcSyncState" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "recordingStatus" "SessionRecordingStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "endedAt" TIMESTAMP(3),
ADD COLUMN "providerMetadata" JSONB;

UPDATE "Session"
SET
  "providerRoomCode" = COALESCE("providerRoomCode", "rtcRoomId"),
  "callStatus" = CASE
    WHEN "rtcCallStatus" = 'READY' THEN 'READY'::"SessionCallStatus"
    WHEN "rtcCallStatus" = 'LIVE' THEN 'LIVE'::"SessionCallStatus"
    WHEN "rtcCallStatus" = 'ENDED' THEN 'ENDED'::"SessionCallStatus"
    ELSE "callStatus"
  END,
  "syncState" = CASE
    WHEN "rtcRoomId" IS NOT NULL THEN 'SYNCED'::"SessionRtcSyncState"
    ELSE "syncState"
  END,
  "recordingStatus" = CASE
    WHEN "recordingUrl" IS NOT NULL THEN 'READY'::"SessionRecordingStatus"
    ELSE "recordingStatus"
  END;

CREATE TABLE "SessionParticipant" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "SessionParticipantRole" NOT NULL,
  "joinState" "SessionParticipantJoinState" NOT NULL DEFAULT 'INVITED',
  "joinedAt" TIMESTAMP(3),
  "leftAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SessionParticipant_sessionId_userId_key" ON "SessionParticipant"("sessionId", "userId");
CREATE INDEX "SessionParticipant_userId_joinState_idx" ON "SessionParticipant"("userId", "joinState");

ALTER TABLE "SessionParticipant"
ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SessionParticipant"
ADD CONSTRAINT "SessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "SessionParticipant" ("id", "sessionId", "userId", "role", "joinState", "createdAt", "updatedAt")
SELECT md5(s."id" || ':coach:' || s."coachId"), s."id", s."coachId", 'COACH'::"SessionParticipantRole", 'INVITED'::"SessionParticipantJoinState", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Session" s
ON CONFLICT ("sessionId", "userId") DO NOTHING;

INSERT INTO "SessionParticipant" ("id", "sessionId", "userId", "role", "joinState", "createdAt", "updatedAt")
SELECT md5(s."id" || ':client:' || s."clientId"), s."id", s."clientId", 'CLIENT'::"SessionParticipantRole", 'INVITED'::"SessionParticipantJoinState", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Session" s
ON CONFLICT ("sessionId", "userId") DO NOTHING;
