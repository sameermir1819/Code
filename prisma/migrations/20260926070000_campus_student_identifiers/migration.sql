-- Backfill legacy IDs to compact campus-scoped IDs such as HAW-26-001.
WITH campus_codes AS (
  SELECT
    c."id" AS campus_id,
    LEFT(
      REGEXP_REPLACE(
        TRIM(BOTH '-' FROM REGEXP_REPLACE(UPPER(c."code"), '[^A-Z0-9]+', '-', 'g')),
        '^(FX|FL)-', ''
      ),
      3
    ) AS campus_code
  FROM "Campus" c
),
legacy AS (
  SELECT
    s."id",
    cc.campus_code,
    RIGHT(SUBSTRING(s."studentId" FROM '^STU-([0-9]{4})-'), 2) AS short_year,
    SUBSTRING(s."studentId" FROM '^STU-([0-9]{4})-')::INTEGER AS full_year,
    ROW_NUMBER() OVER (
      PARTITION BY s."instituteId", SUBSTRING(s."studentId" FROM '^STU-([0-9]{4})-')
      ORDER BY s."createdAt", s."id"
    ) AS sequence_number
  FROM "Student" s
  JOIN campus_codes cc ON cc.campus_id = s."instituteId"
  WHERE s."studentId" ~ '^STU-[0-9]{4}-[0-9]+$'
),
updated AS (
  UPDATE "Student" s
  SET
    "studentId" = l.campus_code || '-' || l.short_year || '-' || LPAD(l.sequence_number::TEXT, 3, '0'),
    "admissionNo" = 'ADM-' || l.campus_code || '-' || l.short_year || '-' || LPAD(l.sequence_number::TEXT, 3, '0'),
    "updatedAt" = CURRENT_TIMESTAMP
  FROM legacy l
  WHERE s."id" = l."id"
  RETURNING s."instituteId", l.full_year, l.sequence_number
),
used_sequences AS (
  SELECT "instituteId" AS campus_id, full_year AS year, MAX(sequence_number)::INTEGER AS max_number
  FROM updated
  GROUP BY "instituteId", full_year
)
INSERT INTO "StudentIdSequence" ("id", "instituteId", "year", "nextNumber", "createdAt", "updatedAt")
SELECT
  'seq_' || MD5(us.campus_id || ':' || us.year::TEXT),
  us.campus_id,
  us.year,
  us.max_number + 1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM used_sequences us
ON CONFLICT ("instituteId", "year") DO UPDATE
SET
  "nextNumber" = GREATEST("StudentIdSequence"."nextNumber", EXCLUDED."nextNumber"),
  "updatedAt" = CURRENT_TIMESTAMP;
