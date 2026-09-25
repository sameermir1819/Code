import { db } from "./db";
import { STANDARD_PERMISSIONS, STANDARD_ROLES } from "./permission-definitions";
import { ROLE_PERMISSIONS, NEW_PERMISSION_CODES } from "./permissions";

// Internal bootstrap, never exported as a public Server Action. Existing role
// assignments are authoritative: only new roles/new module codes get defaults.
export async function syncPermissionCatalog() {
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(73190421)`;
    const existing = new Set((await tx.permission.findMany({ select: { code: true } })).map((p) => p.code));
    for (const permission of STANDARD_PERMISSIONS) {
      await tx.permission.upsert({ where: { code: permission.code }, update: {}, create: permission });
    }
    const permissions = await tx.permission.findMany({ select: { id: true, code: true } });
    for (const definition of STANDARD_ROLES) {
      const oldRole = await tx.role.findUnique({ where: { name: definition.name } });
      const role = oldRole ?? await tx.role.create({ data: definition });
      const defaults = ROLE_PERMISSIONS[definition.name] ?? [];
      const grant = permissions.filter((p) => defaults.includes(p.code as never) &&
        (!oldRole || (!existing.has(p.code) && NEW_PERMISSION_CODES.includes(p.code as never))));
      if (grant.length) await tx.rolePermission.createMany({ data: grant.map((p) => ({ roleId: role.id, permissionId: p.id })), skipDuplicates: true });
    }
  }, { timeout: 30_000 });
}
