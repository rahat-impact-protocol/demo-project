/*
  Warnings:

  - The primary key for the `tbl_beneficiary` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `tbl_beneficiary` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[uuid]` on the table `tbl_beneficiary` will be added. If there are existing duplicate values, this will fail.
  - The required column `uuid` was added to the `tbl_beneficiary` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "tbl_beneficiary" DROP CONSTRAINT "tbl_beneficiary_pkey",
ADD COLUMN     "uuid" UUID NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "tbl_beneficiary_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "tbl_beneficiary_pii" (
    "beneficiaryId" INTEGER NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "extras" JSONB
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_pii_beneficiaryId_key" ON "tbl_beneficiary_pii"("beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_pii_phone_key" ON "tbl_beneficiary_pii"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_uuid_key" ON "tbl_beneficiary"("uuid");

-- AddForeignKey
ALTER TABLE "tbl_beneficiary_pii" ADD CONSTRAINT "tbl_beneficiary_pii_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "tbl_beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
