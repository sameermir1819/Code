import { getEffectivePermissions, getSession, requireStaffPermission } from "@/lib/auth";
import { getSubjects, getTeachers } from "@/server/actions/academics";
import { FacultyManager } from "@/components/faculty/faculty-manager";
import { getAllCampuses } from "@/server/actions/campus";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Faculty & Instructors — Futurex Learning",
  description: "Manage teaching staff profiles, academic specializations, and batch assignments.",
};

export default async function FacultyPage() {
  const actor = await requireStaffPermission("teachers.view");
  const session = await getSession();
  if (!session) redirect("/login");

  const [teachers, subjects, campuses] = await Promise.all([
    getTeachers(),
    getSubjects(),
    getAllCampuses(),
  ]);
  const permissions = await getEffectivePermissions(actor);

  return (
    <FacultyManager
      initialTeachers={teachers as any}
      allSubjects={subjects as any}
      userRole={session.role}
      canManageSubjects={permissions.includes("courses.manage")}
      availableCampuses={campuses}
    />
  );
}
