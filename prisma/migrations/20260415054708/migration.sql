/*
  Warnings:

  - You are about to drop the column `benId` on the `tbl_communication` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `tbl_communication` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_communication" DROP COLUMN "benId",
DROP COLUMN "phone";
