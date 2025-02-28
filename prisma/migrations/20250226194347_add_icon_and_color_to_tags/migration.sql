/*
  Warnings:

  - Added the required column `color` to the `Tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "icon" TEXT NOT NULL;
