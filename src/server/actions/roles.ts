"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";

// =========================================================================
// ADDITIVE PERMISSION CATALOG INITIALIZATION
// =========================================================================
import { syncPermissionCatalog } from "@/lib/permission-catalog";

export async function ensureStandardPermissionsAndRoles() {
  await requirePermission("users.role");
  await syncPermissionCatalog();
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
    await syncPermissionCatalog();
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

  await syncPermissionCatalog();
  return db.permission.findMany({ orderBy: [{ module: "asc" }, { code: "asc" }] });
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

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  return { success: true };
}
