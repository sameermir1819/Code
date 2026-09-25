"use server";

import { authorizedCampusId } from "@/lib/campus-scope";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getActiveCampusId } from "./campus";
import { parseStudentCard, attendanceDay, attendanceTime, SCAN_COOLDOWN_SECONDS } from "@/lib/attendance-scanner";
import { randomUUID } from "node:crypto";

import { logAudit } from "./audit";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

export async function getBatchAttendanceForDate(batchId: string, dateStr: string) {
  const session = await requireStaffPermission("attendance.view");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());
  const batch = await db.batch.findFirst({
    where: { id: batchId, instituteId },
    select: { id: true },
  });
  if (!batch) throw new Error("Batch not found");
  const date = new Date(dateStr);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Get all active enrolled students in this batch
  const enrollments = await db.enrollment.findMany({
    where: { batchId, status: "ACTIVE" },
    include: {
      student: {
        include: { parent: true },
      },
    },
    orderBy: { student: { name: "asc" } },
  });

  // Get existing attendance records for this date
  const records = await db.attendance.findMany({
    where: {
      batchId,
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  const recordMap = new Map(records.map((r) => [r.studentId, r]));

  const roster = enrollments.map((e) => {
    const rec = recordMap.get(e.studentId);
    return {
      studentId: e.student.id,
      studentCode: e.student.studentId,
      admissionNo: e.student.admissionNo,
      name: e.student.name,
      phone: e.student.phone,
      parentPhone: e.student.parent?.phone,
      status: rec ? (rec.status === "PRESENT" ? "PRESENT" : "ABSENT") : "ABSENT", // strictly PRESENT or ABSENT
      remarks: rec?.remarks || "",
      isMarked: !!rec,
      markedBy: rec?.markedBy || null,
      updatedAt: rec?.updatedAt ? rec.updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null,
    };
  });

  return {
    roster,
    isMarked: records.length > 0,
    markedCount: records.length,
    totalStudents: enrollments.length,
    presentCount: records.filter((r) => r.status === "PRESENT").length,
    absentCount: records.filter((r) => r.status !== "PRESENT").length,
  };
}

export async function saveBatchAttendance(
  batchId: string,
  dateStr: string,
  records: Array<{ studentId: string; status: string; remarks?: string }>
) {
  const session = await requireStaffPermission("attendance.manage");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());
  const batch = await db.batch.findFirst({
    where: { id: batchId, instituteId },
    select: { id: true },
  });
  if (!batch) throw new Error("Batch not found");
  const studentIds = [...new Set(records.map((record) => record.studentId))];
  const enrolledStudents = await db.enrollment.findMany({
    where: {
      batchId,
      status: "ACTIVE",
      studentId: { in: studentIds },
      student: { instituteId },
    },
    select: { studentId: true },
  });
  if (enrolledStudents.length !== studentIds.length) {
    throw new Error("Attendance can only be recorded for active students in this batch.");
  }
  const date = new Date(dateStr);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Security: If teacher, verify assigned to this batch
  if (session.role === "TEACHER" && session.teacherId) {
    const isAssigned = await db.teacherBatch.findUnique({
      where: {
        teacherId_batchId: {
          teacherId: session.teacherId,
          batchId,
        },
      },
    });
    if (!isAssigned) {
      throw new Error("FORBIDDEN: You are only allowed to mark attendance for your assigned batches");
    }
  }

  // Atomic upsert for all student records
  await db.$transaction(async (tx) => {
    for (const r of records) {
      const existing = await tx.attendance.findFirst({
        where: {
          studentId: r.studentId,
          batchId,
          date: { gte: dayStart, lte: dayEnd },
        },
      });

      if (existing) {
        await tx.attendance.update({
          where: { id: existing.id },
          data: {
            status: r.status,
            remarks: r.remarks || null,
            markedBy: session.name,
          },
        });
      } else {
        await tx.attendance.create({
          data: {
            studentId: r.studentId,
            batchId,
            date,
            status: r.status,
            remarks: r.remarks || null,
            markedBy: session.name,
          },
        });
      }
    }
  });

  await logAudit({
    action: "ATTENDANCE_MARKED",
    entity: "Attendance",
    entityId: batchId,
    details: `Attendance marked for batch ${batchId} on ${dateStr} by ${session.name} (${records.length} students)`,
  });

  return { success: true };
}

export async function markBatchUnscannedAsAbsent(batchId: string, dateStr: string) {
  const session = await requireStaffPermission("attendance.manage");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());
  const batch = await db.batch.findFirst({
    where: { id: batchId, instituteId },
    select: { id: true },
  });
  if (!batch) throw new Error("Batch not found");
  const date = new Date(dateStr);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const enrollments = await db.enrollment.findMany({
    where: { batchId, status: "ACTIVE" },
    select: { studentId: true },
  });

  const existingRecords = await db.attendance.findMany({
    where: {
      batchId,
      date: { gte: dayStart, lte: dayEnd },
    },
    select: { studentId: true },
  });

  const existingSet = new Set(existingRecords.map((r) => r.studentId));
  const unscanned = enrollments.filter((e) => !existingSet.has(e.studentId));

  if (unscanned.length > 0) {
    await db.$transaction(async (tx) => {
      for (const u of unscanned) {
        await tx.attendance.create({
          data: {
            studentId: u.studentId,
            batchId,
            date,
            status: "ABSENT",
            markedBy: `Auto-Absence Sync (${session.name})`,
            remarks: "Unscanned at QR Gate",
          },
        });
      }
    });

    await logAudit({
      action: "ATTENDANCE_MARKED",
      entity: "Attendance",
      entityId: batchId,
      details: `Marked ${unscanned.length} unscanned students as ABSENT in batch ${batchId}`,
    });
  }

  return { success: true, count: unscanned.length };
}

