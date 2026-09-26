import { db } from "./db";
import type { SessionUser } from "./permissions";
import type { Prisma } from "@prisma/client";
import { authorizedCampusId } from "./campus-scope";
import { getActiveCampusId } from "@/server/actions/campus";

export async function materialAccessWhere(session: SessionUser): Promise<Prisma.StudyMaterialWhereInput> {
  if (session.role === "STUDENT" && session.studentId) {
    const enrollments = await db.enrollment.findMany({ where: { studentId: session.studentId, status: "ACTIVE" }, select: { courseId: true, batchId: true } });
    return { OR: [
      { batchId: { in: enrollments.map((e) => e.batchId) } },
      { batchId: null, courseId: { in: enrollments.map((e) => e.courseId) } },
      { assignedTo: { some: { studentId: session.studentId } } },
      { batchId: null, courseId: null },
    ] };
  }
  if (!["STUDENT", "PARENT"].includes(session.role)) {
    return {};
  }
  return { id: { in: [] } };
}
