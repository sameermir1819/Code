import { getUsers } from "@/server/actions/users";
import { getSubjects } from "@/server/actions/academics";
import { getRoles, getAllPermissions } from "@/server/actions/roles";
import { getActiveCampus, getAllCampuses } from "@/server/actions/campus";
import { getSession } from "@/lib/auth";
import { UsersTable } from "@/components/users/users-table";
import { Role } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [session, subjects, roles, allPermissions, campuses, activeCampus] = await Promise.all([
    getSession(),
    getSubjects(),
    getRoles(),
    getAllPermissions(),
    getAllCampuses(),
    getActiveCampus(),
  ]);
  const initialCampusId = activeCampus?.id || "ALL";
  const initialData = await getUsers({ page: 1, limit: 20, campusId: initialCampusId });

  const actorRole: Role = (session?.role as Role) || "SUPER_ADMIN";

  return (
    <UsersTable
      initialData={initialData}
      actorRole={actorRole}
      availableSubjects={subjects}
      initialRoles={roles}
      allPermissions={allPermissions}
      availableCampuses={campuses}
      initialCampusId={initialCampusId}
    />
  );
}
