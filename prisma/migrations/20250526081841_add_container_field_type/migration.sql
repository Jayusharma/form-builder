/*
  Warnings:

  - The values [CONTAINER] on the enum `FormFieldType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FormFieldType_new" AS ENUM ('TEXT', 'PARAGRAPH', 'MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN', 'SUBMIT', 'IMAGE_UPLOAD', 'RICH_TEXT', 'GROUP');
ALTER TABLE "FormField" ALTER COLUMN "type" TYPE "FormFieldType_new" USING ("type"::text::"FormFieldType_new");
ALTER TYPE "FormFieldType" RENAME TO "FormFieldType_old";
ALTER TYPE "FormFieldType_new" RENAME TO "FormFieldType";
DROP TYPE "FormFieldType_old";
COMMIT;

-- AlterTable
ALTER TABLE "FormField" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "FormGroup" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "gridPosition" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormGroup_formId_idx" ON "FormGroup"("formId");

-- CreateIndex
CREATE INDEX "FormField_groupId_idx" ON "FormField"("groupId");

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FormGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormGroup" ADD CONSTRAINT "FormGroup_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
