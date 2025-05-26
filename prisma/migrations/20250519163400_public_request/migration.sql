-- CreateTable
CREATE TABLE "publicRequest" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "publicRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publicRequest_formId_idx" ON "publicRequest"("formId");

-- AddForeignKey
ALTER TABLE "publicRequest" ADD CONSTRAINT "publicRequest_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
