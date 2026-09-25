"use server";
import { requirePermission, requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";
import { redactRelatedData } from "@/lib/redact-related-data";
import { requireAuth, getEffectivePermissions } from "@/lib/auth";
import { resolveCurrentStudent } from "@/server/actions/portal";
import { revalidatePath } from "next/cache";

type TestSeriesFormInput = {
  title: string;
  code: string;
  description?: string;
  targetExam: string;
  fee: number;
  totalTests: number;
  startDate: string;
  endDate: string;
  testCenterVenue?: string;
  status?: string;
};

const DEFAULT_TEST_CENTER = "Main Campus Exam Center, Hall A & B";
const TEST_SERIES_PATHS = ["/test-series", "/dashboard/test-series", "/portal/test-series"];

function revalidateTestSeriesPaths() {
  TEST_SERIES_PATHS.forEach((path) => revalidatePath(path));
}

function parseSeriesDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Fetch all Offline Test Series programs with high-level KPI metrics
 */
export async function getTestSeriesList() {
  const actor = await requireStaffPermission("test-series.view");
  const permissions = await getEffectivePermissions(actor);

  const seriesList = await db.testSeries.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      exams: {
        orderBy: { examDate: "asc" },
      },
      registrations: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              studentId: true,
              admissionNo: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  let totalRegistrations = 0;
  let totalRevenueCollected = 0;
  let totalExamsScheduled = 0;

  seriesList.forEach((s) => {
    totalRegistrations += s.registrations.length;
    totalExamsScheduled += s.exams.length;
    s.registrations.forEach((reg) => {
      if (reg.paymentStatus === "PAID") {
        totalRevenueCollected += reg.feeAmount;
      }
    });
  });

  return {
    success: true,
    seriesList: redactRelatedData(seriesList, permissions),
    stats: {
      totalPrograms: seriesList.length,
      totalRegistrations,
      totalRevenueCollected: permissions.includes("fees.view") ? totalRevenueCollected : 0,
      totalExamsScheduled,
    },
  };
}

/**
 * Fetch detailed view for a single Test Series
 */
export async function getTestSeriesDetails(id: string) {
  const actor = await requireStaffPermission("test-series.view");
  const permissions = await getEffectivePermissions(actor);

  const series = await db.testSeries.findUnique({
    where: { id },
    include: {
      exams: {
        orderBy: { examDate: "asc" },
        include: {
          results: {
            include: {
              registration: {
                include: { student: true },
              },
            },
          },
        },
      },
      registrations: {
        orderBy: { createdAt: "desc" },
        include: {
          student: true,
          results: true,
        },
      },
    },
  });

  if (!series) {
    return { success: false, error: "Test Series not found" };
  }

  return { success: true, series: redactRelatedData(series, permissions) };
}

/**
 * Create a new Offline Test Series
 */
export async function createTestSeries(formData: TestSeriesFormInput) {
  await requireStaffPermission("test-series.manage");

  if (!formData.title || !formData.code) {
    return { success: false, error: "Title and Code are required." };
  }

  const startDate = parseSeriesDate(formData.startDate);
  const endDate = parseSeriesDate(formData.endDate);

  if (!startDate || !endDate) {
    return { success: false, error: "Start date and end date are required." };
  }

  if (endDate < startDate) {
    return { success: false, error: "End date cannot be before start date." };
  }

  // Get institute ID
  const institute = await db.institute.findFirst();
  if (!institute) {
    return { success: false, error: "Institute record not found." };
  }

  try {
    const newSeries = await db.testSeries.create({
      data: {
        instituteId: institute.id,
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description?.trim(),
        targetExam: formData.targetExam || "NEET",
        fee: Number(formData.fee) || 0,
        totalTests: Number(formData.totalTests) || 1,
        startDate,
        endDate,
        testCenterVenue: formData.testCenterVenue?.trim() || DEFAULT_TEST_CENTER,
        status: formData.status || "ACTIVE",
      },
    });

    revalidateTestSeriesPaths();
    return { success: true, testSeries: newSeries };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create Test Series",
    };
  }
}

/**
 * Update an existing Offline Test Series
 */
