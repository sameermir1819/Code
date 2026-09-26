-- Student accounts and registrations previously used SET NULL. Keep the
-- database constraints aligned with the Prisma schema's explicit cascades.
ALTER TABLE "Student" DROP CONSTRAINT IF EXISTS "Student_userId_fkey";
ALTER TABLE "Student"
  ADD CONSTRAINT "Student_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestSeriesRegistration"
  DROP CONSTRAINT IF EXISTS "TestSeriesRegistration_studentId_fkey";
ALTER TABLE "TestSeriesRegistration"
  ADD CONSTRAINT "TestSeriesRegistration_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
