-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED');

-- CreateTable
CREATE TABLE "tbl_communication" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "benId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_communication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_communication_uuid_key" ON "tbl_communication"("uuid");

-- AddForeignKey
ALTER TABLE "tbl_communication" ADD CONSTRAINT "tbl_communication_benId_fkey" FOREIGN KEY ("benId") REFERENCES "tbl_beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
