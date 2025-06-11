/*
  Warnings:

  - You are about to drop the column `isPublished` on the `Form` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `FormField` table. All the data in the column will be lost.
  - The `options` column on the `FormField` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `FormField` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Form" DROP COLUMN "isPublished";

-- AlterTable
ALTER TABLE "FormField" DROP COLUMN "order",
ADD COLUMN     "pageId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "options",
ADD COLUMN     "options" JSONB,
ALTER COLUMN "gridPosition" DROP NOT NULL;

-- CreateTable
CREATE TABLE "FormPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "header" JSONB,
    "footer" JSONB,
    "order" INTEGER NOT NULL,
    "formId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormPage_formId_idx" ON "FormPage"("formId");

-- CreateIndex
CREATE INDEX "FormField_pageId_idx" ON "FormField"("pageId");

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "FormPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormPage" ADD CONSTRAINT "FormPage_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
