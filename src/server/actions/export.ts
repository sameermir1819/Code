"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";

import { authorizedCampusId } from "@/lib/campus-scope";
import { getActiveCampusId } from "./campus";

// Helper function to escape CSV cell content
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

// Helper to build CSV string with UTF-8 BOM for Excel compatibility
function buildCSV(headers: string[], rows: any[][]): string {
  const BOM = "\uFEFF";
  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");
  return BOM + headerLine + (rows.length > 0 ? "\r\n" + dataLines : "");
}

// =========================================================================
// 1. EXPORT STUDENTS CSV
// =========================================================================
export async function exportStudentsCSV(campusId?: string) {
  await requireStaffPermission("students.view");
  await requireStaffPermission("fees.view");
  const actor = await requireStaffPermission("exports.view");
  const activeCampusId = authorizedCampusId(actor, campusId || (await getActiveCampusId()));

  const where: any = {};
  if (activeCampusId && activeCampusId !== "ALL") {
    where.instituteId = activeCampusId;
  }

  const students = await db.student.findMany({
    where,
    include: {
      institute: {
        select: {
          name: true,
          code: true,
        },
      },
      parent: {
        select: {
          name: true,
          phone: true,
          email: true,
          relation: true,
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          batch: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Admission No",
    "Student ID",
    "Full Name",
    "Email",
    "Phone",
    "Campus Name",
    "Campus Code",
    "Active Batch",
    "Course",
    "Parent Name",
    "Parent Phone",
    "Parent Relation",
    "Gender",
    "Date of Birth",
    "School / College",
    "Grade / Class",
    "Address",
    "City",
    "Status",
    "Admission Date",
  ];

  const rows = students.map((s) => {
    const activeEnrollment = s.enrollments[0];
    const batchName = activeEnrollment?.batch?.name || "Unassigned";
    const courseName = activeEnrollment?.batch?.course?.name || "N/A";
    const admissionDate = s.admissionDate
      ? new Date(s.admissionDate).toLocaleDateString("en-IN")
      : new Date(s.createdAt).toLocaleDateString("en-IN");
    const dob = s.dob ? new Date(s.dob).toLocaleDateString("en-IN") : "";

    return [
      s.admissionNo || "N/A",
      s.studentId || "N/A",
      s.name,
      s.email || "N/A",
      s.phone || "N/A",
      s.institute?.name || "Main Campus",
      s.institute?.code || "N/A",
      batchName,
      courseName,
      s.parent?.name || "N/A",
      s.parent?.phone || "N/A",
      s.parent?.relation || "Guardian",
      s.gender || "N/A",
      dob,
      s.schoolCollege || "N/A",
      s.gradeClass || "N/A",
      s.address || "N/A",
      s.city || "N/A",
      s.status || "ACTIVE",
      admissionDate,
    ];
  });

  const csv = buildCSV(headers, rows);
  const filename = `students_export_${new Date().toISOString().split("T")[0]}.csv`;

  return { success: true, csv, filename, count: students.length };
}

// =========================================================================
// 2. EXPORT PAYMENTS & FEE TRANSACTIONS CSV
// =========================================================================
export async function exportPaymentsCSV(campusId?: string) {
  await requireStaffPermission("fees.view");
  const actor = await requireStaffPermission("exports.view");
  const activeCampusId = authorizedCampusId(actor, campusId || (await getActiveCampusId()));

  const where: any = {};
  if (activeCampusId && activeCampusId !== "ALL") {
    where.student = {
      instituteId: activeCampusId,
    };
  }

  const payments = await db.payment.findMany({
    where,
    include: {
      student: {
        include: {
          institute: true,
          parent: true,
        },
      },
      feePlan: true,
    },
    orderBy: { paymentDate: "desc" },
  });

  const headers = [
    "Receipt No",
    "Student Name",
    "Admission No",
    "Student Phone",
    "Campus Name",
    "Amount Paid (INR)",
    "Payment Mode",
    "Transaction / Ref No",
    "Payment Date",
    "Status",
    "Collected By",
    "Notes",
  ];

  const rows = payments.map((p) => {
    const student = p.student;
    const campus = student?.institute?.name || "Main Campus";
    const paymentDate = p.paymentDate
      ? new Date(p.paymentDate).toLocaleDateString("en-IN")
      : new Date(p.createdAt).toLocaleDateString("en-IN");

    return [
      p.receiptNo || p.id,
      student?.name || "N/A",
      student?.admissionNo || "N/A",
      student?.phone || "N/A",
      campus,
      p.amount,
      p.paymentMethod || "UPI",
      p.referenceNo || "N/A",
      paymentDate,
      p.status || "SUCCESS",
      p.collectedBy || "Accounts Desk",
      p.notes || "",
    ];
  });

  const csv = buildCSV(headers, rows);
  const filename = `payments_ledger_${new Date().toISOString().split("T")[0]}.csv`;

  return { success: true, csv, filename, count: payments.length };
}

// =========================================================================
// 3. EXPORT FEE DEFAULTERS & PENDING DUES CSV
// =========================================================================
export async function exportDefaultersCSV(campusId?: string) {
  await requireStaffPermission("fees.view");
  const actor = await requireStaffPermission("exports.view");
  const activeCampusId = authorizedCampusId(actor, campusId || (await getActiveCampusId()));

  const where: any = {
    balanceAmount: { gt: 0 },
  };
  if (activeCampusId && activeCampusId !== "ALL") {
    where.student = {
      instituteId: activeCampusId,
    };
  }

  const feePlans = await db.feePlan.findMany({
    where,
    include: {
      student: {
        include: {
          parent: true,
          institute: true,
        },
      },
      installments: {
        where: { remainingAmount: { gt: 0 } },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { balanceAmount: "desc" },
  });

  const headers = [
    "Student Name",
    "Admission No",
    "Student Phone",
    "Parent Name",
    "Parent Phone",
    "Campus Name",
    "Total Plan Fee (INR)",
    "Discount (INR)",
    "Final Fee (INR)",
    "Paid Amount (INR)",
    "Pending Balance (INR)",
    "Status",
    "Earliest Overdue Date",
  ];

  const rows = feePlans.map((f) => {
    const student = f.student;
    const campus = student?.institute?.name || "Main Campus";
    const earliestDueDate = f.installments[0]?.dueDate
      ? new Date(f.installments[0].dueDate).toLocaleDateString("en-IN")
      : "Not Set";

    return [
      student?.name || "N/A",
      student?.admissionNo || "N/A",
      student?.phone || "N/A",
      student?.parent?.name || "N/A",
      student?.parent?.phone || "N/A",
      campus,
      f.totalAmount,
      f.discountAmount || 0,
      f.finalAmount,
      f.paidAmount,
      f.balanceAmount,
      f.status,
      earliestDueDate,
    ];
  });

  const csv = buildCSV(headers, rows);
  const filename = `fee_defaulters_${new Date().toISOString().split("T")[0]}.csv`;

  return { success: true, csv, filename, count: rows.length };
}

// =========================================================================
// 4. EXPORT BATCHES CSV
// =========================================================================
export async function exportBatchesCSV(campusId?: string) {
  await requireStaffPermission("batches.view");
  const actor = await requireStaffPermission("exports.view");
  const activeCampusId = authorizedCampusId(actor, campusId || (await getActiveCampusId()));

  const where: any = {};
  if (activeCampusId && activeCampusId !== "ALL") {
    where.instituteId = activeCampusId;
  }

  const batches = await db.batch.findMany({
    where,
    include: {
      course: true,
      institute: true,
      _count: {
        select: {
          enrollments: {
            where: { status: "ACTIVE" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Batch Name",
    "Batch Code",
    "Course Name",
    "Campus Name",
    "Campus Code",
    "Active Students",
    "Max Capacity",
    "Start Date",
    "End Date",
    "Status",
  ];

  const rows = batches.map((b) => [
    b.name,
    b.code || "N/A",
    b.course?.name || "N/A",
    b.institute?.name || "Main Campus",
    b.institute?.code || "N/A",
    b._count.enrollments,
    b.capacity || "Unlimited",
    b.startDate ? new Date(b.startDate).toLocaleDateString("en-IN") : "N/A",
    b.endDate ? new Date(b.endDate).toLocaleDateString("en-IN") : "N/A",
    b.status || "ACTIVE",
  ]);

  const csv = buildCSV(headers, rows);
  const filename = `batches_export_${new Date().toISOString().split("T")[0]}.csv`;

  return { success: true, csv, filename, count: batches.length };
}

// =========================================================================
// 5. EXPORT LEADS & INQUIRIES CSV
// =========================================================================
export async function exportLeadsCSV(campusId?: string) {
  await requireStaffPermission("leads.view");
  const actor = await requireStaffPermission("exports.view");
  const activeCampusId = authorizedCampusId(actor, campusId || (await getActiveCampusId()));

  const where: any = {};
  if (activeCampusId && activeCampusId !== "ALL") {
    where.instituteId = activeCampusId;
  }

  const leads = await db.lead.findMany({
    where,
    include: {
      institute: {
        select: { name: true, code: true },
      },
      followUps: {
        orderBy: { date: "desc" },
        take: 1,
      },
      _count: {
        select: { followUps: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Lead ID",
    "Student Name",
    "Phone",
    "Email",
    "Parent Name",
    "Parent Phone",
    "Course Interested",
    "School / College",
    "Campus",
    "Lead Source",
    "Status",
    "Priority",
    "Counselor Assigned",
    "Total Follow-ups",
    "Next Follow-up Date",
    "Notes",
    "Inquiry Date",
  ];

  const rows = leads.map((l) => [
    l.id,
    l.name,
    l.phone,
    l.email || "N/A",
    l.parentName || "N/A",
    l.parentPhone || "N/A",
    l.courseInterest || "N/A",
    l.currentSchool || "N/A",
    l.institute?.name || "Main Campus",
    l.source,
    l.status,
    l.priority,
    l.assignedTo || "Unassigned",
    l._count.followUps,
    l.nextFollowUp
      ? new Date(l.nextFollowUp).toLocaleDateString("en-IN")
      : "None Scheduled",
    l.notes || "",
    new Date(l.createdAt).toLocaleDateString("en-IN"),
  ]);

  const csv = buildCSV(headers, rows);
  const filename = `leads_crm_export_${new Date().toISOString().split("T")[0]}.csv`;

  return { success: true, csv, filename, count: leads.length };
}

// =========================================================================
// 6. COMPLETE INSTITUTION DATA BACKUP (JSON)
// =========================================================================
export async function exportFullBackupJSON(campusId?: string) {
  await requireStaffPermission("students.view");
  await requireStaffPermission("courses.view");
  await requireStaffPermission("batches.view");
  await requireStaffPermission("fees.view");
  await requireStaffPermission("leads.view");
  await requireStaffPermission("attendance.view");
  await requireStaffPermission("users.view");
  const actor = await requireStaffPermission("exports.view");
  const activeCampusId = authorizedCampusId(actor, campusId || (await getActiveCampusId()));

  const instituteWhere: any = {};
  if (activeCampusId && activeCampusId !== "ALL") {
    instituteWhere.id = activeCampusId;
  }

  const campusFilter =
    activeCampusId && activeCampusId !== "ALL" ? { instituteId: activeCampusId } : {};

  // Fetch all core data in parallel
  const [
    institutes,
    courses,
    batches,
    students,
    feePlans,
    payments,
    leads,
    attendanceRecords,
  ] = await Promise.all([
    db.campus.findMany({ where: instituteWhere }),
    db.course.findMany({ where: campusFilter }),
    db.batch.findMany({
      where: campusFilter,
      include: { enrollments: true },
    }),
    db.student.findMany({
      where: campusFilter,
      include: {
        parent: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
    db.feePlan.findMany({
      where: activeCampusId && activeCampusId !== "ALL" ? { student: { instituteId: activeCampusId } } : {},
      include: { installments: true },
    }),
    db.payment.findMany({
      where: activeCampusId && activeCampusId !== "ALL" ? { student: { instituteId: activeCampusId } } : {},
    }),
    db.lead.findMany({
      where: campusFilter,
      include: { followUps: true },
    }),
    db.attendance.findMany({
      where: activeCampusId && activeCampusId !== "ALL" ? { batch: { instituteId: activeCampusId } } : {},
      take: 2000,
      orderBy: { date: "desc" },
    }),
  ]);

  const backupPayload = {
    exportedAt: new Date().toISOString(),
    version: "2.0-ERP",
    scope: activeCampusId === "ALL" ? "GLOBAL_ALL_CAMPUSES" : activeCampusId,
    stats: {
      campuses: institutes.length,
      courses: courses.length,
      batches: batches.length,
      students: students.length,
      feePlans: feePlans.length,
      payments: payments.length,
      leads: leads.length,
      attendance: attendanceRecords.length,
    },
    data: {
      institutes,
      courses,
      batches,
      students,
      feePlans,
      payments,
      leads,
      attendanceRecords,
    },
  };

  const jsonString = JSON.stringify(backupPayload, null, 2);
  const filename = `erp_backup_${activeCampusId === "ALL" ? "all" : "campus"}_${new Date().toISOString().split("T")[0]}.json`;

  return {
    success: true,
    json: jsonString,
    filename,
    stats: backupPayload.stats,
  };
}
