-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminCodeId" TEXT;

-- CreateTable
CREATE TABLE "AdminCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminCode_code_key" ON "AdminCode"("code");

-- CreateIndex
CREATE INDEX "AdminCode_adminId_idx" ON "AdminCode"("adminId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_adminCodeId_fkey" FOREIGN KEY ("adminCodeId") REFERENCES "AdminCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminCode" ADD CONSTRAINT "AdminCode_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
