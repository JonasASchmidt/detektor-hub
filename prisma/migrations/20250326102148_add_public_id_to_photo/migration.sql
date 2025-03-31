/*
  Warnings:

  - Added the required column `publicId` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "publicId" TEXT NOT NULL,
ALTER COLUMN "url" DROP NOT NULL;
