export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "ACCOUNTANT"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "COUNSELOR"
  | "STAFF"
  | (string & {});

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  instituteId?: string | null;
  teacherId?: string | null;
  studentId?: string | null;
  parentId?: string | null;
}

export type PermissionCode =
  // Users module
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.status"
  | "users.role"
  | "users.permissions"
  | "users.delete"
  | "users.activity"
  // Students module
  | "students.view"
  | "students.create"
  | "students.update"
  | "students.delete"
  // Teachers module
  | "teachers.view"
  | "teachers.create"
  | "teachers.update"
  // Academics module
  | "courses.view"
  | "courses.manage"
  | "batches.view"
  | "batches.manage"
  | "timetable.view"
  | "timetable.manage"
  // Attendance module
  | "attendance.view"
  | "attendance.manage"
  // Finance module
  | "fees.view"
  | "fees.create"
  | "fees.update"
  // Exams module
  | "exams.view"
  | "exams.create"
  | "exams.update"
  | "results.view"
  | "results.manage"
  // Reports & Settings
  | "reports.view"
  | "settings.view"
  | "settings.manage"
  | "dashboard.view"
  | "materials.view"
  | "materials.manage"
  | "leads.view"
  | "leads.manage"
  | "leads.delete"
  | "announcements.view"
  | "announcements.manage"
  | "test-series.view"
  | "test-series.manage"
  | "test-series.enroll"
  | "exports.view"
  | "audit.view";

export const ROLE_PERMISSIONS: Partial<Record<Role, PermissionCode[]>> = {
  SUPER_ADMIN: [
    "users.view",
    "users.create",
    "users.update",
    "users.status",
    "users.role",
    "users.permissions",
    "users.delete",
    "users.activity",
    "students.view",
    "students.create",
    "students.update",
    "students.delete",
    "teachers.view",
    "teachers.create",
    "teachers.update",
    "courses.view",
    "courses.manage",
    "batches.view",
    "batches.manage",
    "timetable.view",
    "timetable.manage",
    "attendance.view",
    "attendance.manage",
    "fees.view",
    "fees.create",
    "fees.update",
    "exams.view",
    "exams.create",
    "exams.update",
    "results.view",
    "results.manage",
    "reports.view",
    "settings.view",
    "settings.manage",
  ],
  ADMIN: [
    "users.view",
    "users.create",
    "users.update",
    "users.status",
    "users.activity",
    "students.view",
    "students.create",
    "students.update",
    "students.delete",
    "teachers.view",
    "teachers.create",
    "teachers.update",
    "courses.view",
    "courses.manage",
    "batches.view",
    "batches.manage",
    "timetable.view",
    "timetable.manage",
    "attendance.view",
    "attendance.manage",
    "fees.view",
    "fees.create",
    "fees.update",
    "exams.view",
    "exams.create",
    "exams.update",
    "results.view",
    "results.manage",
    "reports.view",
    "settings.view",
    "settings.manage",
  ],
  ACCOUNTANT: [
    "users.view",
    "students.view",
    "fees.view",
    "fees.create",
    "fees.update",
    "reports.view",
  ],
  TEACHER: [
    "users.view",
    "students.view",
    "courses.view",
    "batches.view",
    "timetable.view",
    "attendance.view",
    "attendance.manage",
    "exams.view",
    "exams.update",
    "results.view",
  ],
  STUDENT: [
    "courses.view",
    "batches.view",
    "timetable.view",
    "attendance.view",
    "fees.view",
    "results.view",
  ],
  PARENT: [
    "attendance.view",
    "fees.view",
    "results.view",
  ],
  COUNSELOR: [
    "students.view",
    "courses.view",
    "batches.view",
  ],
  STAFF: [
    "students.view",
    "attendance.view",
    "batches.view",
  ],
};

