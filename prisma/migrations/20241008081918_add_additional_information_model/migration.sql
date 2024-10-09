/*
  Warnings:

  - You are about to drop the column `additionalMessage` on the `service_requests` table. All the data in the column will be lost.
  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_userId_fkey";

-- AlterTable
ALTER TABLE "service_requests" DROP COLUMN "additionalMessage";

-- DropTable
DROP TABLE "comments";

-- CreateTable
CREATE TABLE "additional_information" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "serviceRequestId" INTEGER NOT NULL,

    CONSTRAINT "additional_information_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "additional_information_userId_idx" ON "additional_information"("userId");

-- CreateIndex
CREATE INDEX "additional_information_serviceRequestId_idx" ON "additional_information"("serviceRequestId");

-- AddForeignKey
ALTER TABLE "additional_information" ADD CONSTRAINT "additional_information_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_information" ADD CONSTRAINT "additional_information_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