export async function getAttendanceDefaulters(thresholdPercentage = 75) {
  const session = await requireStaffPermission("attendance.view");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

  // Calculate attendance rate per active student
  const students = await db.student.findMany({
    where: { status: "ACTIVE", instituteId },
    include: {
      parent: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: { batch: true },
        take: 1,
      },
      attendances: true,
    },
  });

  const defaulters = [];

  for (const s of students) {
    const total = s.attendances.length;
    if (total === 0) continue;

    const present = s.attendances.filter((a) => a.status === "PRESENT").length;
    const absent = total - present;
    const rate = Math.round((present / total) * 100);

    if (rate < thresholdPercentage) {
      defaulters.push({
        studentId: s.id,
        code: s.studentId,
        name: s.name,
        phone: s.phone,
        parentPhone: s.parent?.phone,
        batchName: s.enrollments[0]?.batch?.name || "Unassigned",
        totalClasses: total,
        presentClasses: present,
        absentClasses: absent,
        percentage: rate,
      });
    }
  }

  return defaulters.sort((a, b) => a.percentage - b.percentage);
}

// ==========================================
// MONTHLY ATTENDANCE REPORT
// ==========================================
export interface StudentMonthlyAttendance {
  studentId: string;
  studentCode: string;
  name: string;
  present: number;
  absent: number;
  late?: number;
  excused?: number;
  totalDays: number;
  percentage: number;
}

export interface MonthlyAttendanceReport {
  students: StudentMonthlyAttendance[];
  batchName: string;
  totalStudents: number;
  avgPercentage: number;
  totalPresent: number;
  totalAbsent: number;
}

