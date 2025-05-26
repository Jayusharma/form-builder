/*
  Warnings:

  - The values [GROUP] on the enum `FormFieldType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `groupId` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the `FormGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FormFieldType_new" AS ENUM ('TEXT', 'PARAGRAPH', 'MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN', 'SUBMIT', 'IMAGE_UPLOAD', 'RICH_TEXT');
ALTER TABLE "FormField" ALTER COLUMN "type" TYPE "FormFieldType_new" USING ("type"::text::"FormFieldType_new");
ALTER TYPE "FormFieldType" RENAME TO "FormFieldType_old";
ALTER TYPE "FormFieldType_new" RENAME TO "FormFieldType";
DROP TYPE "FormFieldType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "FormField" DROP CONSTRAINT "FormField_groupId_fkey";

-- DropForeignKey
ALTER TABLE "FormGroup" DROP CONSTRAINT "FormGroup_formId_fkey";

-- DropIndex
DROP INDEX "FormField_groupId_idx";

-- AlterTable
ALTER TABLE "FormField" DROP COLUMN "groupId";

-- DropTable
DROP TABLE "FormGroup";
