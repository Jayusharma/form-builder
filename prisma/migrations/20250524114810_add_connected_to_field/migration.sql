-- AlterTable
ALTER TABLE "User" ADD COLUMN     "connectedToId" TEXT;

-- CreateIndex
CREATE INDEX "User_connectedToId_idx" ON "User"("connectedToId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_connectedToId_fkey" FOREIGN KEY ("connectedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
