-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_findingId_fkey";

-- AlterTable
ALTER TABLE "Photo" ALTER COLUMN "findingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
