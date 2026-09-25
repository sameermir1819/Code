import type { Prisma, Student } from "@prisma/client";
import { hashPassword } from "@/lib/auth";

type StudentAccountSource = Pick<
  Student,
  "id" | "instituteId" | "name" | "email" | "phone" | "studentId" | "status"
>;

export async function createStudentUser(
  tx: Prisma.TransactionClient,
  student: StudentAccountSource
) {
  const preferredEmail = student.email?.trim().toLowerCase();
  const emailInUse = preferredEmail
    ? await tx.user.findUnique({ where: { email: preferredEmail }, select: { id: true } })
    : null;
  const accountEmail = emailInUse
    ? `${student.studentId.toLowerCase()}@student.local`
    : preferredEmail || `${student.studentId.toLowerCase()}@student.local`;

  const accountEmailInUse = await tx.user.findUnique({
    where: { email: accountEmail },
    select: { id: true },
  });
  if (accountEmailInUse) {
    throw new Error(`Cannot create the student account because "${accountEmail}" is already in use.`);
  }

  const status =
    student.status === "ACTIVE"
      ? "ACTIVE"
      : student.status === "SUSPENDED"
        ? "SUSPENDED"
        : "INACTIVE";
  const institute = await tx.institute.findUnique({
    where: { id: student.instituteId },
    select: { name: true },
  });
  const user = await tx.user.create({
    data: {
      name: student.name,
      email: accountEmail,
      phone: student.phone,
      passwordHash: await hashPassword(student.studentId),
      role: "STUDENT",
      status,
      instituteId: student.instituteId,
      branch: institute?.name || null,
      student: { connect: { id: student.id } },
    },
  });

  const studentRole = await tx.role.findUnique({ where: { name: "STUDENT" } });
  if (studentRole) {
    await tx.userRole.create({
      data: { userId: user.id, roleId: studentRole.id },
    });
  }

  return user;
}
