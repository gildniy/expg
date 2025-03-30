/*
  Warnings:

  - You are about to alter the column `balance` on the `PointBalance` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the column `accountHolder` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `accountNumber` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `bankCode` on the `Transaction` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `pointsChange` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - The `status` column on the `VirtualAccount` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `amount` on the `WithdrawalRequest` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - The `status` column on the `WithdrawalRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "VirtualAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "WithdrawalRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "PointBalance" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "accountHolder",
DROP COLUMN "accountNumber",
DROP COLUMN "bankCode",
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "pointsChange" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "VirtualAccount" DROP COLUMN "status",
ADD COLUMN     "status" "VirtualAccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
DROP COLUMN "status",
ADD COLUMN     "status" "WithdrawalRequestStatus" NOT NULL DEFAULT 'REQUESTED';

-- CreateIndex
CREATE INDEX "Transaction_referenceId_type_idx" ON "Transaction"("referenceId", "type");
