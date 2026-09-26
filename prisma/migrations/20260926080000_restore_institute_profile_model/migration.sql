-- Restore the profile-only data model after the temporary Campus split.
-- Campus ids were copied from Institute ids by the previous migration, so all
-- scoped records can be reattached to the same Institute rows without remapping.

INSERT INTO "Institute" (
  "id", "name", "code", "city", "state", "address", "phone", "email", "createdAt", "updatedAt"
)
SELECT
  c."id", c."name", c."code", c."city", c."state", c."address", c."phone", c."email", c."createdAt", c."updatedAt"
FROM "Campus" c
ON CONFLICT ("id") DO NOTHING;

DO $$
DECLARE
  old_fk RECORD;
BEGIN
  -- Constraint names can differ by environment, so drop every relationship
  -- that currently targets the temporary Campus table.
  FOR old_fk IN (
    SELECT c.relname AS table_name, con.conname AS constraint_name
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_class ref ON ref.oid = con.confrelid
    WHERE con.contype = 'f'
      AND ref.relname = 'Campus'
      AND c.relname IN (
        'StudentIdSequence', 'AcademicSession', 'User', 'Teacher', 'Student',
        'Course', 'Batch', 'AuditLog', 'Lead', 'TestSeries'
      )
  ) LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', old_fk.table_name, old_fk.constraint_name);
  END LOOP;
END $$;

ALTER TABLE "StudentIdSequence" ADD CONSTRAINT "StudentIdSequence_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicSession" ADD CONSTRAINT "AcademicSession_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestSeries" ADD CONSTRAINT "TestSeries_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "Campus";