export async function getMonthlyAttendanceReport(
  batchId: string,
  month: number, // 1-12
  year: number
): Promise<MonthlyAttendanceReport> {
  const session = await requireStaffPermission("attendance.view");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(new Date(year, month - 1, 1));

  // Get batch info
  const batch = await db.batch.findFirst({
    where: { id: batchId, instituteId },
    select: { name: true },
  });
  if (!batch) throw new Error("Batch not found");

  // Get all active enrollments for this batch
  const enrollments = await db.enrollment.findMany({
    where: { batchId, status: "ACTIVE" },
    include: {
      student: { select: { id: true, studentId: true, name: true } },
    },
    orderBy: { student: { name: "asc" } },
  });

  // Fetch all attendance records for this batch in this month
  const records = await db.attendance.findMany({
    where: {
      batchId,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  // Count unique attendance dates (working days in this month for this batch)
  const uniqueDates = new Set(records.map((r) => r.date.toDateString()));
  const totalDays = uniqueDates.size;

  // Group records by studentId
  const recordsByStudent = new Map<string, typeof records>();
  for (const r of records) {
    const arr = recordsByStudent.get(r.studentId) ?? [];
    arr.push(r);
    recordsByStudent.set(r.studentId, arr);
  }

  const students: StudentMonthlyAttendance[] = enrollments.map((e) => {
    const studentRecords = recordsByStudent.get(e.student.id) ?? [];
    const present = studentRecords.filter((r) => r.status === "PRESENT").length;
    const late = studentRecords.filter((r) => r.status === "LATE").length;
    const excused = studentRecords.filter((r) => r.status === "EXCUSED").length;
    const explicitAbsent = studentRecords.filter((r) => r.status !== "PRESENT").length;
    const absent = totalDays > 0 ? (totalDays - present) : explicitAbsent;
    const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return {
      studentId: e.student.id,
      studentCode: e.student.studentId,
      name: e.student.name,
      present,
      late,
      excused,
      absent: Math.max(0, absent),
      totalDays,
      percentage,
    };
  });

  const totalPresent = students.reduce((sum, s) => sum + s.present, 0);
  const totalAbsent = students.reduce((sum, s) => sum + s.absent, 0);
  const avgPercentage =
    students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.percentage, 0) / students.length)
      : 0;

  return {
    students,
    batchName: batch?.name ?? batchId,
    totalStudents: students.length,
    avgPercentage,
    totalPresent,
    totalAbsent,
  };
}

// QR attendance is accepted only by a signed-in staff terminal.
const TERMINAL_ROLES = ["SUPER_ADMIN", "ADMIN", "TEACHER", "ACCOUNTANT"];

async function scannerTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, { isolationLevel: "Serializable" });
    } catch (error) {
      if ((error as { code?: string }).code !== "P2034" || attempt >= 2) throw error;
    }
  }
}

