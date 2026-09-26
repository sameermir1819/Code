import { getUsers } from "@/server/actions/users";
import { getSubjects } from "@/server/actions/academics";
import { getRoles, getAllPermissions } from "@/server/actions/roles";
import { getActiveCampus, getAllCampuses } from "@/server/actions/campus";
import { getEffectivePermissions, requirePermission } from "@/lib/auth";
import { UsersTable } from "@/components/users/users-table";
import { Role } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const actor = await requirePermission("users.view");
  const effectivePermissions = await getEffectivePermissions(actor);
  const [subjects, roles, allPermissions, campuses, activeCampus] = await Promise.all([
    effectivePermissions.includes("courses.view") ? getSubjects() : Promise.resolve([]),
    getRoles(),
    getAllPermissions(),
    getAllCampuses(),
    getActiveCampus(),
  ]);
  const visibleCampuses = campuses;
  const initialCampusId = "GLOBAL";
  const initialData = await getUsers({ page: 1, limit: 20, campusId: initialCampusId });

  const actorRole: Role = actor.role;

  return (
    <UsersTable
      initialData={initialData}
      actorRole={actorRole}
      availableSubjects={subjects}
      initialRoles={roles}
      allPermissions={allPermissions}
      availableCampuses={visibleCampuses}
      initialCampusId={initialCampusId}
      effectivePermissions={effectivePermissions}
    />
  );
}
