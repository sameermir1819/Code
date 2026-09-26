"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";
import { getEffectivePermissions } from "@/lib/auth";
import { authorizedCampusId } from "@/lib/campus-scope";
import { collectionTotals, postedPaymentStatuses, indiaDateRange } from "@/lib/collection-totals";
import { getActiveCampusId } from "./campus";

export async function getDashboardStats() {
  const session = await requireStaffPermission("dashboard.view");
  const role = session.role;
  const userName = session.name || "Administrator";
  const now = new Date();
  const campusId: string | undefined = undefined;

  const permissions = await getEffectivePermissions(session);
  const required = ["SUPER_ADMIN", "ADMIN"].includes(role) ? ["students.view", "teachers.view", "batches.view", "attendance.view", "fees.view", "exams.view"] : role === "ACCOUNTANT" ? ["fees.view"] : role === "TEACHER" ? ["batches.view", "timetable.view", "exams.view"] : [];
  if (required.some((code) => !permissions.includes(code as any))) return { isAdmin: false, userRole: role, userName, message: "Dashboard contains restricted sections. Open an available module from navigation." };

  // Role Gate: Only Admins can see the Executive Dashboard Data
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  // If Admin: Return full global executive data.
  if (isAdmin) {
    const monthStart = indiaDateRange(now, "month").start;
    const monthEnd = indiaDateRange(now, "month").end;
    const todayStart = indiaDateRange(now, "day").start;
    const todayEnd = indiaDateRange(now, "day").end;
    const sixMonthsAgoStart = indiaDateRange(now, "month", -5).start;

    // Default dashboard is global; location filters live on module pages.
    const campusFilter = campusId ? { instituteId: campusId } : {};
    const studentCampusFilter = campusId ? { student: { instituteId: campusId } } : {};
    const batchCampusFilter = campusId ? { batch: { instituteId: campusId } } : {};

    // Execute ALL primary DB operations concurrently in parallel
    const [
      totalStudents,
      activeStudents,
      newAdmissionsThisMonth,
      totalTeachers,
      activeBatches,
      todayAttendanceRecords,
      todayPayments,
      monthPayments,
      feePlanAggregates,
      upcomingExams,
      recentAdmissions,
      recentPayments,
      allSixMonthPayments,
      allSixMonthRefunds,
      batchesWithCounts,
    ] = await Promise.all([
      db.student.count({ where: campusFilter }),
      db.student.count({ where: { ...campusFilter, status: "ACTIVE" } }),
      db.student.count({ where: { ...campusFilter, admissionDate: { gte: monthStart, lte: monthEnd } } }),
      db.teacher.count({ where: { ...campusFilter, status: "ACTIVE" } }),
      db.batch.count({ where: { ...campusFilter, status: "ACTIVE" } }),
      db.attendance.findMany({
        where: { ...batchCampusFilter, date: { gte: todayStart, lte: todayEnd } },
        select: { status: true },
      }),
      collectionTotals(campusId, { gte: todayStart, lte: todayEnd }),
      collectionTotals(campusId, { gte: monthStart, lte: monthEnd }),
      db.feePlan.aggregate({
        where: studentCampusFilter,
        _sum: { balanceAmount: true, totalAmount: true, paidAmount: true },
      }),
      db.exam.findMany({
        where: { ...batchCampusFilter, examDate: { gte: now } },
        take: 4,
        orderBy: { examDate: "asc" },
        select: {
          id: true,
          title: true,
          code: true,
          examDate: true,
          maxMarks: true,
          batch: { select: { name: true, code: true } },
          subject: { select: { name: true, code: true } },
        },
      }),
      db.student.findMany({
        where: campusFilter,
        take: 5,
        orderBy: { admissionDate: "desc" },
        select: {
          id: true,
          studentId: true,
          admissionNo: true,
          name: true,
          email: true,
          phone: true,
          gradeClass: true,
          photoUrl: true,
          admissionDate: true,
          enrollments: {
            where: { status: "ACTIVE" },
            select: {
              course: { select: { name: true, code: true } },
              batch: { select: { name: true, code: true } },
            },
            take: 1,
          },
        },
      }),
      db.payment.findMany({
        where: { ...studentCampusFilter, status: { in: postedPaymentStatuses } },
        take: 5,
        orderBy: { paymentDate: "desc" },
        select: {
          id: true,
          receiptNo: true,
          amount: true,
          paymentMethod: true,
          paymentDate: true,
          student: { select: { id: true, name: true, studentId: true, admissionNo: true } },
        },
      }),
      // Fetch 6-month revenue payments in 1 single bulk query scoped to campus
      db.payment.findMany({
        where: {
          ...studentCampusFilter,
          paymentDate: { gte: sixMonthsAgoStart, lte: monthEnd },
          status: { in: postedPaymentStatuses },
        },
        select: { amount: true, paymentDate: true },
      }),
      db.refundAdjustment.findMany({
        where: { payment: { ...studentCampusFilter, status: { in: postedPaymentStatuses } }, refundDate: { gte: sixMonthsAgoStart, lte: monthEnd } },
        select: { amount: true, refundDate: true },
      }),
      db.batch.findMany({
        where: { ...campusFilter, status: "ACTIVE" },
        take: 6,
        select: {
          id: true,
          name: true,
          code: true,
          capacity: true,
          _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
        },
      }),
    ]);

    // Attendance Rate Calculation
    const totalTodayAttendance = todayAttendanceRecords.length;
    const presentToday = todayAttendanceRecords.filter((a) => a.status === "PRESENT").length;
    const absentToday = todayAttendanceRecords.filter((a) => a.status === "ABSENT").length;
    const lateToday = todayAttendanceRecords.filter((a) => a.status === "LATE").length;
    const attendanceRate =
      totalTodayAttendance > 0
        ? Math.round((presentToday / totalTodayAttendance) * 100)
        : 0;

    const todayCollections = todayPayments.net;
    const monthCollections = monthPayments.net;
    const totalOutstandingFees = feePlanAggregates._sum.balanceAmount || 0;

    // Process 6-month revenue data in memory (0 DB roundtrips)
    const monthlyRevenueData = [];
    for (let i = 5; i >= 0; i--) {
      const { start: mStart, end: mEnd } = indiaDateRange(now, "month", -i);
      const label = mStart.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

      const collections = allSixMonthPayments
        .filter((p) => p.paymentDate >= mStart && p.paymentDate <= mEnd)
        .reduce((sum, p) => sum + p.amount, 0);

      const refunds = allSixMonthRefunds.filter((r) => r.refundDate >= mStart && r.refundDate <= mEnd).reduce((sum, r) => sum + r.amount, 0);
      monthlyRevenueData.push({ month: label, collections: Math.round((collections - refunds) * 100) / 100 });
    }

    // Batch Distribution
    const batchDistribution = batchesWithCounts.map((b) => ({
      name: b.name,
      code: b.code,
      students: b._count.enrollments,
      capacity: b.capacity,
    }));

    return {
      isAdmin: true,
      userRole: role,
      userName,
      stats: {
        totalStudents,
        activeStudents,
        newAdmissionsThisMonth,
        totalTeachers,
        activeBatches,
        todayCollections,
        monthCollections,
        totalOutstandingFees,
        attendanceRate,
        totalTodayAttendance,
        presentToday,
        absentToday,
        lateToday,
      },
      upcomingExams,
      recentAdmissions,
      recentPayments,
      monthlyRevenueData,
      batchDistribution,
    };
  }

  // Non-Admin: TEACHER
  if (role === "TEACHER") {
    const teacherId = session?.teacherId;
    let assignedBatches: any[] = [];
    let teacherExams: any[] = [];
    let todaySlots: any[] = [];

    if (teacherId) {
      const teacher = await db.teacher.findUnique({
        where: { id: teacherId },
        include: {
          batches: {
            include: {
              batch: {
                include: {
                  course: true,
                  _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
                },
              },
            },
          },
          timetableSlots: {
            include: { batch: true, subject: true },
          },
        },
      });

      if (teacher) {
        assignedBatches = teacher.batches.map((tb) => tb.batch);
        todaySlots = teacher.timetableSlots;
      }

      teacherExams = await db.exam.findMany({
        where: {
          batchId: { in: assignedBatches.map((b) => b.id) },
        },
        include: { batch: true, subject: true },
        take: 4,
        orderBy: { examDate: "desc" },
      });
    }

    return {
      isAdmin: false,
      userRole: role,
      userName,
      teacherData: {
        assignedBatches,
        todaySlots,
        teacherExams,
      },
    };
  }

  // Non-Admin: STUDENT
  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: session?.studentId ? { id: session.studentId } : { userId: session?.id },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { batch: true, course: true },
        },
        attendances: {
          take: 30,
          orderBy: { date: "desc" },
        },
        feePlans: {
          include: {
            installments: true,
          },
        },
        marks: {
          include: {
            exam: { include: { subject: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const totalAtt = student?.attendances.length || 0;
    const presentAtt =
      student?.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length || 0;
    const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    return {
      isAdmin: false,
      userRole: role,
      userName,
      studentData: {
        student,
        attendancePercentage: attPct,
        activeEnrollment: student?.enrollments[0] || null,
        feePlan: student?.feePlans[0] || null,
        recentMarks: student?.marks.slice(0, 5) || [],
      },
    };
  }

  // Non-Admin: ACCOUNTANT
  if (role === "ACCOUNTANT") {
    const todayStart = indiaDateRange(now, "day").start;
    const todayEnd = indiaDateRange(now, "day").end;
    const monthStart = indiaDateRange(now, "month").start;
    const monthEnd = indiaDateRange(now, "month").end;
    const studentCampusFilter = campusId ? { student: { instituteId: campusId } } : {};

    const [todayPayments, monthPayments, feePlanAggregates, recentPayments] = await Promise.all([
      collectionTotals(campusId, { gte: todayStart, lte: todayEnd }),
      collectionTotals(campusId, { gte: monthStart, lte: monthEnd }),
      db.feePlan.aggregate({
        where: studentCampusFilter,
        _sum: { balanceAmount: true },
      }),
      db.payment.findMany({
        where: { ...studentCampusFilter, status: { in: postedPaymentStatuses } },
        take: 8,
        orderBy: { paymentDate: "desc" },
        include: { student: true },
      }),
    ]);

    return {
      isAdmin: false,
      userRole: role,
      userName,
      accountantData: {
        todayCollections: todayPayments.net,
        monthCollections: monthPayments.net,
        totalOutstanding: feePlanAggregates._sum.balanceAmount || 0,
        recentPayments,
      },
    };
  }

  // Fallback
  return {
    isAdmin: false,
    userRole: role,
    userName,
    message: "Restricted View: Executive institute dashboard data is only accessible by Institute Administrators.",
  };
}
