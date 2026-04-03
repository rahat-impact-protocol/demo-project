-- CreateEnum
CREATE TYPE "DisbursementType" AS ENUM ('Cash');

-- AlterTable
ALTER TABLE "tbl_disbursement" ADD COLUMN     "name" TEXT,
ADD COLUMN     "type" "DisbursementType" DEFAULT 'Cash';
