-- CreateEnum
CREATE TYPE "BeneficiaryType" AS ENUM ('INDIVIDUAL', 'GROUP');

-- AlterTable
ALTER TABLE "tbl_communication" ADD COLUMN     "benType" "BeneficiaryType" NOT NULL DEFAULT 'INDIVIDUAL';
