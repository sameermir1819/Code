import type { PermissionCode } from "./permissions";

export const NAV_PERMISSIONS: Record<string, PermissionCode> = {
  "/dashboard": "dashboard.view", "/students": "students.view", "/admissions": "students.create",
  "/dashboard/batches": "batches.view", "/batches": "batches.view", "/faculty": "teachers.view",
  "/teachers": "teachers.view", "/attendance": "attendance.view", "/exams": "exams.view",
  "/test-series": "test-series.view", "/results": "results.view", "/materials": "materials.view",
  "/leads": "leads.view", "/finance": "fees.view", "/finance/payments": "fees.view",
  "/finance/outstanding": "fees.view", "/announcements": "announcements.view",
  "/dashboard/users": "users.view", "/users": "users.view", "/data-export": "exports.view",
  "/audit": "audit.view", "/settings": "settings.view", "/timetable": "timetable.view",
  "/portal/batches": "batches.view", "/portal/attendance": "attendance.view",
  "/portal/results": "results.view", "/portal/test-series": "test-series.view",
  "/portal/fees": "fees.view", "/portal/materials": "materials.view",
};

export function canNavigate(href: string, permissions: readonly string[]) {
  const code = NAV_PERMISSIONS[href];
  return !code || permissions.includes(code);
}
