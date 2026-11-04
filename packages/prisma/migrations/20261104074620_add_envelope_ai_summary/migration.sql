-- CreateTable
CREATE TABLE "EnvelopeAiSummary" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvelopeAiSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnvelopeAiSummary_envelopeId_key" ON "EnvelopeAiSummary"("envelopeId");

-- AddForeignKey
ALTER TABLE "EnvelopeAiSummary" ADD CONSTRAINT "EnvelopeAiSummary_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "Envelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
