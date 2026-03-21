/*
  Warnings:

  - You are about to drop the column `thumbnailUrl` on the `Finding` table. All the data in the column will be lost.
  - You are about to drop the `Photo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Finding` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_findingId_fkey";

-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_userId_fkey";

-- AlterTable
ALTER TABLE "Finding" DROP COLUMN "thumbnailUrl",
ADD COLUMN     "conductivity" INTEGER,
ADD COLUMN     "detectorId" TEXT,
ADD COLUMN     "thumbnailId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Photo";

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "findingId" TEXT,
    "userId" TEXT NOT NULL,
    "url" TEXT,
    "publicId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Detector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Detector_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_detectorId_fkey" FOREIGN KEY ("detectorId") REFERENCES "Detector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
