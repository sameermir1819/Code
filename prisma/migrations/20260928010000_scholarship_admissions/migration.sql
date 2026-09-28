ALTER TABLE "Enrollment"
ADD COLUMN "scholarshipTestName" TEXT,
ADD COLUMN "scholarshipTestDate" TIMESTAMP(3),
ADD COLUMN "scholarshipRollNumber" TEXT,
ADD COLUMN "scholarshipMarks" DOUBLE PRECISION,
ADD COLUMN "scholarshipMaxMarks" DOUBLE PRECISION,
ADD COLUMN "scholarshipPercentage" DOUBLE PRECISION,
ADD COLUMN "scholarshipRank" INTEGER;

CREATE INDEX "Enrollment_source_idx" ON "Enrollment"("source");
CREATE INDEX "Enrollment_scholarshipRollNumber_idx" ON "Enrollment"("scholarshipRollNumber");
