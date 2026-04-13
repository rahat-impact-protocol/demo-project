/*
  Warnings:

  - The `status` column on the `tbl_communication` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('SENDING', 'CREATED', 'FAILED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('SMS', 'IVR');

-- AlterTable
ALTER TABLE "tbl_communication" ADD COLUMN     "type" "CommunicationType" NOT NULL DEFAULT 'SMS',
DROP COLUMN "status",
ADD COLUMN     "status" "CommunicationStatus" NOT NULL DEFAULT 'CREATED';

-- DropEnum
DROP TYPE "SmsStatus";
