-- CreateTable
CREATE TABLE "tbl_beneficiary_wallet" (
    "uuid" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "keyDetails" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_wallet_uuid_key" ON "tbl_beneficiary_wallet"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_beneficiary_wallet_walletAddress_key" ON "tbl_beneficiary_wallet"("walletAddress");
