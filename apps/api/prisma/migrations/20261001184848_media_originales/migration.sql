-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN     "encodingVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "originalPath" TEXT;
