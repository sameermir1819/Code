-- Additive patch for existing databases managed with prisma db push.
-- No attendance records are deleted or given invented historical scan times.
BEGIN;
ALTER TABLE "Attendance"
  ADD COLUMN IF NOT EXISTS "checkInAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "checkOutAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "checkInScanId" TEXT,
  ADD COLUMN IF NOT EXISTS "checkOutScanId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_checkInScanId_key" ON "Attendance"("checkInScanId");
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_checkOutScanId_key" ON "Attendance"("checkOutScanId");
COMMIT;
