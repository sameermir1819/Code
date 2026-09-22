"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "./audit";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

export async function getBatchAttendanceForDate(batchId: string, dateStr: string) {
  await requireAuth();
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
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEACHER"]);
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
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEACHER"]);
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
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"]);

  // Calculate attendance rate per active student
  const students = await db.student.findMany({
    where: { status: "ACTIVE" },
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
  await requireAuth();

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(new Date(year, month - 1, 1));

  // Get batch info
  const batch = await db.batch.findUnique({
    where: { id: batchId },
    select: { name: true },
  });

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

import { CAMPUS_GEOFENCE, calculateDistanceMeters } from "@/lib/geofence";

export async function getCampusGeofenceConfig() {
  await requireAuth();
  return CAMPUS_GEOFENCE;
}

// ==========================================
// QR ID ATTENDANCE CHECK-IN
// ==========================================
export async function recordQrAttendance(qrPayload: string) {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "TEACHER", "ACCOUNTANT"]);

  // Parse QR code payload (could be raw studentId, code, or JSON)
  let rawCode = qrPayload.trim();
  try {
    const parsed = JSON.parse(qrPayload);
    if (parsed.studentId) rawCode = parsed.studentId;
    else if (parsed.code) rawCode = parsed.code;
    else if (parsed.id) rawCode = parsed.id;
  } catch {
    // raw string
  }

  // Find student by studentId, admissionNo, or primary id
  const student = await db.student.findFirst({
    where: {
      OR: [
        { studentId: { equals: rawCode } },
        { admissionNo: { equals: rawCode } },
        { id: { equals: rawCode } },
      ],
    },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { batch: true },
        take: 1,
      },
    },
  });

  if (!student) {
    throw new Error(`Invalid QR / ID Code "${rawCode}". No registered student matches this ID.`);
  }

  const activeBatch = student.enrollments[0]?.batch;
  if (!activeBatch) {
    throw new Error(`Student ${student.name} (${student.studentId}) is not enrolled in an active classroom batch.`);
  }

  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  // Check if already checked in today
  const existing = await db.attendance.findFirst({
    where: {
      studentId: student.id,
      batchId: activeBatch.id,
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  let record;
  let isAlreadyMarked = false;

  if (existing) {
    isAlreadyMarked = true;
    record = await db.attendance.update({
      where: { id: existing.id },
      data: {
        status: "PRESENT",
        markedBy: "QR ID Kiosk (Re-scan)",
        remarks: `Gate QR Scan at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
      },
    });
  } else {
    record = await db.attendance.create({
      data: {
        studentId: student.id,
        batchId: activeBatch.id,
        date: today,
        status: "PRESENT",
        markedBy: "QR ID Kiosk Scanner",
        remarks: `Gate Entry Verification at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
      },
    });
  }

  return {
    success: true,
    isAlreadyMarked,
    checkInTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    student: {
      id: student.id,
      name: student.name,
      studentId: student.studentId,
      admissionNo: student.admissionNo,
      gradeClass: student.gradeClass || "Senior Secondary",
      batchName: activeBatch.name,
      photoUrl: student.photoUrl,
    },
    record,
  };
}

// ==========================================
// MOBILE APP GEO CHECK-IN
// ==========================================
export async function recordGeoCheckIn(data: {
  studentId: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}) {
  await requireAuth();

  const student = await db.student.findUnique({
    where: { id: data.studentId },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { batch: true },
        take: 1,
      },
    },
  });

  if (!student) {
    throw new Error("Student account not found.");
  }

  const activeBatch = student.enrollments[0]?.batch;
  if (!activeBatch) {
    throw new Error(`Student ${student.name} is not assigned to an active batch.`);
  }

  // Calculate distance to campus
  const distance = calculateDistanceMeters(
    data.latitude,
    data.longitude,
    CAMPUS_GEOFENCE.latitude,
    CAMPUS_GEOFENCE.longitude
  );

  const isInside = distance <= CAMPUS_GEOFENCE.radiusMeters;

  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  // Check if already checked in today
  const existing = await db.attendance.findFirst({
    where: {
      studentId: student.id,
      batchId: activeBatch.id,
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  const checkInTimeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const remarks = isInside
    ? `Geo Check-in: Inside Geofence (${distance}m from gate, GPS accuracy ±${Math.round(data.accuracyMeters || 10)}m)`
    : `Geo Check-in: Outside Boundary (${distance}m from campus)`;

  const status = isInside ? "PRESENT" : "EXCUSED";

  let record;
  if (existing) {
    record = await db.attendance.update({
      where: { id: existing.id },
      data: {
        status,
        markedBy: "Student Mobile App (Geo Check-in)",
        remarks,
      },
    });
  } else {
    record = await db.attendance.create({
      data: {
        studentId: student.id,
        batchId: activeBatch.id,
        date: today,
        status,
        markedBy: "Student Mobile App (Geo Check-in)",
        remarks,
      },
    });
  }

  return {
    success: isInside,
    insideGeofence: isInside,
    distanceMeters: distance,
    radiusMeters: CAMPUS_GEOFENCE.radiusMeters,
    checkInTime: checkInTimeStr,
    message: isInside
      ? `Check-in Verified! You are ${distance}m within the campus boundary.`
      : `Outside Geofence. You are ${distance}m away from campus (Max: ${CAMPUS_GEOFENCE.radiusMeters}m).`,
    student: {
      id: student.id,
      name: student.name,
      studentId: student.studentId,
      batchName: activeBatch.name,
    },
    record,
  };
}

// ==========================================
// TODAY'S LIVE ATTENDANCE LOG (GATE / RADAR)
// ==========================================
export async function getTodayAttendanceLiveFeed() {
  await requireAuth();

  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  const records = await db.attendance.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      student: { select: { id: true, name: true, studentId: true, admissionNo: true } },
      batch: { select: { id: true, name: true } },
    },
  });

  return records.map((r) => ({
    id: r.id,
    studentId: r.student.id,
    studentCode: r.student.studentId,
    studentName: r.student.name,
    batchName: r.batch.name,
    status: r.status,
    markedBy: r.markedBy || "System",
    remarks: r.remarks || "",
    timestamp: r.updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  }));
}


