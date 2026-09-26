CREATE TABLE "StudentIdSequence" (
  "id" TEXT NOT NULL,
  "instituteId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "nextNumber" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentIdSequence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentIdSequence_instituteId_year_key"
  ON "StudentIdSequence"("instituteId", "year");
CREATE INDEX "StudentIdSequence_instituteId_idx"
  ON "StudentIdSequence"("instituteId");

ALTER TABLE "StudentIdSequence"
  ADD CONSTRAINT "StudentIdSequence_instituteId_fkey"
  FOREIGN KEY ("instituteId") REFERENCES "Institute"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