export async function recordQrAttendance(qrPayload: string, requestId?: string) {
  const actor = await requireStaffPermission("attendance.manage");
  const rawCode = parseStudentCard(qrPayload);
  const scanId = requestId ?? randomUUID();
  if (typeof scanId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(scanId)) {
    throw new Error("Invalid scan request. Please scan the card again.");
  }
  const campusId = await getActiveCampusId();
  if (!campusId) throw new Error("Select a campus before scanning cards.");
  const now = new Date();
  const { start, end } = attendanceDay(now);

  const result = await scannerTransaction(async (tx) => {
    const student = await tx.student.findFirst({
      where: {
        instituteId: campusId,
        OR: [{ studentId: rawCode }, { admissionNo: rawCode }, { id: rawCode }],
      },
      include: {
        enrollments: {
          where: { status: "ACTIVE", batch: { status: "ACTIVE", instituteId: campusId } },
          include: { batch: true },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
    });
    if (!student) throw new Error("Card not recognised at this campus. Please contact the campus desk.");
    if (student.status !== "ACTIVE") throw new Error("Student account is inactive. Please contact the campus desk.");
    const batch = student.enrollments[0]?.batch;
    if (!batch) throw new Error("Student is not enrolled in an active batch at this campus.");

    const existing = await tx.attendance.findFirst({
      where: { studentId: student.id, batchId: batch.id, date: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
    });
    let action: "CHECK_IN" | "CHECK_OUT" = "CHECK_IN";
    let isAlreadyMarked = false;
    let message = "";
    let record = existing;

    // A network retry carries the same ID, so it can never turn a check-in
    // into a check-out even after the duplicate-scan cooldown has elapsed.
    if (existing && (existing.checkInScanId === scanId || existing.checkOutScanId === scanId)) {
      action = existing.checkOutScanId === scanId ? "CHECK_OUT" : "CHECK_IN";
      isAlreadyMarked = true;
      message = action === "CHECK_IN" ? "This check-in was already saved." : "This check-out was already saved.";
    } else if (existing?.checkOutAt) {
      action = "CHECK_OUT";
      isAlreadyMarked = true;
      message = "Already checked out today.";
    } else if (existing?.checkInAt) {
      if (now.getTime() - existing.checkInAt.getTime() < SCAN_COOLDOWN_SECONDS * 1000) {
        isAlreadyMarked = true;
        message = "Check-in saved. Repeat scan ignored; check-out is available after 30 seconds.";
      } else {
        action = "CHECK_OUT";
        record = await tx.attendance.update({
          where: { id: existing.id },
          data: { checkOutAt: now, checkOutScanId: scanId, markedBy: actor.name },
        });
        message = "Checked out at " + attendanceTime(now) + ".";
      }
    } else {
      const data = {
        status: existing?.status === "LATE" ? "LATE" : "PRESENT",
        checkInAt: now, checkInScanId: scanId,
        markedBy: actor.name,
        remarks: "QR card check-in at " + attendanceTime(now),
      };
      record = existing
        ? await tx.attendance.update({ where: { id: existing.id }, data })
        : await tx.attendance.create({ data: { ...data, studentId: student.id, batchId: batch.id, date: now } });
      message = "Checked in at " + attendanceTime(now) + ".";
    }
    if (!record) throw new Error("Attendance could not be recorded. Please scan again.");

    return {
      success: true,
      isAlreadyMarked,
      action,
      message,
      checkInTime: record.checkInAt ? attendanceTime(record.checkInAt) : null,
      checkOutTime: record.checkOutAt ? attendanceTime(record.checkOutAt) : null,
      student: {
        id: student.id, name: student.name, studentId: student.studentId,
        admissionNo: student.admissionNo, batchName: batch.name,
        gradeClass: student.gradeClass, photoUrl: student.photoUrl,
      },
      record,
    };
  });

  if (!result.isAlreadyMarked) {
    await logAudit({
      action: result.action === "CHECK_IN" ? "ATTENDANCE_CHECK_IN" : "ATTENDANCE_CHECK_OUT",
      entity: "Attendance", entityId: result.record.id,
      details: "QR " + result.action + " for " + result.student.studentId + " by " + actor.name,
    });
  }
  return result;
}

export async function getTodayAttendanceLiveFeed() {
  await requireStaffPermission("attendance.view");
  const campusId = await getActiveCampusId();
  if (!campusId) return [];
  const { start, end } = attendanceDay();
  const records = await db.attendance.findMany({
    where: {
      date: { gte: start, lt: end },
      batch: { instituteId: campusId },
      status: { in: ["PRESENT", "LATE"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      student: { select: { id: true, name: true, studentId: true, admissionNo: true } },
      batch: { select: { id: true, name: true } },
    },
  });
  return records.map((r) => ({
    id: r.id, studentId: r.student.id, studentCode: r.student.studentId,
    studentName: r.student.name, batchName: r.batch.name, status: r.status,
    markedBy: r.markedBy || "Campus staff", remarks: r.remarks || "",
    timestamp: attendanceTime(r.updatedAt),
    checkInTime: r.checkInAt ? attendanceTime(r.checkInAt) : null,
    checkOutTime: r.checkOutAt ? attendanceTime(r.checkOutAt) : null,
    gateStatus: r.checkOutAt ? "CHECKED_OUT" : r.checkInAt ? "INSIDE" : "NOT_SCANNED",
  }));
}
