-- Teachers are explicitly checked against their assigned batches by the
-- attendance action, so grant them the permission needed to reach that check.
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT
  'rp_teacher_attendance_manage',
  role.id,
  permission.id,
  CURRENT_TIMESTAMP
FROM "Role" role
JOIN "Permission" permission ON permission.code = 'attendance.manage'
WHERE role.name = 'TEACHER'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
