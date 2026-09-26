"use server";

import { assertCampusAccess } from "@/lib/campus-scope";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";

import { calculateGrade } from "@/lib/utils";
import { logAudit } from "./audit";

export async function getExams({
  batchId,
  subjectId,
  status,
}: { batchId?: string; subjectId?: string; status?: string } = {}) {
  await requireStaffPermission("exams.view");
  const where: Record<string, unknown> = {};

  if (batchId) where.batchId = batchId;
  if (subjectId) where.subjectId = subjectId;
  if (status && status !== "ALL") where.status = status;

  return await db.exam.findMany({
    where,
    orderBy: { examDate: "desc" },
    include: {
      batch: true,
      subject: true,
      _count: { select: { marks: true } },
    },
  });
}

export async function getExamById(id: string) {
  await requireStaffPermission("results.view");
  await requireStaffPermission("students.view");
  await requireStaffPermission("exams.view");
  const exam = await db.exam.findFirst({
    where: { id },
    include: {
      batch: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: { student: true },
          },
        },
      },
      subject: true,
      marks: {
        include: { student: true },
        orderBy: { marksObtained: "desc" },
      },
    },
  });

  if (!exam) throw new Error("Exam not found");

  // Roster: merge active students in batch with existing marks
  const marksMap = new Map(exam.marks.map((m) => [m.studentId, m]));
  const roster = exam.batch.enrollments.map((e) => {
    const mark = marksMap.get(e.studentId);
    return {
      studentId: e.student.id,
      studentCode: e.student.studentId,
      name: e.student.name,
      marksObtained: mark ? mark.marksObtained : 0,
      percentage: mark ? mark.percentage : 0,
      grade: mark ? mark.grade : "-",
      isPassed: mark ? mark.isPassed : false,
      remarks: mark?.remarks || "",
      isGraded: !!mark,
    };
  });

  // Calculate analytics
  const gradedMarks = exam.marks.map((m) => m.marksObtained);
  const totalGraded = gradedMarks.length;
  const highestMarks = totalGraded > 0 ? Math.max(...gradedMarks) : 0;
  const lowestMarks = totalGraded > 0 ? Math.min(...gradedMarks) : 0;
  const avgMarks =
    totalGraded > 0
      ? Math.round((gradedMarks.reduce((a, b) => a + b, 0) / totalGraded) * 10) / 10
      : 0;
  const passedCount = exam.marks.filter((m) => m.isPassed).length;
  const passPercentage = totalGraded > 0 ? Math.round((passedCount / totalGraded) * 100) : 0;

  return {
    exam,
    roster,
    analytics: {
      totalStudents: exam.batch.enrollments.length,
      totalGraded,
      highestMarks,
      lowestMarks,
      avgMarks,
      passPercentage,
    },
  };
}

export async function createExam(data: {
  title: string;
  code: string;
  type: string;
  batchId: string;
  subjectId: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  durationMinutes: number;
  instructions?: string;
}) {
  const session = await requireStaffPermission("exams.create");
  const batch = await db.batch.findFirst({
    where: { id: data.batchId },
    select: { id: true, instituteId: true },
  });
  if (!batch) throw new Error("Batch not found");
  assertCampusAccess(session, batch.instituteId);
  const subject = await db.subject.findFirst({
    where: {
      id: data.subjectId,
      OR: [{ instituteId: null }, { instituteId: batch.instituteId }],
    },
    select: { id: true },
  });
  if (!subject) throw new Error("Select a global subject or a subject assigned to the batch location.");

  const exam = await db.exam.create({
    data: {
      title: data.title,
      code: data.code.toUpperCase(),
      type: data.type || "TEST",
      batchId: data.batchId,
      subjectId: data.subjectId,
      examDate: new Date(data.examDate),
      maxMarks: data.maxMarks,
      passingMarks: data.passingMarks,
      durationMinutes: data.durationMinutes || 180,
      instructions: data.instructions || null,
      status: "UPCOMING",
    },
  });

  await logAudit({
    action: "EXAM_CREATED",
    entity: "Exam",
    entityId: exam.id,
    details: `Exam created: ${exam.title} (${exam.code})`,
  });

  return { success: true, exam };
}

export async function saveExamMarks(
  examId: string,
  entries: Array<{ studentId: string; marksObtained: number; remarks?: string }>
) {
  const session = await requireStaffPermission("results.manage");
  const exam = await db.exam.findFirst({
    where: { id: examId },
    include: { batch: { select: { instituteId: true } } },
  });
  if (!exam) throw new Error("Exam not found");
  const instituteId = assertCampusAccess(session, exam.batch.instituteId);

  await db.$transaction(async (tx) => {
    const studentIds = [...new Set(entries.map((entry) => entry.studentId))];
    const eligibleStudents = await tx.student.findMany({
      where: {
        id: { in: studentIds },
        instituteId,
        enrollments: {
          some: { batchId: exam.batchId, status: "ACTIVE" },
        },
      },
      select: { id: true },
    });
    if (eligibleStudents.length !== studentIds.length) {
      throw new Error("Marks can only be recorded for active students in this campus batch.");
    }

    for (const entry of entries) {
      if (entry.marksObtained > exam.maxMarks) {
        throw new Error(
          `Marks obtained (${entry.marksObtained}) cannot exceed maximum marks (${exam.maxMarks})`
        );
      }

      const percentage = Math.round((entry.marksObtained / exam.maxMarks) * 1000) / 10;
      const { grade, isPassed } = calculateGrade(percentage);

      const existing = await tx.marks.findUnique({
        where: { examId_studentId: { examId, studentId: entry.studentId } },
      });

      if (existing) {
        await tx.marks.update({
          where: { id: existing.id },
          data: {
            marksObtained: entry.marksObtained,
            percentage,
            grade,
            isPassed: entry.marksObtained >= exam.passingMarks,
            remarks: entry.remarks || null,
          },
        });
      } else {
        await tx.marks.create({
          data: {
            examId,
            studentId: entry.studentId,
            marksObtained: entry.marksObtained,
            percentage,
            grade,
            isPassed: entry.marksObtained >= exam.passingMarks,
            remarks: entry.remarks || null,
          },
        });
      }
    }

    // Update exam status to PUBLISHED if all graded
    await tx.exam.update({
      where: { id: examId },
      data: { status: "PUBLISHED" },
    });
  });

  await logAudit({
    action: "EXAM_MARKS_SAVED",
    entity: "Marks",
    entityId: examId,
    details: `Marks recorded for exam ${exam.code} (${entries.length} students) by ${session.name}`,
  });

  return { success: true };
}

export async function publishExam(examId: string) {
  const session = await requireStaffPermission("results.manage");
  const existingExam = await db.exam.findFirst({
    where: { id: examId },
    select: { id: true, batch: { select: { instituteId: true } } },
  });
  if (!existingExam) throw new Error("Exam not found");
  assertCampusAccess(session, existingExam.batch.instituteId);
  const exam = await db.exam.update({
    where: { id: examId },
    data: { status: "PUBLISHED" },
  });
  await logAudit({
    action: "EXAM_PUBLISHED",
    entity: "Exam",
    entityId: examId,
    details: `Exam published: ${exam.title}`,
  });
  return { success: true };
}
