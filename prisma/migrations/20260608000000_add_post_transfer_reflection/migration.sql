-- AlterTable
ALTER TABLE "Post" ADD COLUMN "isAiIctLesson" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "transferStrength" TEXT;
ALTER TABLE "Post" ADD COLUMN "transferSkillOrigins" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Post" ADD COLUMN "transferMotivation" TEXT;
