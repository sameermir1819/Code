"use server";
import { requirePermission, requireStaffPermission } from "@/lib/auth";

import { redactRelatedData } from "@/lib/redact-related-data";
import { db } from "@/lib/db";
import { getEffectivePermissions, requireAuth, verifyPassword, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getActiveCampusId } from "./campus";

import { cache } from "react";

/**
 * Resolves the Student record for the current session.
 * Supports auto-linking if a student with the same email or userId exists.
 * If user is an Admin / Staff previewing the portal, returns the first student for preview.
 */
const fetchCachedCurrentStudent = cache(async () => {
  const session = await requireAuth();

  let student = null;

  if (session.role === "SUPER_ADMIN" || session.role === "ADMIN") {
    await requireStaffPermission("students.view");
    const instituteId = await getActiveCampusId();
    student = await db.student.findFirst({
      where: { status: "ACTIVE", instituteId },
      include: {
        institute: true,
        parent: true,
        session: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { student, session };
  }

  // 1. Direct match by session studentId
  if (session.studentId) {
    student = await db.student.findUnique({
      where: { id: session.studentId },
      include: {
        institute: true,
        parent: true,
        session: true,
      },
    });
  }

  // 2. Match by userId
  if (!student) {
    student = await db.student.findFirst({
      where: { userId: session.id },
      include: {
        institute: true,
        parent: true,
        session: true,
      },
    });
  }

  // 3. Match by email (and link user if unlinked)
  if (!student && session.email) {
    student = await db.student.findFirst({
      where: { email: session.email },
      include: {
        institute: true,
        parent: true,
        session: true,
      },
    });

    if (student && !student.userId) {
      await db.student.update({
        where: { id: student.id },
        data: { userId: session.id },
      });
    }
  }

  return { student, session };
});

export async function resolveCurrentStudent() {
  return await fetchCachedCurrentStudent();
}

/**
 * Returns summary data for the student dashboard overview
 */
export async function getStudentPortalOverview() {
  const { student, session } = await resolveCurrentStudent();

  if (!student) {
    return {
      success: false,
      error: "No student record linked to your account. Please contact institute administration.",
      data: null,
      isPreview: false,
    };
  }

  const isPreview = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  const permissions = await getEffectivePermissions(session);
  if (["batches.view", "timetable.view", "attendance.view", "fees.view", "results.view", "materials.view", "announcements.view"].some((code) => !permissions.includes(code as any))) {
    return { success: false, data: null, isPreview, error: "Overview includes restricted sections. Open an available module from navigation." };
  }

  // Pre-fetch active enrollments to reuse for materials count without extra subqueries
  const enrollments = await db.enrollment.findMany({
    where: {
      studentId: student.id,
      status: "ACTIVE",
      batch: { instituteId: student.instituteId },
      course: { instituteId: student.instituteId },
    },
    include: {
      batch: {
        include: {
          teachers: {
            include: { teacher: true },
          },
          timetableSlots: {
            include: { subject: true, teacher: true },
            orderBy: { startTime: "asc" },
          },
          _count: {
            select: {
              timetableSlots: true,
              studyMaterials: true,
            },
          },
        },
      },
      course: true,
    },
  });

  const enrolledBatchIds = enrollments.map((e) => e.batchId).filter(Boolean);
  const enrolledCourseIds = enrollments.map((e) => e.courseId).filter(Boolean);

  // Parallel fetches for remaining widgets
  const [
    attendances,
    feePlans,
    payments,
    marks,
    announcements,
    studyMaterialsCount,
  ] = await Promise.all([
    // Attendance records
    db.attendance.findMany({
      where: {
        studentId: student.id,
        batch: { instituteId: student.instituteId },
      },
      orderBy: { date: "desc" },
      take: 60,
      include: {
        batch: true,
      },
    }),

    // Fee plans
    db.feePlan.findMany({
      where: { studentId: student.id },
      include: {
        installments: {
          orderBy: { installmentNumber: "asc" },
        },
      },
    }),

    // Recent payments
    db.payment.findMany({
      where: { studentId: student.id, status: { in: ["SUCCESS", "ADJUSTED", "REFUNDED"] } },
      orderBy: { paymentDate: "desc" },
      take: 5,
    }),

    // Exam marks & reports
    db.marks.findMany({
      where: {
        studentId: student.id,
        exam: { batch: { instituteId: student.instituteId } },
      },
      include: {
        exam: {
          include: {
            subject: true,
            batch: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),

    // Announcements
    db.announcement.findMany({
      where: {
        AND: [
          { targetRole: { in: ["STUDENT", "ALL"] } },
          {
            OR: [
              { batchId: null, courseId: null },
              ...(enrolledBatchIds.length > 0
                ? [{ batchId: { in: enrolledBatchIds } }]
                : []),
              ...(enrolledCourseIds.length > 0
                ? [{ courseId: { in: enrolledCourseIds } }]
                : []),
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    // Study materials count (reusing pre-fetched IDs, 0 redundant DB calls)
    db.studyMaterial.count({
      where: {
        OR: [
          ...(enrolledBatchIds.length > 0 ? [{ batchId: { in: enrolledBatchIds } }] : []),
          ...(enrolledCourseIds.length > 0 ? [{ batchId: null, courseId: { in: enrolledCourseIds } }] : []),
          { assignedTo: { some: { studentId: student.id } } },
          { batchId: null, courseId: null },
        ],
      },
    }),
  ]);

  // Attendance stats
  const totalClasses = attendances.length;
  const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendances.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a) => a.status === "LATE").length;
  const attendanceRate = totalClasses > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalClasses) * 100) : 100;

  // Fee totals
  const totalFees = feePlans.reduce((sum, p) => sum + p.finalAmount, 0);
  const paidFees = feePlans.reduce((sum, p) => sum + p.paidAmount, 0);
  const balanceFees = Math.max(0, totalFees - paidFees);

  return {
    success: true,
    isPreview,
    data: {
      student,
      enrollments,
      attendanceStats: {
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate,
        recent: attendances.slice(0, 10),
      },
      feeSummary: {
        totalFees,
        paidFees,
        balanceFees,
        feePlans,
        recentPayments: payments,
      },
      recentMarks: marks,
      announcements,
      studyMaterialsCount,
    },
  };
}

/**
 * Returns full attendance records for student
 */
export async function getStudentAttendanceRecords() {
  await requirePermission("attendance.view");
  const { student } = await resolveCurrentStudent();
  if (!student) return { success: false, data: [] };

  const records = await db.attendance.findMany({
    where: {
      studentId: student.id,
      batch: { instituteId: student.instituteId },
    },
    orderBy: { date: "desc" },
    include: {
      batch: true,
    },
  });

  return { success: true, data: records, student };
}

/**
 * Returns all exams, marks and results for the student
 */
export async function getStudentExamsAndResults() {
  await requirePermission("results.view");
  const { student } = await resolveCurrentStudent();
  if (!student) return { success: false, data: [] };

  const marks = await db.marks.findMany({
    where: {
      studentId: student.id,
      exam: { batch: { instituteId: student.instituteId } },
    },
    include: {
      exam: {
        include: {
          subject: true,
          batch: true,
        },
      },
    },
    orderBy: { exam: { examDate: "desc" } },
  });

  return { success: true, data: marks, student };
}

/**
 * Returns student fee ledger with installments and payment receipts
 */
export async function getStudentFeeLedger() {
  await requirePermission("fees.view");
  const { student } = await resolveCurrentStudent();
  if (!student) return { success: false, data: null };

  const [feePlans, payments] = await Promise.all([
    db.feePlan.findMany({
      where: { studentId: student.id },
      include: {
        enrollment: {
          include: { course: true, batch: true },
        },
        installments: {
          orderBy: { installmentNumber: "asc" },
        },
      },
    }),
    db.payment.findMany({
      where: { studentId: student.id, status: { in: ["SUCCESS", "ADJUSTED", "REFUNDED"] } },
      orderBy: { paymentDate: "desc" },
      include: {
        refunds: true,
        feePlan: true,
        installment: true,
      },
    }),
  ]);

  return {
    success: true,
    student,
    data: {
      feePlans,
      payments,
    },
  };
}

/**
 * Returns study materials assigned to the student's batches and courses
 */
export async function getStudentStudyMaterials() {
  await requirePermission("materials.view");
  const { student } = await resolveCurrentStudent();
  if (!student) return { success: false, data: [] };

  const enrollments = await db.enrollment.findMany({
    where: {
      studentId: student.id,
      status: "ACTIVE",
      batch: { instituteId: student.instituteId },
      course: { instituteId: student.instituteId },
    },
  });

  const batchIds = enrollments.map((e) => e.batchId).filter(Boolean) as string[];
  const courseIds = enrollments.map((e) => e.courseId).filter(Boolean) as string[];

  const materials = await db.studyMaterial.findMany({
    where: {
      OR: [
        { batchId: { in: batchIds } },
        { batchId: null, courseId: { in: courseIds } },
        { assignedTo: { some: { studentId: student.id } } },
        { batchId: null, courseId: null },
      ],
    },
    include: {
      course: true,
      batch: true,
      subject: true,
      uploadedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: materials, student };
}

/**
 * Update student password securely
 */
export async function updateStudentPassword(formData: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const session = await requireAuth();

  if (!formData.newPassword || formData.newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  if (formData.newPassword !== formData.confirmPassword) {
    return { success: false, error: "New passwords do not match." };
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
  });

  if (!user) {
    return { success: false, error: "User account not found." };
  }

  let isValid = false;
  if (user.passwordHash) {
    isValid = await verifyPassword(formData.currentPassword, user.passwordHash);
  }

  if (!isValid) {
    return { success: false, error: "Incorrect current password." };
  }

  const newHash = await hashPassword(formData.newPassword);
  await db.user.update({
    where: { id: session.id },
    data: { passwordHash: newHash },
  });

  revalidatePath("/portal/profile");
  return { success: true };
}

/**
 * Returns all active batches and unified weekly timetable for the enrolled student
 */
export async function getStudentBatches() {
  await requirePermission("batches.view");
  const { student, session } = await resolveCurrentStudent();

  if (!student) {
    return {
      success: false,
      error: "No student profile linked to your account. Please contact campus administration.",
      data: null,
      isPreview: false,
    };
  }

  const isPreview = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  const enrollments = await db.enrollment.findMany({
    where: {
      studentId: student.id,
      status: "ACTIVE",
      batch: { instituteId: student.instituteId },
      course: { instituteId: student.instituteId },
    },
    include: {
      course: {
        include: {
          subjects: {
            include: { subject: true },
          },
        },
      },
      batch: {
        include: {
          teachers: {
            include: {
              teacher: {
                include: {
                  subjects: {
                    include: { subject: true },
                  },
                },
              },
            },
          },
          timetableSlots: {
            include: {
              subject: true,
              teacher: true,
            },
            orderBy: [
              { dayOfWeek: "asc" },
              { startTime: "asc" },
            ],
          },
          _count: {
            select: {
              timetableSlots: true,
              studyMaterials: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    isPreview,
    student,
    data: {
      enrollments: redactRelatedData(enrollments, await getEffectivePermissions(session)),
    },
  };
}

/**
 * Returns full batch details for an enrolled student (or admin preview),
 * including weekly timetable schedule, assigned faculty, and study materials.
 */
export async function getStudentBatchDetails(batchId: string) {
  await requirePermission("batches.view");
  const { student, session } = await resolveCurrentStudent();

  if (!student) {
    return {
      success: false,
      error: "No student profile linked to your account. Please contact campus administration.",
      data: null,
      isPreview: false,
    };
  }

  const isPreview = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  // Check enrollment unless staff preview
  if (!isPreview) {
    const isEnrolled = await db.enrollment.findFirst({
      where: {
        studentId: student.id,
        batchId: batchId,
        batch: { instituteId: student.instituteId },
      },
    });

    if (!isEnrolled) {
      return {
        success: false,
        error: "You are not enrolled in this batch.",
        data: null,
        isPreview: false,
      };
    }
  }

  const batch = await db.batch.findFirst({
    where: { id: batchId, instituteId: student.instituteId },
    include: {
      course: {
        include: {
          subjects: {
            include: { subject: true },
          },
        },
      },
      teachers: {
        include: {
          teacher: {
            include: {
              subjects: {
                include: { subject: true },
              },
            },
          },
        },
      },
      timetableSlots: {
        include: {
          subject: true,
          teacher: true,
        },
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      },
      studyMaterials: {
        include: {
          subject: true,
          uploadedBy: true,
        },
        orderBy: { createdAt: "desc" },
      },
      session: true,
      _count: {
        select: {
          enrollments: true,
          timetableSlots: true,
          studyMaterials: true,
        },
      },
    },
  });

  if (!batch) {
    return {
      success: false,
      error: "Batch not found or no longer active.",
      data: null,
      isPreview,
    };
  }

  // Also include course-wide study materials for this batch's course
  const courseMaterials = await db.studyMaterial.findMany({
    where: {
      courseId: batch.courseId,
      batchId: null,
    },
    include: {
      subject: true,
      uploadedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Combine materials, prioritizing batch-specific ones
  const allMaterials = [
    ...batch.studyMaterials,
    ...courseMaterials.filter((cm) => !batch.studyMaterials.some((bm) => bm.id === cm.id)),
  ];

  return {
    success: true,
    isPreview,
    student,
    data: {
      batch: {
        ...redactRelatedData(batch, await getEffectivePermissions(session)),
        allMaterials: (await getEffectivePermissions(session)).includes("materials.view") ? allMaterials : [],
      },
    },
  };
}
