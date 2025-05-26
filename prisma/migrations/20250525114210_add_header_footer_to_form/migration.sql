/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `AdminCode` table. All the data in the column will be lost.
  - You are about to drop the column `connectedToId` on the `User` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `AdminCode` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_connectedToId_fkey";

-- DropIndex
DROP INDEX "FormSubmission_userId_formId_key";

-- DropIndex
DROP INDEX "User_adminCodeId_idx";

-- DropIndex
DROP INDEX "User_connectedToId_idx";

-- AlterTable
ALTER TABLE "AdminCode" DROP COLUMN "expiresAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "footer" JSONB,
ADD COLUMN     "header" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "connectedToId";
