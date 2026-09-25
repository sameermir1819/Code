"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";
import { redactRelatedData } from "@/lib/redact-related-data";
import { requireAuth, getEffectivePermissions } from "@/lib/auth";
import { logAudit } from "./audit";
import { getActiveCampusId } from "./campus";
import { createStudentUser } from "@/lib/student-user";
import { authorizedCampusId } from "@/lib/campus-scope";

export async function getStudents({
  search = "",
  status = "",
  gradeClass = "",
  campusId,
  page = 1,
  limit = 10,
}: {
  search?: string;
  status?: string;
  gradeClass?: string;
  campusId?: string;
  page?: number;
  limit?: number;
} = {}) {
  await requireStaffPermission("students.view");

  const selectedCampusId = campusId === undefined ? await getActiveCampusId() : campusId;
  const where: Record<string, unknown> = {};

  if (selectedCampusId && selectedCampusId !== "ALL") {
    where.instituteId = selectedCampusId;
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

/**
 * Fast aggregate KPI statistics for Students Directory (runs in <15ms)
 */
export async function getStudentStats(campusId?: string) {
  await requireStaffPermission("students.view");
  const selectedCampusId = campusId === undefined ? await getActiveCampusId() : campusId;
  const campusFilter = selectedCampusId && selectedCampusId !== "ALL"
    ? { instituteId: selectedCampusId }
    : {};

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalStudents, activeStudents, newThisMonth, needsAttention] = await Promise.all([
    db.student.count({ where: campusFilter }),
    db.student.count({ where: { ...campusFilter, status: "ACTIVE" } }),
    db.student.count({ where: { ...campusFilter, admissionDate: { gte: thisMonthStart } } }),
    db.student.count({
      where: {
        ...campusFilter,
        status: { in: ["INACTIVE", "SUSPENDED"] },
      },
    }),
  ]);

  return {
    totalStudents,
    activeStudents,
    newThisMonth,
    needsAttention,
  };
}

export async function getStudentById(id: string) {
  const session = await requireStaffPermission("students.view");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

  // Security check: if student, can only view own profile
  if (session.role === "STUDENT" && session.studentId !== id) {
    throw new Error("FORBIDDEN: You can only view your own student profile");
  }

  const student = await db.student.findUnique({
    where: { id, instituteId },
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
    ...redactRelatedData(student, await getEffectivePermissions(session)),
    attendanceRate: (await getEffectivePermissions(session)).includes("attendance.view") ? attendanceRate : 0,
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
  await requireStaffPermission("students.create");

  // Get active campus
  const campusId = await getActiveCampusId();
  if (!campusId) throw new Error("No active campus found.");

  // Generate unique Student ID & Admission No
  const count = await db.student.count();
  const year = new Date().getFullYear();
  const studentId = `STU-${year}-${String(count + 1).padStart(4, "0")}`;
  const admissionNo = `ADM-${year}-${String(count + 1).padStart(4, "0")}`;

  const student = await db.$transaction(async (tx) => {
    let parentId: string | null = null;
    if (data.parentName && data.parentPhone) {
      const existingParent = await tx.parent.findFirst({
        where: { phone: data.parentPhone },
      });
      if (existingParent) {
        parentId = existingParent.id;
      } else {
        const parent = await tx.parent.create({
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

    const created = await tx.student.create({
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
    await createStudentUser(tx, created);
    return created;
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
    admissionDate: string;
    gender: string;
    address: string;
    city: string;
    state: string;
    emergencyContact: string;
    schoolCollege: string;
    gradeClass: string;
    status: string;
    notes: string;
    instituteId: string;
    batchId: string;
  }>
) {
  const actor = await requireStaffPermission("students.update");
  const currentCampusId = authorizedCampusId(actor, await getActiveCampusId());

  const updated = await db.$transaction(async (tx) => {
    const { instituteId: requestedInstituteId, batchId, ...studentData } = data;
    const existing = await tx.student.findUnique({
      where: { id, instituteId: currentCampusId },
      select: { instituteId: true, userId: true },
    });
    if (!existing) throw new Error("Student not found");
    if (
      requestedInstituteId &&
      actor.role !== "SUPER_ADMIN" &&
      actor.instituteId &&
      requestedInstituteId !== actor.instituteId
    ) {
      throw new Error("You can only assign students to your assigned campus.");
    }

    const instituteId = authorizedCampusId(
      actor,
      requestedInstituteId || existing.instituteId
    );
    const campusChanged = instituteId !== existing.instituteId;
    const currentEnrollment = await tx.enrollment.findFirst({
      where: { studentId: id, status: "ACTIVE" },
      select: { batchId: true },
    });
    const batchChanged = batchId !== undefined && batchId !== (currentEnrollment?.batchId || "");

    let selectedBatch: { id: string; courseId: string; name: string } | null = null;
    if (batchChanged && batchId) {
      selectedBatch = await tx.batch.findFirst({
        where: { id: batchId, instituteId, status: "ACTIVE" },
        select: { id: true, courseId: true, name: true },
      });
      if (!selectedBatch) {
        throw new Error("Selected batch must be active and belong to the student's selected campus.");
      }
    }
    if (campusChanged && !selectedBatch) {
      throw new Error("Select an active batch from the new campus before moving this student.");
    }

    const student = await tx.student.update({
      where: { id },
      data: {
        ...studentData,
        instituteId,
        dob: data.dob ? new Date(data.dob) : undefined,
        admissionDate: data.admissionDate ? new Date(data.admissionDate) : undefined,
      },
    });
    if (data.name || data.phone !== undefined || data.status || campusChanged) {
      await tx.user.updateMany({
        where: { student: { is: { id } } },
        data: {
          instituteId,
          name: data.name,
          phone: data.phone !== undefined ? data.phone?.trim() || null : undefined,
          status: data.status
            ? data.status === "ACTIVE"
              ? "ACTIVE"
              : data.status === "SUSPENDED"
                ? "SUSPENDED"
                : "INACTIVE"
            : undefined,
        },
      });
    }

    if (selectedBatch) {
      await tx.enrollment.updateMany({
        where: { studentId: id, status: "ACTIVE" },
        data: { status: "TRANSFERRED", endDate: new Date() },
      });
      await tx.enrollment.create({
        data: {
          studentId: id,
          batchId: selectedBatch.id,
          courseId: selectedBatch.courseId,
          status: "ACTIVE",
          startDate: new Date(),
        },
      });
    }
    return student;
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
  const session = await requireStaffPermission("students.delete");
  await requireAuth(["SUPER_ADMIN"]);
  const instituteId = authorizedCampusId(session, await getActiveCampusId());
  const existingStudent = await db.student.findFirst({
    where: { id, instituteId },
    select: { id: true },
  });
  if (!existingStudent) throw new Error("Student not found");

  // Check if financial records exist
  const paymentCount = await db.payment.count({ where: { studentId: id } });
  if (paymentCount > 0) {
    throw new Error(
      "Cannot delete student with existing payment/fee transactions. Mark as INACTIVE or DROPPED instead to preserve audit and financial integrity."
    );
  }

  const student = await db.$transaction(async (tx) => {
    await tx.testSeriesRegistration.deleteMany({ where: { studentId: id } });
    const record = await tx.student.delete({ where: { id } });
    if (record.userId) {
      await tx.user.delete({ where: { id: record.userId } });
    }
    return record;
  });

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
  const session = await requireStaffPermission("students.update");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());
  const [student, batch, course] = await Promise.all([
    db.student.findFirst({ where: { id: studentId, instituteId }, select: { id: true } }),
    db.batch.findFirst({
      where: { id: batchId, instituteId, courseId },
      select: { id: true },
    }),
    db.course.findFirst({ where: { id: courseId, instituteId }, select: { id: true } }),
  ]);
  if (!student || !batch || !course) {
    throw new Error("Student, batch, or course does not belong to the active campus.");
  }

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
  const session = await requireStaffPermission("students.update");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

  const student = await db.student.findFirst({
    where: { id: studentId, instituteId },
    select: { parentId: true },
  });
  if (!student) throw new Error("Student not found");

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
