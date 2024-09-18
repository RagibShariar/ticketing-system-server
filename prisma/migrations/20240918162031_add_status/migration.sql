-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'fulfilled', 'cancelled');

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'pending';
