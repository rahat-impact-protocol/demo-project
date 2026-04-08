-- CreateTable
CREATE TABLE "tbl_beneficiary_group" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_beneficiary_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_beneficiary_group_member" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "beneficiaryId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_beneficiary_group_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_group_uuid_key" ON "tbl_beneficiary_group"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_group_member_beneficiaryId_key" ON "tbl_beneficiary_group_member"("beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_group_member_groupId_beneficiaryId_key" ON "tbl_beneficiary_group_member"("groupId", "beneficiaryId");

-- AddForeignKey
ALTER TABLE "tbl_beneficiary_group_member" ADD CONSTRAINT "tbl_beneficiary_group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "tbl_beneficiary_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_beneficiary_group_member" ADD CONSTRAINT "tbl_beneficiary_group_member_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "tbl_beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
