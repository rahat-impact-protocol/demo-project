-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'NOTAVAILABLE');

-- AlterTable
ALTER TABLE "tbl_beneficiary" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'NOTAVAILABLE';
