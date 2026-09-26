"use server";

import { authorizedCampusId } from "@/lib/campus-scope";
import { getActiveCampusId } from "@/server/actions/campus";
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
const TEST_SERIES_PATHS = ["/test-series", "/dashboard/test-series", "/portal/test-series", "/results", "/portal/results", "/external-results"];

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
    where: {},
    orderBy: { createdAt: "desc" },
    include: {
      exams: {
        orderBy: { examDate: "asc" },
        include: { results: true },
      },
      registrations: {
        include: {
          externalCandidate: true,
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
      if (["PAID", "PARTIALLY_REFUNDED"].includes(reg.paymentStatus)) {
        totalRevenueCollected += Math.max(0, reg.feeAmount - reg.refundedAmount);
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
  const series = await db.testSeries.findFirst({
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
          externalCandidate: true,
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
  const session = await requireStaffPermission("test-series.manage");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

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
    const newSeries = await db.testSeries.create({
      data: {
        instituteId,
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
  const session = await requireStaffPermission("test-series.manage");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

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
    const existingSeries = await db.testSeries.findFirst({
      where: { id, instituteId },
      select: { id: true },
    });
    if (!existingSeries) {
      return { success: false, error: "Test Series not found in the active campus." };
    }
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
  const session = await requireStaffPermission("test-series.manage");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

  if (!id) {
    return { success: false, error: "Test Series ID is required." };
  }

  try {
    const existing = await db.testSeries.findFirst({
      where: { id, instituteId },
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
  const session = await requireStaffPermission("test-series.manage");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

  if (!formData.title || !formData.code || !formData.testSeriesId) {
    return { success: false, error: "Title, Code, and Test Series ID are required." };
  }

  try {
    const series = await db.testSeries.findFirst({
      where: { id: formData.testSeriesId, instituteId },
      select: { id: true },
    });
    if (!series) {
      return { success: false, error: "Test Series not found in the active campus." };
    }
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
  externalDateOfBirth?: string | null;
  externalGender?: string | null;
  externalParentName?: string | null;
  externalParentPhone?: string | null;
  externalAddress?: string | null;
  externalCity?: string | null;
  feeAmount: number;
  paymentMethod: string;
  paymentStatus?: string;
  remarks?: string;
  leadId?: string;
}) {
  await requireStaffPermission("fees.create");
  const session = await requireStaffPermission("test-series.manage");
  const instituteId = session.role === "SUPER_ADMIN"
    ? undefined
    : authorizedCampusId(session, await getActiveCampusId());

  if (!formData.testSeriesId) {
    return { success: false, error: "Please select a test series." };
  }

  if (!formData.studentId && !formData.externalStudentName) {
    return {
      success: false,
      error: "Please select an enrolled student or enter external candidate name.",
    };
  }
  if (!formData.studentId && !formData.externalStudentPhone?.trim()) {
    return { success: false, error: "Phone number is required for an external candidate profile." };
  }

  try {
    // Generate unique roll number & receipt number
    const series = await db.testSeries.findFirst({
      where: { id: formData.testSeriesId, ...(instituteId ? { instituteId } : {}) },
      select: { id: true, instituteId: true, institute: { select: { code: true } } },
    });
    if (!series) {
      return { success: false, error: "Test Series not found in the active campus." };
    }
    if (formData.leadId) {
      const lead = await db.lead.findUnique({
        where: { id: formData.leadId },
        select: {
          id: true,
          instituteId: true,
          interestType: true,
          testSeriesId: true,
          isConverted: true,
        },
      });
      if (!lead || lead.interestType !== "TEST_SERIES") {
        return { success: false, error: "This is not a valid Test Series lead." };
      }
      if (lead.isConverted) {
        return { success: false, error: "This lead has already been converted." };
      }
      if (lead.testSeriesId && lead.testSeriesId !== series.id) {
        return { success: false, error: "Lead must be enrolled in its selected Test Series." };
      }
      if (lead.instituteId && lead.instituteId !== series.instituteId) {
        return { success: false, error: "Lead and Test Series must belong to the same location." };
      }
    }
    if (formData.studentId) {
      const student = await db.student.findFirst({
        where: { id: formData.studentId, instituteId: series.instituteId },
        select: { id: true },
      });
      if (!student) {
        return { success: false, error: "Student and test series must belong to the same location." };
      }
    }
    const count = await db.testSeriesRegistration.count({
      where: { testSeriesId: formData.testSeriesId },
    });
    const year = new Date().getFullYear();
    const rollSeq = String(count + 1).padStart(4, "0");
    const rollNumber = `TS-${year}-ROLL-${rollSeq}`;
    const receiptNo = `TS-REC-${year}-${rollSeq}`;
    let externalCandidateId: string | null = null;
    if (!formData.studentId) {
      const phone = formData.externalStudentPhone!.trim().replace(/\s+/g, " ");
      const existingCandidate = await db.externalCandidate.findUnique({
        where: { instituteId_phone: { instituteId: series.instituteId, phone } },
        select: { id: true },
      });
      if (existingCandidate) {
        const candidate = await db.externalCandidate.update({
          where: { id: existingCandidate.id },
          data: {
            name: formData.externalStudentName!.trim(),
            ...(formData.externalStudentEmail?.trim() && { email: formData.externalStudentEmail.trim().toLowerCase() }),
            ...(formData.externalDateOfBirth && { dateOfBirth: new Date(formData.externalDateOfBirth) }),
            ...(formData.externalGender?.trim() && { gender: formData.externalGender.trim() }),
            ...(formData.externalParentName?.trim() && { parentName: formData.externalParentName.trim() }),
            ...(formData.externalParentPhone?.trim() && { parentPhone: formData.externalParentPhone.trim() }),
            ...(formData.externalAddress?.trim() && { address: formData.externalAddress.trim() }),
            ...(formData.externalCity?.trim() && { city: formData.externalCity.trim() }),
          },
        });
        externalCandidateId = candidate.id;
      } else {
        const candidateCount = await db.externalCandidate.count({ where: { instituteId: series.instituteId } });
        const candidate = await db.externalCandidate.create({
          data: {
            instituteId: series.instituteId,
            candidateNo: `EXT-${series.institute.code}-${year}-${String(candidateCount + 1).padStart(5, "0")}`,
            name: formData.externalStudentName!.trim(),
            phone,
            email: formData.externalStudentEmail?.trim().toLowerCase() || null,
            dateOfBirth: formData.externalDateOfBirth ? new Date(formData.externalDateOfBirth) : null,
            gender: formData.externalGender?.trim() || null,
            parentName: formData.externalParentName?.trim() || null,
            parentPhone: formData.externalParentPhone?.trim() || null,
            address: formData.externalAddress?.trim() || null,
            city: formData.externalCity?.trim() || null,
          },
        });
        externalCandidateId = candidate.id;
      }
    }

    const reg = await db.testSeriesRegistration.create({
      data: {
        testSeriesId: formData.testSeriesId,
        studentId: formData.studentId || null,
        externalCandidateId,
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
        externalCandidate: true,
      },
    });

    if (formData.leadId) {
      await db.lead.update({
        where: { id: formData.leadId },
        data: {
          status: "CONVERTED",
          isConverted: true,
          interestType: "TEST_SERIES",
          testSeriesId: formData.testSeriesId,
          convertedTestSeriesRegistrationId: reg.id,
        },
      });
      revalidatePath("/leads");
    }

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
    expectedUpdatedAt?: string | null;
  }>
) {
  const session = await requireStaffPermission("results.manage");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

  if (typeof testSeriesExamId !== "string" || !testSeriesExamId || !Array.isArray(results) || results.length === 0 || results.length > 500) {
    return { success: false, error: "Invalid test results data submitted." };
  }
  if (results.some((result) => !result || typeof result.registrationId !== "string" || !result.registrationId
    || (result.remarks !== undefined && (typeof result.remarks !== "string" || result.remarks.length > 2000))
    || (result.expectedUpdatedAt != null && (typeof result.expectedUpdatedAt !== "string" || !Number.isFinite(Date.parse(result.expectedUpdatedAt))))
    || (result.negativeMarks !== undefined && (!Number.isFinite(result.negativeMarks) || result.negativeMarks < 0))
    || (result.subjectBreakup !== undefined && (!result.subjectBreakup || typeof result.subjectBreakup !== "object" || Array.isArray(result.subjectBreakup)
      || Object.values(result.subjectBreakup).some((value) => !Number.isFinite(value)))))) {
    return { success: false, error: "Invalid candidate, remarks, or score details." };
  }

  try {
    const exam = await db.testSeriesExam.findFirst({
      where: { id: testSeriesExamId, testSeries: { instituteId } },
      select: { testSeriesId: true, status: true, resultsPublishedAt: true, maxMarks: true },
    });
    if (!exam) {
      return { success: false, error: "Test Series exam not found in the active campus." };
    }
    const invalidCounts = results.some((result) =>
      [result.correctCount, result.incorrectCount, result.unattemptedCount].some(
        (value) => value !== undefined && (!Number.isInteger(value) || value < 0)
      )
    );
    if (invalidCounts) {
      return { success: false, error: "Correct, wrong, and unattempted counts must be non-negative whole numbers." };
    }
    const invalidScores = results.some((result) =>
      !["PRESENT", "ABSENT"].includes(result.attendance)
      || !Number.isFinite(result.marksObtained)
      || (result.attendance === "PRESENT" && (result.marksObtained < 0 || result.marksObtained > exam.maxMarks))
    );
    if (invalidScores) {
      return { success: false, error: `Marks must be between 0 and ${exam.maxMarks} for present candidates.` };
    }
    const registrationIds = [...new Set(results.map((result) => result.registrationId))];
    if (registrationIds.length !== results.length) {
      return { success: false, error: "Submit each candidate only once." };
    }
    const registrations = await db.testSeriesRegistration.findMany({
      where: {
        id: { in: registrationIds },
        testSeriesId: exam.testSeriesId,
        OR: [{ studentId: null }, { student: { instituteId } }],
      },
      select: { id: true },
    });
    if (registrations.length !== registrationIds.length) {
      return { success: false, error: "A registration does not belong to this test series." };
    }
    await db.$transaction(async (tx) => {
      const previousResults = await tx.testSeriesResult.findMany({
        where: { testSeriesExamId, registrationId: { in: registrationIds } },
      });
      for (const result of results) {
        const previous = previousResults.find((row) => row.registrationId === result.registrationId);
        if ((previous?.updatedAt.toISOString() ?? null) !== (result.expectedUpdatedAt ?? null)) {
          throw new Error("This result has changed since you opened it. Refresh, review the latest score, and edit again.");
        }
      }
      // Scores and the entire exam's derived rankings change atomically.
      for (const res of results) {
        const isPresent = res.attendance === "PRESENT";
        const percentage =
          exam.maxMarks > 0
            ? Number(((res.marksObtained / exam.maxMarks) * 100).toFixed(2))
            : 0;

        const data = {
            marksObtained: isPresent ? res.marksObtained : 0,
            maxMarks: exam.maxMarks,
            percentage: isPresent ? percentage : 0,
            rank: null,
            percentile: null,
            attendance: res.attendance,
            subjectBreakup: res.subjectBreakup === undefined ? undefined : JSON.stringify(res.subjectBreakup),
            negativeMarks: isPresent ? res.negativeMarks : 0,
            correctCount: isPresent ? res.correctCount : null,
            incorrectCount: isPresent ? res.incorrectCount : null,
            unattemptedCount: isPresent ? res.unattemptedCount : null,
            remarks: res.remarks?.trim(),
        };
        await tx.testSeriesResult.upsert({
          where: {
            testSeriesExamId_registrationId: { testSeriesExamId, registrationId: res.registrationId },
          },
          create: { testSeriesExamId, registrationId: res.registrationId, ...data },
          update: data,
        });
      }

      const presentResults = await tx.testSeriesResult.findMany({
        where: { testSeriesExamId, attendance: "PRESENT" },
        orderBy: { marksObtained: "desc" },
        select: { id: true, marksObtained: true, rank: true, percentile: true },
      });
      let rank = 0;
      for (let index = 0; index < presentResults.length; index++) {
        const result = presentResults[index];
        if (index === 0 || result.marksObtained !== presentResults[index - 1].marksObtained) rank = index + 1;
        const percentile = presentResults.length > 1
          ? Number((((presentResults.length - rank) / presentResults.length) * 100).toFixed(2))
          : 100;
        if (result.rank !== rank || result.percentile !== percentile) {
          await tx.testSeriesResult.update({ where: { id: result.id }, data: { rank, percentile } });
        }
      }

      await tx.auditLog.create({
        data: {
          instituteId,
          userId: session.id,
          userName: session.name,
          userRole: session.role,
          action: "TEST_SERIES_RESULTS_SAVED",
          entity: "TestSeriesExam",
          entityId: testSeriesExamId,
          details: JSON.stringify({
            before: previousResults,
            submitted: results,
          }),
        },
      });

      if (exam.status !== "RESULTS_PUBLISHED" && !exam.resultsPublishedAt) {
        await tx.testSeriesExam.update({
          where: { id: testSeriesExamId },
          data: {
            status: "RESULTS_PUBLISHED",
            resultsPublishedAt: new Date(),
            resultsPublishedBy: session.name || session.id,
          },
        });
      }
    }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 30000 });

    revalidateTestSeriesPaths();
    revalidatePath("/test-series/external/[id]", "page");
    revalidatePath("/audit");
    return { success: true, count: results.length };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && ["P2002", "P2034"].includes(String(err.code))) {
      return {
        success: false,
        error: "Results changed in another request. Refresh and try saving again.",
      };
    }
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
    where: {
      studentId: student.id,
      testSeries: { is: { instituteId: student.instituteId } },
    },
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
      instituteId: student.instituteId,
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
  const session = await requireStaffPermission("fees.update");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

  if (!registrationId) {
    return { success: false, error: "Registration ID is required." };
  }

  try {
    const existing = await db.testSeriesRegistration.findFirst({
      where: {
        id: registrationId,
        testSeries: { instituteId },
        OR: [{ studentId: null }, { student: { instituteId } }],
      },
    });

    if (!existing) {
      return { success: false, error: "Candidate registration not found." };
    }
    if (existing.refundedAmount > 0) {
      return { success: false, error: "Refunded registrations must be managed through the Refund action." };
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

export async function getExternalCandidateProfile(candidateId: string) {
  const actor = await requireStaffPermission("test-series.view");
  const instituteId = authorizedCampusId(actor, await getActiveCampusId());
  const candidate = await db.externalCandidate.findFirst({
    where: { id: candidateId, instituteId },
    include: {
      institute: { select: { id: true, name: true, code: true, city: true } },
      registrations: {
        orderBy: { createdAt: "desc" },
        include: {
          testSeries: { select: { id: true, title: true, code: true, targetExam: true } },
          results: {
            include: {
              testSeriesExam: {
                select: { id: true, title: true, code: true, examDate: true, status: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
  if (!candidate) throw new Error("External candidate profile not found.");
  return candidate;
}

export async function refundTestSeriesPayment(data: {
  registrationId: string;
  amount: number;
  reason: string;
}) {
  await requireStaffPermission("fees.update");
  await requireAuth(["SUPER_ADMIN"]);
  if (!Number.isFinite(data.amount) || data.amount <= 0 || Math.round(data.amount * 100) !== data.amount * 100) {
    throw new Error("Refund amount must be greater than zero with at most two decimal places.");
  }
  if (!data.reason?.trim()) throw new Error("Refund reason is required.");

  const updated = await db.$transaction(async (tx) => {
    const registration = await tx.testSeriesRegistration.findUnique({
      where: { id: data.registrationId },
    });

    if (!registration) throw new Error("Test-series registration not found.");
    if (!["PAID", "PARTIALLY_REFUNDED"].includes(registration.paymentStatus)) {
      throw new Error(registration.paymentStatus === "REFUNDED"
        ? "This test-series fee has already been fully refunded."
        : "Only a paid registration can be refunded.");
    }

    const remaining = Math.round((registration.feeAmount - registration.refundedAmount) * 100) / 100;
    if (data.amount > remaining) {
      throw new Error(`Refund cannot exceed the remaining refundable amount (₹${remaining}).`);
    }
    const refundedAmount = Math.round((registration.refundedAmount + data.amount) * 100) / 100;

    return tx.testSeriesRegistration.update({
      where: { id: registration.id },
      data: {
        refundedAmount,
        refundReason: data.reason.trim(),
        refundedAt: new Date(),
        paymentStatus: refundedAmount === Math.round(registration.feeAmount * 100) / 100
          ? "REFUNDED"
          : "PARTIALLY_REFUNDED",
      },
    });
  }, { isolationLevel: "Serializable" });
  revalidateTestSeriesPaths();
  return { success: true, registration: updated };
}
