/*
  Warnings:

  - Changed the type of `type` on the `request_types` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `companyName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `designation` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestTypeEnum" AS ENUM ('incident', 'request', 'change');

-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'in_progress';

-- DropIndex
DROP INDEX "request_types_type_key";

-- AlterTable
ALTER TABLE "request_types" DROP COLUMN "type",
ADD COLUMN     "type" "RequestTypeEnum" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "designation" TEXT NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'user';
