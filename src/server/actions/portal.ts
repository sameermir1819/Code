"use server";

import { db } from "@/lib/db";
import { requireAuth, verifyPassword, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { cache } from "react";

/**
 * Resolves the Student record for the current session.
 * Supports auto-linking if a student with the same email or userId exists.
 * If user is an Admin / Staff previewing the portal, returns the first student for preview.
 */
const fetchCachedCurrentStudent = cache(async () => {
  const session = await requireAuth();

  let student = null;

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

  // 4. Admin preview fallback (if Admin views /portal for testing)
  if (!student && (session.role === "SUPER_ADMIN" || session.role === "ADMIN")) {
    student = await db.student.findFirst({
      where: { status: "ACTIVE" },
      include: {
        institute: true,
        parent: true,
        session: true,
      },
      orderBy: { createdAt: "desc" },
    });
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

  // Pre-fetch active enrollments to reuse for materials count without extra subqueries
  const enrollments = await db.enrollment.findMany({
    where: { studentId: student.id, status: "ACTIVE" },
    include: {
      batch: {
        include: {
          teachers: {
            include: { teacher: true },
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
      where: { studentId: student.id },
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
      where: { studentId: student.id, status: "SUCCESS" },
      orderBy: { paymentDate: "desc" },
      take: 5,
    }),

    // Exam marks & reports
    db.marks.findMany({
      where: { studentId: student.id },
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
        OR: [
          { targetRole: "STUDENT" },
          { targetRole: "ALL" },
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
          ...(enrolledCourseIds.length > 0 ? [{ courseId: { in: enrolledCourseIds } }] : []),
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
  const { student } = await resolveCurrentStudent();
  if (!student) return { success: false, data: [] };

  const records = await db.attendance.findMany({
    where: { studentId: student.id },
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
  const { student } = await resolveCurrentStudent();
  if (!student) return { success: false, data: [] };

  const marks = await db.marks.findMany({
    where: { studentId: student.id },
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
      where: { studentId: student.id, status: "SUCCESS" },
      orderBy: { paymentDate: "desc" },
      include: {
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
  const { student } = await resolveCurrentStudent();
  if (!student) return { success: false, data: [] };

  const enrollments = await db.enrollment.findMany({
    where: { studentId: student.id },
  });

  const batchIds = enrollments.map((e) => e.batchId).filter(Boolean) as string[];
  const courseIds = enrollments.map((e) => e.courseId).filter(Boolean) as string[];

  const materials = await db.studyMaterial.findMany({
    where: {
      OR: [
        { batchId: { in: batchIds } },
        { courseId: { in: courseIds } },
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

  // If not valid yet and user is a student, check default passwords or student code
  if (!isValid && user.role === "STUDENT") {
    const defaultPasswords = ["student123", "Student@123", "password123"];
    if (defaultPasswords.includes(formData.currentPassword)) {
      isValid = true;
    } else {
      const student = await db.student.findFirst({
        where: { OR: [{ userId: user.id }, { email: user.email }] },
      });
      if (student) {
        const studentCode = student.studentId?.trim().toLowerCase();
        const admissionCode = student.admissionNo?.trim().toLowerCase();
        const entered = formData.currentPassword.toLowerCase().trim();
        if (entered === studentCode || entered === admissionCode) {
          isValid = true;
        }
      }
    }
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
 * Returns full batch details for an enrolled student (or admin preview),
 * including weekly timetable schedule, assigned faculty, and study materials.
 */
export async function getStudentBatchDetails(batchId: string) {
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

  const batch = await db.batch.findUnique({
    where: { id: batchId },
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
        ...batch,
        allMaterials,
      },
    },
  };
}

