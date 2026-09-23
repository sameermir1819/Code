"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";

// =========================================================================
// STANDARD ROLES & PERMISSIONS DEFINITIONS (Self-Healing)
// =========================================================================
const STANDARD_PERMISSIONS = [
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

const STANDARD_ROLES = [
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

const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  SUPER_ADMIN: STANDARD_PERMISSIONS.map((p) => p.code),
  ADMIN: [
    "users.view", "users.create", "users.update", "users.status", "users.activity",
    "students.view", "students.create", "students.update", "students.delete",
    "teachers.view", "teachers.create", "teachers.update",
    "courses.view", "courses.manage", "batches.view", "batches.manage",
    "timetable.view", "timetable.manage",
    "attendance.view", "attendance.manage",
    "fees.view", "fees.create", "fees.update",
    "exams.view", "exams.create", "exams.update", "results.view", "results.manage",
    "reports.view", "settings.view", "settings.manage"
  ],
  ACCOUNTANT: [
    "users.view", "students.view", "fees.view", "fees.create", "fees.update", "reports.view"
  ],
  TEACHER: [
    "users.view", "students.view", "courses.view", "batches.view", "timetable.view",
    "attendance.view", "attendance.manage", "exams.view", "exams.update", "results.view", "results.manage"
  ],
  FACULTY: [
    "users.view", "students.view", "courses.view", "batches.view", "timetable.view",
    "attendance.view", "attendance.manage", "exams.view", "exams.update", "results.view", "results.manage"
  ],
  COUNSELOR: [
    "students.view", "courses.view", "batches.view"
  ],
  STAFF: [
    "students.view", "attendance.view", "batches.view"
  ],
  STUDENT: [
    "courses.view", "batches.view", "timetable.view", "attendance.view", "fees.view", "results.view"
  ],
  PARENT: [
    "attendance.view", "fees.view", "results.view"
  ],
};

export async function ensureStandardPermissionsAndRoles() {
  // Upsert standard permissions
  for (const perm of STANDARD_PERMISSIONS) {
    await db.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        module: perm.module,
        description: perm.description,
      },
      create: {
        code: perm.code,
        name: perm.name,
        module: perm.module,
        description: perm.description,
      },
    });
  }

  // Upsert standard roles
  for (const r of STANDARD_ROLES) {
    await db.role.upsert({
      where: { name: r.name },
      update: {
        displayName: r.displayName,
        description: r.description,
        isSystem: r.isSystem,
      },
      create: {
        name: r.name,
        displayName: r.displayName,
        description: r.description,
        isSystem: r.isSystem,
      },
    });
  }

  // Map role permissions
  const allDbPerms = await db.permission.findMany();
  const permMap = new Map(allDbPerms.map((p) => [p.code, p.id]));
  const allRoles = await db.role.findMany();

  for (const role of allRoles) {
    const codes = ROLE_PERMISSIONS_MAP[role.name] || [];
    for (const code of codes) {
      const permId = permMap.get(code);
      if (permId) {
        await db.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
    }
  }
}

// =========================================================================
// 1. GET ALL ROLES (With Permission Counts & Assigned User Counts)
// =========================================================================
export async function getRoles() {
  await requirePermission("users.view");

  const [roleCount, permCount] = await Promise.all([
    db.role.count(),
    db.permission.count(),
  ]);

  if (permCount === 0 || roleCount === 0) {
    await ensureStandardPermissionsAndRoles();
  }

  // Query active user count per role for complete fidelity across UserRole & User.role
  const userCounts = await db.user.groupBy({
    by: ["role"],
    _count: { id: true },
    where: { isArchived: false },
  });
  const userCountMap = new Map<string, number>();
  userCounts.forEach((c) => userCountMap.set(c.role, c._count.id));

  const roles = await db.role.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    description: r.description,
    isSystem: r.isSystem,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    userCount: Math.max(r._count.users, userCountMap.get(r.name) || 0),
    permissionsCount: r.permissions.length,
    permissions: r.permissions.map((rp) => ({
      id: rp.permission.id,
      code: rp.permission.code,
      name: rp.permission.name,
      module: rp.permission.module,
      description: rp.permission.description,
    })),
  }));
}

// =========================================================================
// 2. GET ALL GRANULAR PERMISSIONS (Grouped by Module)
// =========================================================================
export async function getAllPermissions() {
  await requirePermission("users.view");

  let permissions = await db.permission.findMany({
    orderBy: [{ module: "asc" }, { code: "asc" }],
  });

  if (permissions.length === 0) {
    await ensureStandardPermissionsAndRoles();
    permissions = await db.permission.findMany({
      orderBy: [{ module: "asc" }, { code: "asc" }],
    });
  }

  return permissions;
}