// Newly introduced modules retain established access until the permission catalog is synchronized.
export const NEW_PERMISSION_DEFAULTS: Partial<Record<PermissionCode, Role[]>> = {
  "dashboard.view": [
    "ADMIN",
    "ACCOUNTANT",
    "TEACHER",
    "COUNSELOR",
    "STAFF"
  ],
  "materials.view": [
    "ADMIN",
    "ACCOUNTANT",
    "TEACHER",
    "COUNSELOR",
    "STAFF",
    "STUDENT"
  ],
  "materials.manage": [
    "ADMIN",
    "TEACHER"
  ],
  "leads.view": [
    "ADMIN",
    "ACCOUNTANT",
    "TEACHER",
    "COUNSELOR",
    "STAFF"
  ],
  "leads.manage": [
    "ADMIN",
    "ACCOUNTANT",
    "TEACHER",
    "COUNSELOR"
  ],
  "leads.delete": [
    "ADMIN"
  ],
  "announcements.view": [
    "ADMIN",
    "ACCOUNTANT",
    "TEACHER",
    "COUNSELOR",
    "STAFF",
    "STUDENT",
    "PARENT"
  ],
  "announcements.manage": [
    "ADMIN"
  ],
  "test-series.view": [
    "ADMIN",
    "TEACHER",
    "STUDENT"
  ],
  "test-series.manage": [
    "ADMIN",
    "TEACHER"
  ],
  "test-series.enroll": [
    "STUDENT"
  ],
  "exports.view": [
    "ADMIN",
    "ACCOUNTANT"
  ],
  "audit.view": [
    "ADMIN"
  ]
};
export const NEW_PERMISSION_CODES = Object.keys(NEW_PERMISSION_DEFAULTS) as PermissionCode[];
for (const [code, roles] of Object.entries(NEW_PERMISSION_DEFAULTS)) {
  for (const role of roles ?? []) ROLE_PERMISSIONS[role] = [...(ROLE_PERMISSIONS[role] ?? []), code as PermissionCode];
  ROLE_PERMISSIONS.SUPER_ADMIN!.push(code as PermissionCode);
}
export const ALL_PERMISSION_CODES = ROLE_PERMISSIONS.SUPER_ADMIN!;

export function hasRolePermission(role: Role, code: PermissionCode): boolean {
  if (role === "SUPER_ADMIN") return true;
  return ROLE_PERMISSIONS[role]?.includes(code) ?? false;
}

export function hasPermission(
  userOrRole: SessionUser | Role | null | undefined,
  code: PermissionCode
): boolean {
  if (!userOrRole) return false;
  const role: Role = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  return hasRolePermission(role, code);
}

export function canAccessModule(role: Role, module: string): boolean {
  if (role === "SUPER_ADMIN") return true;

  switch (module) {
    case "dashboard":
      return true;
    case "users":
      return ["ADMIN", "ACCOUNTANT"].includes(role);
    case "students":
      return ["ADMIN", "ACCOUNTANT", "TEACHER", "COUNSELOR", "STAFF"].includes(role);
    case "admissions":
      return ["ADMIN"].includes(role);
    case "academics":
    case "courses":
    case "batches":
      return ["ADMIN", "TEACHER"].includes(role);
    case "test-series":
      return ["ADMIN", "TEACHER"].includes(role);
    case "timetable":
      return true;
    case "attendance":
      return true;
    case "finance":
      return ["ADMIN", "ACCOUNTANT"].includes(role);
    case "exams":
    case "results":
      return true;
    case "materials":
      return true;
    case "announcements":
    case "notifications":
      return true;
    case "leads":
      return ["ADMIN", "ACCOUNTANT", "TEACHER", "COUNSELOR", "STAFF"].includes(role);
    case "data-export":
    case "reports":
      return ["ADMIN", "ACCOUNTANT"].includes(role);
    case "settings":
      return ["ADMIN"].includes(role);
    case "audit":
      return false; // Only SUPER_ADMIN (already handled above)
    default:
      return false;
  }
}
