-- Repair faculty profiles created under a different campus than their linked user.
-- Subjects remain global; only the faculty profile follows the user's allotted campus.
UPDATE "Teacher" AS teacher
SET
  "instituteId" = app_user."instituteId",
  "updatedAt" = CURRENT_TIMESTAMP
FROM "User" AS app_user
WHERE teacher."userId" = app_user."id"
  AND app_user."instituteId" IS NOT NULL
  AND teacher."instituteId" <> app_user."instituteId";
