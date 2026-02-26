-- CreateEnum
CREATE TYPE "SettingDataType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'OBJECT');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('PENDING', 'FAILED', 'DISBURSED', 'NOTSTARTED');

-- CreateTable
CREATE TABLE "tbl_registry" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "baseUrl" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "privateKey" TEXT,

    CONSTRAINT "tbl_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "dataType" "SettingDataType" NOT NULL,
    "requiredFields" TEXT[],
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tbl_settings_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "tbl_beneficiary" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "disbursementStatus" "DisbursementStatus" NOT NULL DEFAULT 'NOTSTARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tbl_beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_settings_name_key" ON "tbl_settings"("name");
