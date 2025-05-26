/*
  Warnings:

  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "status";

-- DropEnum
DROP TYPE "UserStatus";

-- CreateIndex
CREATE INDEX "User_adminCodeId_idx" ON "User"("adminCodeId");
