-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "additionalMessage" TEXT;

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "message" TEXT[],
    "serviceId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
