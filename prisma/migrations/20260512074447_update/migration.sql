/*
  Warnings:

  - You are about to drop the `Vendor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VendorRedemptions" DROP CONSTRAINT "VendorRedemptions_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "tbl_vendor_auth_session" DROP CONSTRAINT "tbl_vendor_auth_session_vendorId_fkey";

-- DropTable
DROP TABLE "Vendor";

-- CreateTable
CREATE TABLE "tbl_vendor" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "extras" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vendor_uuid_key" ON "tbl_vendor"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vendor_email_key" ON "tbl_vendor"("email");

-- AddForeignKey
ALTER TABLE "tbl_vendor_auth_session" ADD CONSTRAINT "tbl_vendor_auth_session_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "tbl_vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRedemptions" ADD CONSTRAINT "VendorRedemptions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "tbl_vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
