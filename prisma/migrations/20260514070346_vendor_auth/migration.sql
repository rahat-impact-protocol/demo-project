/*
  Warnings:

  - You are about to drop the `Vendor` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "VendorAuthProvider" AS ENUM ('GOOGLE', 'BACKEND');

-- DropForeignKey
ALTER TABLE "VendorRedemptions" DROP CONSTRAINT "VendorRedemptions_vendorId_fkey";

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

-- CreateTable
CREATE TABLE "tbl_vendor_auth_session" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "authProvider" "VendorAuthProvider" NOT NULL DEFAULT 'GOOGLE',
    "providerSubject" TEXT,
    "accessTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_vendor_auth_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vendor_uuid_key" ON "tbl_vendor"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vendor_email_key" ON "tbl_vendor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vendor_auth_session_uuid_key" ON "tbl_vendor_auth_session"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_vendor_auth_session_sessionId_key" ON "tbl_vendor_auth_session"("sessionId");

-- CreateIndex
CREATE INDEX "tbl_vendor_auth_session_vendorId_idx" ON "tbl_vendor_auth_session"("vendorId");

-- CreateIndex
CREATE INDEX "tbl_vendor_auth_session_sessionId_idx" ON "tbl_vendor_auth_session"("sessionId");

-- AddForeignKey
ALTER TABLE "tbl_vendor_auth_session" ADD CONSTRAINT "tbl_vendor_auth_session_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "tbl_vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRedemptions" ADD CONSTRAINT "VendorRedemptions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "tbl_vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
