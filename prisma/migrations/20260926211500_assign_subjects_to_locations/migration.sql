ALTER TABLE "Subject" ADD COLUMN "instituteId" TEXT;

UPDATE "Subject"
SET "instituteId" = (
  SELECT "id" FROM "Institute" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "instituteId" IS NULL;

ALTER TABLE "Subject" ALTER COLUMN "instituteId" SET NOT NULL;
CREATE INDEX "Subject_instituteId_idx" ON "Subject"("instituteId");
ALTER TABLE "Subject"
ADD CONSTRAINT "Subject_instituteId_fkey"
FOREIGN KEY ("instituteId") REFERENCES "Institute"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
