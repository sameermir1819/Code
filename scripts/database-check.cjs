// Read-only: no seed, schema changes, credentials, or personal records printed.
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient, Prisma } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const report = await db.$transaction(async tx => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    const counts = {};
    for (const model of Prisma.dmmf.datamodel.models) {
      const delegate = model.name[0].toLowerCase() + model.name.slice(1);
      counts[model.name] = await tx[delegate].count();
    }
    const issues = await tx.$queryRaw`
      SELECT 'fee_plan_balance' AS check, COUNT(*)::int AS violations FROM "FeePlan"
      WHERE ABS("finalAmount" - "paidAmount" - "balanceAmount") > 0.011
        OR "paidAmount" < 0 OR "balanceAmount" < 0
      UNION ALL
      SELECT 'installment_balance', COUNT(*)::int FROM "FeeInstallment"
      WHERE ABS("amount" - "paidAmount" - "remainingAmount") > 0.011
        OR "paidAmount" < 0 OR "remainingAmount" < 0
      UNION ALL
      SELECT 'payment_student_mismatch', COUNT(*)::int FROM "Payment" p
      JOIN "FeePlan" f ON f.id = p."feePlanId" WHERE p."studentId" <> f."studentId"
      UNION ALL
      SELECT 'attendance_times', COUNT(*)::int FROM "Attendance"
      WHERE "checkOutAt" IS NOT NULL AND ("checkInAt" IS NULL OR "checkOutAt" < "checkInAt")
      UNION ALL
      SELECT 'scholarship_scores', COUNT(*)::int FROM "Enrollment"
      WHERE "source" = 'SCHOLARSHIP_TEST' AND (
        "scholarshipMarks" IS NULL OR "scholarshipMaxMarks" IS NULL OR
        "scholarshipMarks" < 0 OR "scholarshipMaxMarks" <= 0 OR "scholarshipMarks" > "scholarshipMaxMarks")
    `;
    const migrationWarnings = await tx.$queryRaw`
      SELECT migration_name, COUNT(*)::int AS entries, COUNT(DISTINCT checksum)::int AS checksums
      FROM "_prisma_migrations" WHERE rolled_back_at IS NULL
      GROUP BY migration_name HAVING COUNT(*) > 1
    `;
    const failedMigrations = await tx.$queryRaw`
      SELECT COUNT(*)::int AS count FROM "_prisma_migrations"
      WHERE finished_at IS NULL AND rolled_back_at IS NULL
    `;
    // Same SQL/driver combination as the numbering helpers, no row changes.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(73190499)`;
    return { counts, issues, migrationWarnings, failedMigrations: failedMigrations[0].count, advisoryLock: 'passed' };
  }, { timeout: 60000, maxWait: 10000, isolationLevel: 'RepeatableRead' });
  console.log(JSON.stringify(report, null, 2));
  if (report.failedMigrations || report.issues.some(row => row.violations > 0)) process.exitCode = 1;
}

main().catch(error => {
  console.error(`Database check failed (${error.code || error.name}). Connection details omitted.`);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
