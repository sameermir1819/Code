ALTER TABLE "Lead"
ADD COLUMN "interestType" TEXT NOT NULL DEFAULT 'ADMISSION',
ADD COLUMN "testSeriesId" TEXT,
ADD COLUMN "convertedTestSeriesRegistrationId" TEXT;

CREATE INDEX "Lead_interestType_idx" ON "Lead"("interestType");
CREATE INDEX "Lead_testSeriesId_idx" ON "Lead"("testSeriesId");
