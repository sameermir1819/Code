import { getUsers } from "@/server/actions/users";
import { getSubjects } from "@/server/actions/academics";
import { getRoles, getAllPermissions } from "@/server/actions/roles";
import { getSession } from "@/lib/auth";
import { UsersTable } from "@/components/users/users-table";
import { Role } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [initialData, session, subjects, roles, allPermissions] = await Promise.all([
    getUsers({ page: 1, limit: 20 }),
    getSession(),
    getSubjects(),
    getRoles(),
    getAllPermissions(),
  ]);

  const actorRole: Role = (session?.role as Role) || "SUPER_ADMIN";

  return (
    <UsersTable
      initialData={initialData}
      actorRole={actorRole}
      availableSubjects={subjects}
      initialRoles={roles}
      allPermissions={allPermissions}
    />
  );
}