// =========================================================================
// 3. CREATE CUSTOM ROLE
// =========================================================================
export async function createRole(data: {
  name: string;
  displayName: string;
  description?: string;
  permissionCodes: string[];
}) {
  const actor = await requirePermission("users.role");

  // Format code: e.g. "academic head" -> "ACADEMIC_HEAD"
  const rawName = data.name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const name = rawName.replace(/_+/g, "_").replace(/^_+|_+$/g, "");

  if (!name || name.length < 2) {
    throw new Error("Role identifier must be at least 2 characters long.");
  }

  const displayName = data.displayName.trim();
  if (!displayName) {
    throw new Error("Role display title is required.");
  }

  // Check uniqueness
  const existing = await db.role.findUnique({
    where: { name },
  });
  if (existing) {
    throw new Error(`A role with code "${name}" already exists.`);
  }

  const createdRole = await db.$transaction(async (tx) => {
    // 1. Create Role record
    const role = await tx.role.create({
      data: {
        name,
        displayName,
        description: data.description?.trim() || null,
        isSystem: false,
      },
    });

    // 2. Attach permissions
    if (data.permissionCodes && data.permissionCodes.length > 0) {
      const perms = await tx.permission.findMany({
        where: { code: { in: data.permissionCodes } },
      });

      for (const p of perms) {
        await tx.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: p.id,
          },
        });
      }
    }

    return role;
  });

  await logAudit({
    action: "ROLE_CREATED",
    entity: "Role",
    entityId: createdRole.id,
    details: `${actor.name} (${actor.role}) created new custom role: ${createdRole.displayName} (${createdRole.name}) with ${data.permissionCodes?.length || 0} permissions.`,
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  return { success: true, role: createdRole };
}

// =========================================================================
// 4. UPDATE ROLE (Custom or System Role Details & Permissions)
// =========================================================================
export async function updateRole(
  id: string,
  data: {
    displayName?: string;
    description?: string;
    permissionCodes?: string[];
  }
) {
  const actor = await requirePermission("users.role");

  const targetRole = await db.role.findUnique({
    where: { id },
    include: { permissions: true },
  });
  if (!targetRole) {
    throw new Error("Target role not found.");
  }

  // Security Rule: Super Admin role permissions cannot be trimmed by non-Super Admin
  if (targetRole.name === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Only Super Administrators can alter Super Admin role specifications.");
  }

  await db.$transaction(async (tx) => {
    // 1. Update basic info
    await tx.role.update({
      where: { id },
      data: {
        displayName: data.displayName ? data.displayName.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() || null : undefined,
      },
    });

    // 2. If permissionCodes provided, sync RolePermission
    if (data.permissionCodes !== undefined) {
      // Don't accidentally wipe Super Admin permissions
      if (targetRole.name === "SUPER_ADMIN") {
        // Enforce all permissions stay active for super admin
        const allPerms = await tx.permission.findMany();
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        for (const p of allPerms) {
          await tx.rolePermission.create({
            data: { roleId: id, permissionId: p.id },
          });
        }
      } else {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });

        if (data.permissionCodes.length > 0) {
          const perms = await tx.permission.findMany({
            where: { code: { in: data.permissionCodes } },
          });

          for (const p of perms) {
            await tx.rolePermission.create({
              data: { roleId: id, permissionId: p.id },
            });
          }
        }
      }
    }
  });

  await logAudit({
    action: "ROLE_UPDATED",
    entity: "Role",
    entityId: id,
    details: `${actor.name} (${actor.role}) updated role ${targetRole.name}. Permissions count: ${data.permissionCodes?.length ?? targetRole.permissions.length}.`,
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  return { success: true };
}

// =========================================================================
// 5. DELETE CUSTOM ROLE (With Zero-Orphan Protection)
// =========================================================================
export async function deleteRole(id: string) {
  const actor = await requirePermission("users.role");

  const targetRole = await db.role.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  if (!targetRole) {
    throw new Error("Target role not found.");
  }

  // Security Rule: Master SUPER_ADMIN root role can NEVER be deleted
  if (targetRole.name === "SUPER_ADMIN") {
    throw new Error(`FORBIDDEN: The master Super Administrator role is the system root anchor and cannot be deleted.`);
  }

  // Non-Super Admin cannot delete built-in system roles
  if (targetRole.isSystem && actor.role !== "SUPER_ADMIN") {
    throw new Error(`FORBIDDEN: Built-in system role "${targetRole.displayName}" can only be managed or deleted by a Super Administrator.`);
  }

  // Security Rule: Zero Orphan Protection — check active users
  const activeUsersCount = await db.user.count({
    where: {
      role: targetRole.name,
      isArchived: false,
    },
  });

  if (activeUsersCount > 0 || targetRole._count.users > 0) {
    const totalUsers = Math.max(activeUsersCount, targetRole._count.users);
    throw new Error(
      `Cannot delete role "${targetRole.displayName}". There are currently ${totalUsers} user(s) assigned to this role. Please reassign those users to another role before deleting.`
    );
  }

  await db.$transaction(async (tx) => {
    // 1. Delete all role permissions
    await tx.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // 2. Delete any leftover user role links
    await tx.userRole.deleteMany({
      where: { roleId: id },
    });

    // 3. Delete role
    await tx.role.delete({
      where: { id },
    });
  });

  await logAudit({
    action: "ROLE_DELETED",
    entity: "Role",
    entityId: id,
    details: `${actor.name} (${actor.role}) deleted custom role ${targetRole.displayName} (${targetRole.name}).`,
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  return { success: true };
}
