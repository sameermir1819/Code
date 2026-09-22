"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getActiveCampusId } from "./campus";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from "date-fns";

export async function getDashboardStats() {
  const session = await getSession();
  const role = session?.role || "SUPER_ADMIN";
  const userName = session?.name || "Administrator";
  const now = new Date();
  const campusId = await getActiveCampusId();

  // Role Gate: Only Admins can see the Executive Dashboard Data
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  // If Admin: Return Full Executive Data scoped to active campus
  if (isAdmin) {
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const sixMonthsAgoStart = startOfMonth(subMonths(now, 5));

    // Base filter scoped to active campus
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
      db.payment.aggregate({
        where: { ...studentCampusFilter, paymentDate: { gte: todayStart, lte: todayEnd }, status: "SUCCESS" },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { ...studentCampusFilter, paymentDate: { gte: monthStart, lte: monthEnd }, status: "SUCCESS" },
        _sum: { amount: true },
      }),
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
        where: { ...studentCampusFilter, status: "SUCCESS" },
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
          status: "SUCCESS",
        },
        select: { amount: true, paymentDate: true },
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

    const todayCollections = todayPayments._sum.amount || 0;
    const monthCollections = monthPayments._sum.amount || 0;
    const totalOutstandingFees = feePlanAggregates._sum.balanceAmount || 0;

    // Process 6-month revenue data in memory (0 DB roundtrips)
    const monthlyRevenueData = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = subMonths(now, i);
      const mStart = startOfMonth(mDate);
      const mEnd = endOfMonth(mDate);
      const label = format(mDate, "MMM yyyy");

      const collections = allSixMonthPayments
        .filter((p) => p.paymentDate >= mStart && p.paymentDate <= mEnd)
        .reduce((sum, p) => sum + p.amount, 0);

      monthlyRevenueData.push({ month: label, collections });
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
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const studentCampusFilter = campusId ? { student: { instituteId: campusId } } : {};

    const [todayPayments, monthPayments, feePlanAggregates, recentPayments] = await Promise.all([
      db.payment.aggregate({
        where: { ...studentCampusFilter, paymentDate: { gte: todayStart, lte: todayEnd }, status: "SUCCESS" },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { ...studentCampusFilter, paymentDate: { gte: monthStart, lte: monthEnd }, status: "SUCCESS" },
        _sum: { amount: true },
      }),
      db.feePlan.aggregate({
        where: studentCampusFilter,
        _sum: { balanceAmount: true },
      }),
      db.payment.findMany({
        where: { ...studentCampusFilter, status: "SUCCESS" },
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
        todayCollections: todayPayments._sum.amount || 0,
        monthCollections: monthPayments._sum.amount || 0,
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