export async function updateTestSeries(id: string, formData: TestSeriesFormInput) {
  await requireStaffPermission("test-series.manage");

  if (!id) {
    return { success: false, error: "Test Series ID is required." };
  }

  if (!formData.title || !formData.code) {
    return { success: false, error: "Title and Code are required." };
  }

  const startDate = parseSeriesDate(formData.startDate);
  const endDate = parseSeriesDate(formData.endDate);

  if (!startDate || !endDate) {
    return { success: false, error: "Start date and end date are required." };
  }

  if (endDate < startDate) {
    return { success: false, error: "End date cannot be before start date." };
  }

  try {
    const updatedSeries = await db.testSeries.update({
      where: { id },
      data: {
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description?.trim() || null,
        targetExam: formData.targetExam || "NEET",
        fee: Number(formData.fee) || 0,
        totalTests: Number(formData.totalTests) || 1,
        startDate,
        endDate,
        testCenterVenue: formData.testCenterVenue?.trim() || DEFAULT_TEST_CENTER,
        status: formData.status || "ACTIVE",
      },
    });

    revalidateTestSeriesPaths();
    return { success: true, testSeries: updatedSeries };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update Test Series",
    };
  }
}

/**
 * Delete an Offline Test Series and its linked registrations, exams, and results
 */
export async function deleteTestSeries(id: string) {
  await requireStaffPermission("test-series.manage");

  if (!id) {
    return { success: false, error: "Test Series ID is required." };
  }

  try {
    const existing = await db.testSeries.findUnique({
      where: { id },
      select: { title: true },
    });

    if (!existing) {
      return { success: false, error: "Test Series not found." };
    }

    await db.testSeries.delete({ where: { id } });

    revalidateTestSeriesPaths();
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete Test Series",
    };
  }
}

/**
 * Add an individual offline test into a Test Series
 */
export async function createTestSeriesExam(formData: {
  testSeriesId: string;
  testNumber: number;
  title: string;
  code: string;
  examDate: string;
  durationMinutes: number;
  maxMarks: number;
  passingMarks: number;
  syllabus?: string;
  venueRoom?: string;
  paperType?: string;
  questionPaperUrl?: string;
  answerKeyUrl?: string;
}) {
  await requireStaffPermission("test-series.manage");

  if (!formData.title || !formData.code || !formData.testSeriesId) {
    return { success: false, error: "Title, Code, and Test Series ID are required." };
  }

  try {
    const exam = await db.testSeriesExam.create({
      data: {
        testSeriesId: formData.testSeriesId,
        testNumber: Number(formData.testNumber) || 1,
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        examDate: new Date(formData.examDate),
        durationMinutes: Number(formData.durationMinutes) || 180,
        maxMarks: Number(formData.maxMarks) || 720,
        passingMarks: Number(formData.passingMarks) || 250,
        syllabus: formData.syllabus?.trim(),
        venueRoom: formData.venueRoom?.trim() || "Exam Hall 1, Desk 1-40",
        paperType: formData.paperType?.trim() || "OMR Pen-Paper Offline",
        questionPaperUrl: formData.questionPaperUrl?.trim(),
        answerKeyUrl: formData.answerKeyUrl?.trim(),
        status: "SCHEDULED",
      },
    });

    revalidateTestSeriesPaths();
    return { success: true, exam };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to schedule test",
    };
  }
}

/**
 * Register a student (existing or guest) into a Test Series with One-Time Fee
 */
