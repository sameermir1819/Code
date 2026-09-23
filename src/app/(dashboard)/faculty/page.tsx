import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getActiveCampusId } from "@/server/actions/campus";
import { getSubjects, getTeachers } from "@/server/actions/academics";
import { FacultyManager } from "@/components/faculty/faculty-manager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Faculty & Instructors — Futurex Learning",
  description: "Manage teaching staff profiles, academic specializations, and batch assignments.",
};

export default async function FacultyPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Auto-sync teachers and fetch campus
  await getTeachers();
  const campusId = await getActiveCampusId();

  const [teachers, subjects] = await Promise.all([
    db.teacher.findMany({
      where: {
        ...(campusId ? { instituteId: campusId } : {}),
      },
      orderBy: { name: "asc" },
      include: {
        subjects: {
          include: { subject: true },
        },
        batches: {
          include: { batch: true },
        },
        timetableSlots: true,
      },
    }),
    getSubjects(),
  ]);

  return (
    <FacultyManager
      initialTeachers={teachers as any}
      allSubjects={subjects as any}
      userRole={session.role}
    />
  );
}
