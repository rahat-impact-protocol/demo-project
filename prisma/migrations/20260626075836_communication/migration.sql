/*
  Warnings:

  - You are about to drop the column `reaponseDetails` on the `tbl_communication` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_communication" DROP COLUMN "reaponseDetails",
ADD COLUMN     "responseDetails" JSONB;
