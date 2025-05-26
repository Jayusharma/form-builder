/*
  Warnings:

  - A unique constraint covering the columns `[userId,formId]` on the table `FormSubmission` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `FormSubmission` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "FormSubmission" DROP CONSTRAINT "FormSubmission_userId_fkey";

-- AlterTable
ALTER TABLE "FormSubmission" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "isTwoFactorEnabled" SET DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "FormSubmission_userId_formId_key" ON "FormSubmission"("userId", "formId");

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
