/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TagCategory` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TagCategory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "TagCategory" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
