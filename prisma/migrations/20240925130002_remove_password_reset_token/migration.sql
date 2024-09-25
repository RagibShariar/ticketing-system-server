/*
  Warnings:

  - You are about to drop the column `passwordResetToken` on the `otp_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetTokenExpiry` on the `otp_verifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "otp_verifications" DROP COLUMN "passwordResetToken",
DROP COLUMN "passwordResetTokenExpiry";
