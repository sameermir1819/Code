"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "./audit";
import { getActiveCampusId } from "./campus";

export async function getStudents({
  search = "",
  status = "",
  gradeClass = "",
  page = 1,
  limit = 10,
}: {
  search?: string;
  status?: string;
  gradeClass?: string;
  page?: number;
  limit?: number;
} = {}) {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"]);

  const campusId = await getActiveCampusId();
  const where: Record<string, unknown> = {};

  if (campusId) {
    where.instituteId = campusId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { studentId: { contains: search } },
      { admissionNo: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ];
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (gradeClass && gradeClass !== "ALL") {
    where.gradeClass = gradeClass;
  }

  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    db.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        parent: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            course: true,
            batch: true,
          },
          take: 1,
        },
        _count: {
          select: {
            attendances: true,
            payments: true,
          },
        },
      },
    }),
    db.student.count({ where }),
  ]);

  return {
    students,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getStudentById(id: string) {
  const session = await requireAuth();

  // Security check: if student, can only view own profile
  if (session.role === "STUDENT" && session.studentId !== id) {
    throw new Error("FORBIDDEN: You can only view your own student profile");
  }

  const student = await db.student.findUnique({
    where: { id },
    include: {
      parent: true,
      session: true,
      enrollments: {
        include: {
          course: true,
          batch: true,
        },
        orderBy: { createdAt: "desc" },
      },
      attendances: {
        orderBy: { date: "desc" },
        take: 30,
        include: {
          batch: true,
        },
      },
      feePlans: {
        include: {
          installments: {
            orderBy: { installmentNumber: "asc" },
          },
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        include: {
          feePlan: true,
        },
      },
      marks: {
        include: {
          exam: {
            include: {
              subject: true,
              batch: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Calculate attendance summary
  const totalAttendance = student.attendances.length;
  const presentCount = student.attendances.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

  return {
    ...student,
    attendanceRate,
  };
}

export async function createStudent(data: {
  name: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender: string;
  address?: string;
  city?: string;
  state?: string;
  emergencyContact?: string;
  schoolCollege?: string;
  gradeClass?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentRelation?: string;
  status?: string;
  notes?: string;
}) {
  await requireAuth(["SUPER_ADMIN", "ADMIN"]);

  // Get active campus
  const campusId = await getActiveCampusId();
  if (!campusId) throw new Error("No active campus found.");

  // Generate unique Student ID & Admission No
  const count = await db.student.count();
  const year = new Date().getFullYear();
  const studentId = `STU-${year}-${String(count + 1).padStart(4, "0")}`;
  const admissionNo = `ADM-${year}-${String(count + 1).padStart(4, "0")}`;

  let parentId: string | null = null;
  if (data.parentName && data.parentPhone) {
    // Check or create parent
    const existingParent = await db.parent.findFirst({
      where: { phone: data.parentPhone },
    });
    if (existingParent) {
      parentId = existingParent.id;
    } else {
      const parent = await db.parent.create({
        data: {
          name: data.parentName,
          phone: data.parentPhone,
          email: data.parentEmail || null,
          relation: data.parentRelation || "Father",
          address: data.address || null,
        },
      });
      parentId = parent.id;
    }
  }

  const student = await db.student.create({
    data: {
      instituteId: campusId,
      studentId,
      admissionNo,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      dob: data.dob ? new Date(data.dob) : null,
      gender: data.gender || "MALE",
      address: data.address || null,
      city: data.city || "New Delhi",
      state: data.state || "Delhi",
      emergencyContact: data.emergencyContact || null,
      schoolCollege: data.schoolCollege || null,
      gradeClass: data.gradeClass || "Class 11",
      parentId,
      status: data.status || "ACTIVE",
      notes: data.notes || null,
    },
  });

  await logAudit({
    action: "STUDENT_CREATED",
    entity: "Student",
    entityId: student.id,
    details: `Student created: ${student.name} (${student.studentId})`,
  });

  return { success: true, student };
}

export async function updateStudent(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    dob: string;
    gender: string;
    address: string;
    city: string;
    state: string;
    emergencyContact: string;
    schoolCollege: string;
    gradeClass: string;
    status: string;
    notes: string;
  }>
) {
  await requireAuth(["SUPER_ADMIN", "ADMIN"]);

  const updated = await db.student.update({
    where: { id },
    data: {
      ...data,
      dob: data.dob ? new Date(data.dob) : undefined,
    },
  });

  await logAudit({
    action: "STUDENT_UPDATED",
    entity: "Student",
    entityId: id,
    details: `Student updated: ${updated.name} (${updated.studentId})`,
  });

  return { success: true, student: updated };
}

export async function deleteStudent(id: string) {
  await requireAuth(["SUPER_ADMIN"]);

  // Check if financial records exist
  const paymentCount = await db.payment.count({ where: { studentId: id } });
  if (paymentCount > 0) {
    throw new Error(
      "Cannot delete student with existing payment/fee transactions. Mark as INACTIVE or DROPPED instead to preserve audit and financial integrity."
    );
  }

  const student = await db.student.delete({ where: { id } });

  await logAudit({
    action: "STUDENT_DELETED",
    entity: "Student",
    entityId: id,
    details: `Student deleted: ${student.name} (${student.studentId})`,
  });

  return { success: true };
}

export async function enrollStudentInBatch(
  studentId: string,
  batchId: string,
  courseId: string
) {
  await requireAuth(["SUPER_ADMIN", "ADMIN"]);

  // Close any previous active enrollment
  await db.enrollment.updateMany({
    where: { studentId, status: "ACTIVE" },
    data: { status: "TRANSFERRED", endDate: new Date() },
  });

  // Create new enrollment
  const enrollment = await db.enrollment.create({
    data: {
      studentId,
      batchId,
      courseId,
      status: "ACTIVE",
      startDate: new Date(),
    },
    include: { batch: true, course: true },
  });

  await logAudit({
    action: "STUDENT_ENROLLED",
    entity: "Enrollment",
    entityId: enrollment.id,
    details: `Student enrolled in batch: ${enrollment.batch.name} (${enrollment.course.name})`,
  });

  return { success: true, enrollment };
}

export async function updateStudentParent(
  studentId: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    relation?: string;
    occupation?: string;
  }
) {
  await requireAuth(["SUPER_ADMIN", "ADMIN"]);

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { parentId: true },
  });

  if (student?.parentId) {
    await db.parent.update({
      where: { id: student.parentId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        relation: data.relation || "Father",
        occupation: data.occupation || null,
      },
    });
  } else {
    const parent = await db.parent.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        relation: data.relation || "Father",
        occupation: data.occupation || null,
      },
    });
    await db.student.update({
      where: { id: studentId },
      data: { parentId: parent.id },
    });
  }

  return { success: true };
}
