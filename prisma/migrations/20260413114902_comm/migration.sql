-- DropForeignKey
ALTER TABLE "tbl_communication" DROP CONSTRAINT "tbl_communication_benId_fkey";

-- CreateTable
CREATE TABLE "tbl_ben_communication" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "communicationId" INTEGER NOT NULL,
    "benId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_ben_communication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_ben_communication_uuid_key" ON "tbl_ben_communication"("uuid");

-- AddForeignKey
ALTER TABLE "tbl_ben_communication" ADD CONSTRAINT "tbl_ben_communication_benId_fkey" FOREIGN KEY ("benId") REFERENCES "tbl_beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_ben_communication" ADD CONSTRAINT "tbl_ben_communication_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "tbl_communication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
