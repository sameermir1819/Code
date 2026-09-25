import { getBatches, getCourses, getTeachers, getSubjects } from "@/server/actions/academics";
import { getSession, getEffectivePermissions, requireStaffPermission } from "@/lib/auth";
import { BatchesManager } from "@/components/academics/batches-manager";

export const dynamic = "force-dynamic";

export default async function DashboardBatchesPage() {
  const actor = await requireStaffPermission("batches.view");
  const permissions = await getEffectivePermissions(actor);
  const [batches, courses, teachers, subjects, session] = await Promise.all([
    getBatches(),
    permissions.includes("courses.view") ? getCourses() : Promise.resolve([]),
    permissions.includes("teachers.view") ? getTeachers() : Promise.resolve([]),
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
    />
  );
}

