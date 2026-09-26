UPDATE "FeePlan" AS fp
SET "title" = b."name" || ' Fee Plan'
FROM "Enrollment" AS e
JOIN "Batch" AS b ON b."id" = e."batchId"
WHERE fp."enrollmentId" = e."id"
  AND fp."title" = 'General Academic Program - Annual Plan';

UPDATE "FeePlan"
SET "title" = 'Fee Plan'
WHERE "title" = 'General Academic Program - Annual Plan';

UPDATE "Course"
SET "name" = 'Academic Program'
WHERE "name" = 'General Academic Program';
