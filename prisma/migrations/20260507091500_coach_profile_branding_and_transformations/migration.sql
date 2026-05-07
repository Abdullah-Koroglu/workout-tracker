ALTER TABLE "CoachProfile"
ADD COLUMN "slogan" TEXT,
ADD COLUMN "accentColor" TEXT DEFAULT '#F97316',
ADD COLUMN "transformationPhotos" JSONB;
