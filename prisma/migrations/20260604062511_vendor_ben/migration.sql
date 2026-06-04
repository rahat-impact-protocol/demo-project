-- CreateEnum
CREATE TYPE "BankStatus" AS ENUM ('BANKED', 'UNBANKED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "tbl_beneficiary" ADD COLUMN     "bankStatus" "BankStatus" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "extras" JSONB;

-- AlterTable
ALTER TABLE "tbl_vendor" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "tbl_vendor_ben" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "beneficiaryId" INTEGER NOT NULL,
    "claimCreated" BOOLEAN NOT NULL DEFAULT false,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "totalServed" INTEGER NOT NULL,
    "latestServedAmount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latestServedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_vendor_ben_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vendor_ben_beneficiaryId_key" ON "tbl_vendor_ben"("beneficiaryId");

-- AddForeignKey
ALTER TABLE "tbl_vendor_ben" ADD CONSTRAINT "tbl_vendor_ben_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "tbl_vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_vendor_ben" ADD CONSTRAINT "tbl_vendor_ben_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "tbl_beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
