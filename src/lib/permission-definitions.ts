import { NEW_PERMISSION_CODES } from "./permissions";

export const STANDARD_PERMISSIONS = [
  // users
  { code: "users.view", name: "View Users", module: "users", description: "View system user accounts, roles and profiles" },
  { code: "users.create", name: "Create Users", module: "users", description: "Add new administrative, faculty, and student user accounts" },
  { code: "users.update", name: "Update Users", module: "users", description: "Edit user profile information, contact details, and branches" },
  { code: "users.status", name: "Manage User Status", module: "users", description: "Activate, suspend or deactivate user accounts" },
  { code: "users.role", name: "Manage Roles & Permissions", module: "users", description: "Configure system roles, custom roles, and permission assignments" },
  { code: "users.permissions", name: "Direct Permissions", module: "users", description: "Assign direct user-level permission overrides" },
  { code: "users.delete", name: "Delete Users", module: "users", description: "Archive or permanently remove user accounts" },
  { code: "users.activity", name: "View User Activity", module: "users", description: "Inspect user activity logs, login history, and audit trails" },

  // students
  { code: "students.view", name: "View Students", module: "students", description: "Access student directory, academic profiles, and enrollments" },
  { code: "students.create", name: "Admit Students", module: "students", description: "Register new student admissions and allocate enrollment numbers" },
  { code: "students.update", name: "Update Students", module: "students", description: "Modify student personal details, parents, and academic info" },
  { code: "students.delete", name: "Archive Students", module: "students", description: "Archive or delete student admission records" },

  // teachers
  { code: "teachers.view", name: "View Faculty", module: "teachers", description: "View faculty directory, profiles, and qualifications" },
  { code: "teachers.create", name: "Add Faculty", module: "teachers", description: "Onboard new teachers and faculty members" },
  { code: "teachers.update", name: "Update Faculty", module: "teachers", description: "Edit teacher subject specializations, bios, and assignments" },

  // academics
  { code: "courses.view", name: "View Courses", module: "academics", description: "View courses, curriculum structures, and subject syllabi" },
  { code: "courses.manage", name: "Manage Courses", module: "academics", description: "Create, edit, or archive academic courses and subjects" },
  { code: "batches.view", name: "View Batches", module: "academics", description: "Browse class batches, timings, and enrolled students" },
  { code: "batches.manage", name: "Manage Batches", module: "academics", description: "Create class batches, assign faculty, and set room capacities" },
  { code: "timetable.view", name: "View Timetable", module: "academics", description: "View master lecture schedule and weekly classroom timetables" },
  { code: "timetable.manage", name: "Manage Timetable", module: "academics", description: "Schedule class periods, assign lecture rooms, and adjust slots" },

  // attendance
  { code: "attendance.view", name: "View Attendance", module: "attendance", description: "Review daily student and faculty attendance records and percentages" },
  { code: "attendance.manage", name: "Mark Attendance", module: "attendance", description: "Mark, update, and submit daily batch attendance registers" },

  // finance
  { code: "fees.view", name: "View Fees", module: "finance", description: "Access fee structures, student dues, ledger, and transaction logs" },
  { code: "fees.create", name: "Collect Fees", module: "finance", description: "Record fee payments, issue receipts, and print invoices" },
  { code: "fees.update", name: "Manage Fee Plans", module: "finance", description: "Configure course fee plans, installment schedules, and discounts" },

  // exams
  { code: "exams.view", name: "View Exams", module: "exams", description: "View offline test series, exam schedules, and test papers" },
  { code: "exams.create", name: "Create Exams", module: "exams", description: "Schedule exams, assessments, and offline test series" },
  { code: "exams.update", name: "Edit Exams", module: "exams", description: "Modify exam syllabus, duration, marks weighting, and test dates" },
  { code: "results.view", name: "View Results", module: "exams", description: "View scorecards, merit lists, percentile ranks, and analysis" },
  { code: "results.manage", name: "Enter Marks & Results", module: "exams", description: "Enter student marks, generate rank sheets, and publish results" },

  // reports
  { code: "reports.view", name: "View Reports", module: "reports", description: "Access analytics dashboards, financial summaries, and data exports" },

  // settings
  { code: "settings.view", name: "View Settings", module: "settings", description: "View institute configuration, campus profile, and system audit logs" },
  { code: "settings.manage", name: "Manage Settings", module: "settings", description: "Configure institute preferences, academic sessions, and campuses" },
];

export const STANDARD_ROLES = [
  {
    name: "SUPER_ADMIN",
    displayName: "Super Administrator",
    description: "Full master administrative control across all campuses, modules, and system security.",
    isSystem: true,
  },
  {
    name: "ADMIN",
    displayName: "Campus Administrator",
    description: "Operational management for students, faculty, academics, examinations, and fee plans.",
    isSystem: true,
  },
  {
    name: "ACCOUNTANT",
    displayName: "Finance & Accounts",
    description: "Handles student fee collections, payment entries, invoice receipts, and financial reports.",
    isSystem: true,
  },
  {
    name: "TEACHER",
    displayName: "Faculty / Teacher",
    description: "Manages class batches, daily student attendance, exams, assessments, and marks entry.",
    isSystem: true,
  },
  {
    name: "COUNSELOR",
    displayName: "Admission Counselor",
    description: "Tracks student inquiries, follow-up CRM leads, and handles prospective admissions.",
    isSystem: true,
  },
  {
    name: "STAFF",
    displayName: "Support Staff",
    description: "General campus operational staff with view access to students, batches, and attendance.",
    isSystem: true,
  },
  {
    name: "STUDENT",
    displayName: "Student",
    description: "Enrolled student with access to course schedule, attendance history, marks, and fees.",
    isSystem: true,
  },
  {
    name: "PARENT",
    displayName: "Parent / Guardian",
    description: "Guardian portal to monitor child's academic progress, attendance, and fee dues.",
    isSystem: true,
  },
];


for (const code of NEW_PERMISSION_CODES) STANDARD_PERMISSIONS.push({ code, name: code.replace(/[.-]/g, " "), module: code.split(".")[0], description: "Access control for " + code });
