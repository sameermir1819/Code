-- Separate the single Futurex Learning profile from its operational campuses.
-- Campus ids intentionally reuse the old Institute ids so existing scoped data
-- keeps pointing at the same campus without rewriting any business records.
CREATE TABLE "Campus" (
  "id" TEXT NOT NULL,
  "instituteId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "city" TEXT,
  "state" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Campus_code_key" ON "Campus"("code");
CREATE INDEX "Campus_instituteId_idx" ON "Campus"("instituteId");

DO $$
DECLARE
  main_institute_id TEXT;
  old_fk RECORD;
BEGIN
  SELECT "id" INTO main_institute_id
  FROM "Institute"
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1;

  IF main_institute_id IS NULL THEN
    RAISE EXCEPTION 'Cannot create campuses because no Institute profile exists';
  END IF;

  INSERT INTO "Campus" (
    "id", "instituteId", "name", "code", "city", "state", "address",
    "phone", "email", "createdAt", "updatedAt"
  )
  SELECT
    "id", main_institute_id, "name", "code", "city", "state", "address",
    "phone", "email", "createdAt", "updatedAt"
  FROM "Institute";

  -- Remove old foreign keys to Institute. Constraint names may differ between
  -- environments, so discover them from PostgreSQL metadata.
  FOR old_fk IN (
    SELECT c.relname AS table_name, con.conname AS constraint_name
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_class ref ON ref.oid = con.confrelid
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
    WHERE con.contype = 'f' AND ref.relname = 'Institute' AND a.attname = 'instituteId'
      AND c.relname IN (
        'StudentIdSequence', 'AcademicSession', 'User', 'Teacher', 'Student',
        'Course', 'Batch', 'AuditLog', 'Lead', 'TestSeries'
      )
  ) LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', old_fk.table_name, old_fk.constraint_name);
  END LOOP;

  DELETE FROM "Institute" WHERE "id" <> main_institute_id;
  UPDATE "Institute"
  SET "name" = 'Futurex Learning', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = main_institute_id;
END $$;

ALTER TABLE "Campus"
  ADD CONSTRAINT "Campus_instituteId_fkey"
  FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentIdSequence" ADD CONSTRAINT "StudentIdSequence_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicSession" ADD CONSTRAINT "AcademicSession_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestSeries" ADD CONSTRAINT "TestSeries_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
