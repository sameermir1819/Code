import { notFound } from "next/navigation";
import { getBatchById, getTeachers, getSubjects } from "@/server/actions/academics";
import { getSession, getEffectivePermissions, requireStaffPermission } from "@/lib/auth";
import { BatchDetailView } from "@/components/academics/batch-detail-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface BatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardBatchDetailPage({ params }: BatchPageProps) {
  const { id } = await params;
  const actor = await requireStaffPermission("batches.view");
  const permissions = await getEffectivePermissions(actor);
  const [batch, teachers, subjects, session] = await Promise.all([
    getBatchById(id),
    permissions.includes("teachers.view") ? getTeachers() : Promise.resolve([]),
    permissions.includes("courses.view") ? getSubjects() : Promise.resolve([]),
    getSession(),
  ]);

  if (!batch) {
    notFound();
  }

  return (
    <BatchDetailView
      batch={batch}
      allTeachers={teachers}
      allSubjects={subjects}
      userRole={session?.role || "ADMIN"}
    />
  );
}

