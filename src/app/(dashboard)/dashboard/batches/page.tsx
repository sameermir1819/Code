import { getBatches, getCourses, getTeachers, getSubjects } from "@/server/actions/academics";
import { getSession, getEffectivePermissions, requireStaffPermission } from "@/lib/auth";
import { BatchesManager } from "@/components/academics/batches-manager";
import { getAllCampuses } from "@/server/actions/campus";

export const dynamic = "force-dynamic";

export default async function DashboardBatchesPage() {
  const actor = await requireStaffPermission("batches.view");
  const permissions = await getEffectivePermissions(actor);
  const campuses = await getAllCampuses();
  const visibleCampuses = campuses;
  const initialCampusId = "GLOBAL";
  const [batches, courses, teachers, subjects, session] = await Promise.all([
    getBatches({ campusId: initialCampusId }),
    permissions.includes("courses.view") ? getCourses(initialCampusId) : Promise.resolve([]),
    permissions.includes("teachers.view") ? getTeachers({ campusId: initialCampusId }) : Promise.resolve([]),
    permissions.includes("courses.view") ? getSubjects() : Promise.resolve([]),
    getSession(),
  ]);

  return (
    <BatchesManager
      initialBatches={batches}
      courses={courses}
      teachers={teachers}
      allSubjects={subjects}
      userRole={session?.role || "ADMIN"}
      availableCampuses={visibleCampuses}
      initialCampusId={initialCampusId}
      canViewTeachers={permissions.includes("teachers.view")}
    />
  );
}

