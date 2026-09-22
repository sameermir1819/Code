import { getBatches, getCourses, getTeachers, getSubjects } from "@/server/actions/academics";
import { getSession } from "@/lib/auth";
import { BatchesManager } from "@/components/academics/batches-manager";

export const dynamic = "force-dynamic";

export default async function DashboardBatchesPage() {
  const [batches, courses, teachers, subjects, session] = await Promise.all([
    getBatches(),
    getCourses(),
    getTeachers(),
    getSubjects(),
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

