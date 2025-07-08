/*
  Warnings:

  - You are about to drop the column `diunggahPada` on the `dokumen_persyaratan` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `dokumen_persyaratan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dokumen_persyaratan` DROP COLUMN `diunggahPada`,
    ADD COLUMN `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
