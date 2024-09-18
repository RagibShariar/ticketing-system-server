/*
  Warnings:

  - You are about to drop the column `serviceRequestId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `RequestType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_requestTypeId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_serviceRequestId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "serviceRequestId";

-- DropTable
DROP TABLE "RequestType";

-- DropTable
DROP TABLE "ServiceRequest";

-- CreateTable
CREATE TABLE "service_requests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestTypeId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_types" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "request_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "request_types_type_key" ON "request_types"("type");

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_requestTypeId_fkey" FOREIGN KEY ("requestTypeId") REFERENCES "request_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