export async function registerStudentForTestSeries(formData: {
  testSeriesId: string;
  studentId?: string | null;
  externalStudentName?: string | null;
  externalStudentPhone?: string | null;
  externalStudentEmail?: string | null;
  feeAmount: number;
  paymentMethod: string;
  paymentStatus?: string;
  remarks?: string;
}) {
  await requireStaffPermission("fees.create");
  await requireStaffPermission("test-series.manage");

  if (!formData.testSeriesId) {
    return { success: false, error: "Please select a test series." };
  }

  if (!formData.studentId && !formData.externalStudentName) {
    return {
      success: false,
      error: "Please select an enrolled student or enter external candidate name.",
    };
  }

  try {
    // Generate unique roll number & receipt number
    const count = await db.testSeriesRegistration.count({
      where: { testSeriesId: formData.testSeriesId },
    });
    const year = new Date().getFullYear();
    const rollSeq = String(count + 1).padStart(4, "0");
    const rollNumber = `TS-${year}-ROLL-${rollSeq}`;
    const receiptNo = `TS-REC-${year}-${rollSeq}`;

    const reg = await db.testSeriesRegistration.create({
      data: {
        testSeriesId: formData.testSeriesId,
        studentId: formData.studentId || null,
        externalStudentName: formData.externalStudentName?.trim() || null,
        externalStudentPhone: formData.externalStudentPhone?.trim() || null,
        externalStudentEmail: formData.externalStudentEmail?.trim() || null,
        rollNumber,
        feeAmount: Number(formData.feeAmount) || 0,
        paymentStatus: formData.paymentStatus || "PAID",
        paymentMethod: formData.paymentMethod || "UPI",
        receiptNo,
        paidAt: formData.paymentStatus === "PENDING" ? null : new Date(),
        status: "CONFIRMED",
        remarks: formData.remarks?.trim(),
      },
      include: {
        testSeries: true,
        student: true,
      },
    });

    revalidateTestSeriesPaths();
    return { success: true, registration: reg };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to register candidate",
    };
  }
}

/**
 * Submit / Update Offline Test Results & Compute Ranks & Percentile
 */
export async function submitTestResults(
  testSeriesExamId: string,
  results: Array<{
    registrationId: string;
    marksObtained: number;
    maxMarks: number;
    attendance: "PRESENT" | "ABSENT";
    subjectBreakup?: Record<string, number>;
    negativeMarks?: number;
    correctCount?: number;
    incorrectCount?: number;
    unattemptedCount?: number;
    remarks?: string;
  }>
) {
  await requireStaffPermission("results.manage");

  if (!testSeriesExamId || !results || results.length === 0) {
    return { success: false, error: "Invalid test results data submitted." };
  }

  try {
    // Filter present students to compute rank
    const presentResults = results
      .filter((r) => r.attendance === "PRESENT")
      .sort((a, b) => b.marksObtained - a.marksObtained);

    const totalPresent = presentResults.length;

    // Map ranks & percentiles
    const rankMap = new Map<string, { rank: number; percentile: number }>();
    presentResults.forEach((item, index) => {
      const rank = index + 1;
      const percentile =
        totalPresent > 1
          ? Number((((totalPresent - rank) / totalPresent) * 100).toFixed(2))
          : 100;
      rankMap.set(item.registrationId, { rank, percentile });
    });

    // Save or update each candidate's score
    for (const res of results) {
      const isPresent = res.attendance === "PRESENT";
      const percentage =
        res.maxMarks > 0
          ? Number(((res.marksObtained / res.maxMarks) * 100).toFixed(2))
          : 0;

      const rankInfo = rankMap.get(res.registrationId);

      await db.testSeriesResult.upsert({
        where: {
          testSeriesExamId_registrationId: {
            testSeriesExamId,
            registrationId: res.registrationId,
          },
        },
        create: {
          testSeriesExamId,
          registrationId: res.registrationId,
          marksObtained: isPresent ? res.marksObtained : 0,
          maxMarks: res.maxMarks,
          percentage: isPresent ? percentage : 0,
          rank: isPresent && rankInfo ? rankInfo.rank : null,
          percentile: isPresent && rankInfo ? rankInfo.percentile : null,
          attendance: res.attendance,
          subjectBreakup: res.subjectBreakup ? JSON.stringify(res.subjectBreakup) : null,
          negativeMarks: res.negativeMarks || 0,
          correctCount: res.correctCount || null,
          incorrectCount: res.incorrectCount || null,
          unattemptedCount: res.unattemptedCount || null,
          remarks: res.remarks?.trim(),
        },
        update: {
          marksObtained: isPresent ? res.marksObtained : 0,
          maxMarks: res.maxMarks,
          percentage: isPresent ? percentage : 0,
          rank: isPresent && rankInfo ? rankInfo.rank : null,
          percentile: isPresent && rankInfo ? rankInfo.percentile : null,
          attendance: res.attendance,
          subjectBreakup: res.subjectBreakup ? JSON.stringify(res.subjectBreakup) : null,
          negativeMarks: res.negativeMarks || 0,
          correctCount: res.correctCount || null,
          incorrectCount: res.incorrectCount || null,
          unattemptedCount: res.unattemptedCount || null,
          remarks: res.remarks?.trim(),
        },
      });
    }

    // Mark test exam as RESULTS_PUBLISHED
    await db.testSeriesExam.update({
      where: { id: testSeriesExamId },
      data: { status: "RESULTS_PUBLISHED" },
    });

    revalidateTestSeriesPaths();
    return { success: true, count: results.length };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record test marks",
    };
  }
}

