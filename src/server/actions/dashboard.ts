"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from "date-fns";

export async function getDashboardStats() {
  const session = await getSession();
  const role = session?.role || "SUPER_ADMIN";
  const userName = session?.name || "Administrator";
  const now = new Date();

  // Role Gate: Only Admins can see the Executive Dashboard Data
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  // If Admin: Return Full Executive Data
  if (isAdmin) {
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 1. Student stats
    const totalStudents = await db.student.count();
    const activeStudents = await db.student.count({ where: { status: "ACTIVE" } });
    const newAdmissionsThisMonth = await db.student.count({
      where: { admissionDate: { gte: monthStart, lte: monthEnd } },
    });

    // 2. Teachers and Batches
    const totalTeachers = await db.teacher.count({ where: { status: "ACTIVE" } });
    const activeBatches = await db.batch.count({ where: { status: "ACTIVE" } });

    // 3. Today's Attendance
    const todayAttendanceRecords = await db.attendance.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
    });
    const totalTodayAttendance = todayAttendanceRecords.length;
    const presentToday = todayAttendanceRecords.filter((a) => a.status === "PRESENT").length;
    const absentToday = todayAttendanceRecords.filter((a) => a.status === "ABSENT").length;
    const lateToday = todayAttendanceRecords.filter((a) => a.status === "LATE").length;
    const attendanceRate =
      totalTodayAttendance > 0
        ? Math.round((presentToday / totalTodayAttendance) * 100)
        : 0;

    // 4. Financial metrics (Restricted to Admins)
    const todayPayments = await db.payment.aggregate({
      where: { paymentDate: { gte: todayStart, lte: todayEnd }, status: "SUCCESS" },
      _sum: { amount: true },
    });
    const todayCollections = todayPayments._sum.amount || 0;

    const monthPayments = await db.payment.aggregate({
      where: { paymentDate: { gte: monthStart, lte: monthEnd }, status: "SUCCESS" },
      _sum: { amount: true },
    });
    const monthCollections = monthPayments._sum.amount || 0;

    const feePlanAggregates = await db.feePlan.aggregate({
      _sum: { balanceAmount: true, totalAmount: true, paidAmount: true },
    });
    const totalOutstandingFees = feePlanAggregates._sum.balanceAmount || 0;

    // 5. Upcoming tests/exams
    const upcomingExams = await db.exam.findMany({
      where: { examDate: { gte: now } },
      take: 4,
      orderBy: { examDate: "asc" },
      include: {
        batch: true,
        subject: true,
      },
    });

    // 6. Recent admissions (Restricted to Admins)
    const recentAdmissions = await db.student.findMany({
      take: 5,
      orderBy: { admissionDate: "desc" },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { course: true, batch: true },
          take: 1,
        },
      },
    });

    // 7. Recent payments (Restricted to Admins)
    const recentPayments = await db.payment.findMany({
      take: 5,
      orderBy: { paymentDate: "desc" },
      include: {
        student: true,
      },
    });

    // 8. Monthly revenue chart data (past 6 months)
    const monthlyRevenueData = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = subMonths(now, i);
      const mStart = startOfMonth(mDate);
      const mEnd = endOfMonth(mDate);
      const label = format(mDate, "MMM yyyy");

      const agg = await db.payment.aggregate({
        where: {
          paymentDate: { gte: mStart, lte: mEnd },
          status: "SUCCESS",
        },
        _sum: { amount: true },
      });

      monthlyRevenueData.push({
        month: label,
        collections: agg._sum.amount || 0,
      });
    }

    // 9. Batch distribution data
    const batchesWithCounts = await db.batch.findMany({
      where: { status: "ACTIVE" },
      take: 6,
      include: {
        _count: {
          select: { enrollments: { where: { status: "ACTIVE" } } },
        },
      },
    });

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
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const todayPayments = await db.payment.aggregate({
      where: { paymentDate: { gte: todayStart, lte: todayEnd }, status: "SUCCESS" },
      _sum: { amount: true },
    });

    const monthPayments = await db.payment.aggregate({
      where: { paymentDate: { gte: monthStart, lte: monthEnd }, status: "SUCCESS" },
      _sum: { amount: true },
    });

    const feePlanAggregates = await db.feePlan.aggregate({
      _sum: { balanceAmount: true },
    });

    const recentPayments = await db.payment.findMany({
      take: 8,
      orderBy: { paymentDate: "desc" },
      include: { student: true },
    });

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

  // Fallback for Parent or generic user
  return {
    isAdmin: false,
    userRole: role,
    userName,
    message: "Restricted View: Executive institute dashboard data is only accessible by Institute Administrators.",
  };
}
