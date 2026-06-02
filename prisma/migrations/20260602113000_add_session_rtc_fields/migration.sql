-- CreateEnum
CREATE TYPE "RtcCallStatus" AS ENUM ('NOT_CONFIGURED', 'READY', 'LIVE', 'ENDED');

-- AlterTable
ALTER TABLE "Session"
ADD COLUMN     "rtcCallStatus" "RtcCallStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
ADD COLUMN     "rtcProvider" TEXT,
ADD COLUMN     "rtcRoomId" TEXT;
