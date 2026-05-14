-- CreateEnum
CREATE TYPE "VendorRedemptionsStatus" AS ENUM ('REQUESTED', 'PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "VendorRedemptions" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "status" "VendorRedemptionsStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "VendorRedemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorRedemptions_uuid_key" ON "VendorRedemptions"("uuid");

-- AddForeignKey
ALTER TABLE "VendorRedemptions" ADD CONSTRAINT "VendorRedemptions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
