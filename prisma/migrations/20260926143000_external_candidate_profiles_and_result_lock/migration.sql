ALTER TABLE "TestSeriesExam"
ADD COLUMN IF NOT EXISTS "resultsPublishedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "resultsPublishedBy" TEXT;

UPDATE "TestSeriesExam"
SET "resultsPublishedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE "status" = 'RESULTS_PUBLISHED';

CREATE TABLE IF NOT EXISTS "ExternalCandidate" (
  "id" TEXT NOT NULL,
  "instituteId" TEXT NOT NULL,
  "candidateNo" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "gender" TEXT,
  "parentName" TEXT,
  "parentPhone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalCandidate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TestSeriesRegistration" ADD COLUMN IF NOT EXISTS "externalCandidateId" TEXT;

WITH candidates AS (
  SELECT
    ts."instituteId",
    i."code" AS "instituteCode",
    COALESCE(NULLIF(trim(r."externalStudentPhone"), ''), 'LEGACY-' || r."id") AS "candidatePhone",
    COALESCE(NULLIF(trim(r."externalStudentName"), ''), 'External Candidate') AS "candidateName",
    NULLIF(trim(r."externalStudentEmail"), '') AS "candidateEmail",
    r."createdAt"
  FROM "TestSeriesRegistration" r
  JOIN "TestSeries" ts ON ts."id" = r."testSeriesId"
  JOIN "Institute" i ON i."id" = ts."instituteId"
  WHERE r."studentId" IS NULL
)
INSERT INTO "ExternalCandidate" ("id", "instituteId", "candidateNo", "name", "phone", "email", "createdAt", "updatedAt")
SELECT
  'ext_' || md5("instituteId" || ':' || "candidatePhone"),
  "instituteId",
  'EXT-' || upper(regexp_replace("instituteCode", '[^A-Za-z0-9]', '', 'g')) || '-' || substr(md5("instituteId" || ':' || "candidatePhone"), 1, 8),
  MIN("candidateName"),
  "candidatePhone",
  MIN("candidateEmail"),
  MIN("createdAt"),
  CURRENT_TIMESTAMP
FROM candidates
GROUP BY "instituteId", "instituteCode", "candidatePhone"
ON CONFLICT DO NOTHING;

UPDATE "TestSeriesRegistration" r
SET "externalCandidateId" = 'ext_' || md5(ts."instituteId" || ':' || COALESCE(NULLIF(trim(r."externalStudentPhone"), ''), r."id"))
FROM "TestSeries" ts
WHERE ts."id" = r."testSeriesId" AND r."studentId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ExternalCandidate_candidateNo_key" ON "ExternalCandidate"("candidateNo");
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalCandidate_instituteId_phone_key" ON "ExternalCandidate"("instituteId", "phone");
CREATE INDEX IF NOT EXISTS "ExternalCandidate_instituteId_idx" ON "ExternalCandidate"("instituteId");
CREATE INDEX IF NOT EXISTS "ExternalCandidate_name_idx" ON "ExternalCandidate"("name");
CREATE INDEX IF NOT EXISTS "ExternalCandidate_phone_idx" ON "ExternalCandidate"("phone");
CREATE INDEX IF NOT EXISTS "TestSeriesRegistration_externalCandidateId_idx" ON "TestSeriesRegistration"("externalCandidateId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExternalCandidate_instituteId_fkey') THEN
    ALTER TABLE "ExternalCandidate" ADD CONSTRAINT "ExternalCandidate_instituteId_fkey"
    FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TestSeriesRegistration_externalCandidateId_fkey') THEN
    ALTER TABLE "TestSeriesRegistration" ADD CONSTRAINT "TestSeriesRegistration_externalCandidateId_fkey"
    FOREIGN KEY ("externalCandidateId") REFERENCES "ExternalCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