/**
 * Fetch Student Portal Offline Test Series Data
 */
export async function getStudentPortalTestSeries() {
  await requirePermission("test-series.view");
  await requirePermission("results.view");
  await requirePermission("fees.view");
  const { student } = await resolveCurrentStudent();

  if (!student) {
    return {
      success: true,
      registeredSeries: [],
      availableSeries: [],
      student: null,
    };
  }

  // Find all registrations for this student
  const registered = await db.testSeriesRegistration.findMany({
    where: { studentId: student.id },
    include: {
      testSeries: {
        include: {
          exams: {
            orderBy: { examDate: "asc" },
            include: {
              results: {
                where: { registration: { studentId: student.id } },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const registeredSeriesIds = registered.map((r) => r.testSeriesId);

  // Available upcoming series to explore
  const available = await db.testSeries.findMany({
    where: {
      id: { notIn: registeredSeriesIds },
      status: "ACTIVE",
    },
    include: {
      exams: {
        orderBy: { examDate: "asc" },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return {
    success: true,
    student,
    registeredSeries: registered,
    availableSeries: available,
  };
}

/**
 * Allow a logged in student to register for a series from student portal
 */
export async function enrollStudentSelf(testSeriesId: string, paymentMethod: string = "UPI") {
  await requirePermission("test-series.enroll");
  await requireAuth(["STUDENT"]);
  const { student } = await resolveCurrentStudent();

  if (!student) {
    return { success: false, error: "Student profile not found." };
  }

  const series = await db.testSeries.findUnique({
    where: { id: testSeriesId },
  });

  if (!series || series.status !== "ACTIVE" || series.instituteId !== student.instituteId) {
    return { success: false, error: "Test Series not available." };
  }

  // Check if already registered
  const existing = await db.testSeriesRegistration.findFirst({
    where: { testSeriesId, studentId: student.id },
  });

  if (existing) {
    return { success: false, error: "You are already enrolled in this test series." };
  }

  const count = await db.testSeriesRegistration.count({
    where: { testSeriesId },
  });
  const year = new Date().getFullYear();
  const rollSeq = String(count + 1).padStart(4, "0");
  const rollNumber = `TS-${year}-ROLL-${rollSeq}`;
  const receiptNo = `TS-REC-${year}-${rollSeq}`;

  try {
    const reg = await db.testSeriesRegistration.create({
      data: {
        testSeriesId,
        studentId: student.id,
        rollNumber,
        feeAmount: series.fee,
        paymentStatus: "PENDING",
        paymentMethod,
        receiptNo,
        paidAt: null,
        status: "CONFIRMED",
        remarks: "Self-registered via Student Portal",
      },
    });

    revalidateTestSeriesPaths();
    return { success: true, registration: reg };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Enrollment failed",
    };
  }
}

/**
 * Update payment status & method for an offline test series candidate registration
 */
export async function updateTestSeriesPayment(
  registrationId: string,
  formData: {
    paymentStatus: string; // "PAID" | "PENDING" | "EXEMPTED"
    paymentMethod: string; // "CASH" | "UPI" | "CARD" | "BANK_TRANSFER"
    remarks?: string;
  }
) {
  await requireStaffPermission("fees.update");

  if (!registrationId) {
    return { success: false, error: "Registration ID is required." };
  }

  try {
    const existing = await db.testSeriesRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!existing) {
      return { success: false, error: "Candidate registration not found." };
    }

    const updated = await db.testSeriesRegistration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod || existing.paymentMethod,
        paidAt: formData.paymentStatus === "PAID" ? (existing.paidAt || new Date()) : null,
        remarks: formData.remarks !== undefined ? formData.remarks.trim() : existing.remarks,
      },
    });

    revalidateTestSeriesPaths();
    return { success: true, registration: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update payment status.",
    };
  }
}
