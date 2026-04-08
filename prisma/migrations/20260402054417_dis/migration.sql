-- AlterTable
ALTER TABLE "tbl_beneficiary" ALTER COLUMN "uuid" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "tbl_disbursement" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "amountPerBen" INTEGER NOT NULL,
    "totalBen" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_disbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_ben_disbursement" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "disbursementId" INTEGER NOT NULL,
    "benId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_ben_disbursement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_disbursement_uuid_key" ON "tbl_disbursement"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_ben_disbursement_uuid_key" ON "tbl_ben_disbursement"("uuid");

-- AddForeignKey
ALTER TABLE "tbl_ben_disbursement" ADD CONSTRAINT "tbl_ben_disbursement_benId_fkey" FOREIGN KEY ("benId") REFERENCES "tbl_beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_ben_disbursement" ADD CONSTRAINT "tbl_ben_disbursement_disbursementId_fkey" FOREIGN KEY ("disbursementId") REFERENCES "tbl_disbursement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
