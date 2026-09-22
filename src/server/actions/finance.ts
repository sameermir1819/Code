"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "./audit";
import { getActiveCampusId } from "./campus";

// ---------------------------------------------------------------------------
// Fee Plans
// ---------------------------------------------------------------------------

export async function getFeePlans({
  status,
  search,
}: { status?: string; search?: string } = {}) {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]);

  const campusId = await getActiveCampusId();
  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;

  const studentFilter: Record<string, unknown> = {};
  if (campusId) studentFilter.instituteId = campusId;

  if (search) {
    studentFilter.OR = [
      { name: { contains: search } },
      { studentId: { contains: search } },
      { admissionNo: { contains: search } },
    ];
  }

  if (Object.keys(studentFilter).length > 0) {
    where.student = studentFilter;
  }

  return await db.feePlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        include: { parent: true },
      },
      installments: {
        orderBy: { installmentNumber: "asc" },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });
}

export async function createFeePlan(data: {
  studentId: string;
  enrollmentId?: string;
  title: string;
  admissionFee: number;
  tuitionFee: number;
  materialFee: number;
  examFee: number;
  otherCharges: number;
  discountAmount: number;
  discountReason?: string;
  installments: {
    installmentNumber: number;
    title: string;
    dueDate: Date;
    amount: number;
  }[];
}) {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]);

  const totalAmount =
    data.admissionFee +
    data.tuitionFee +
    data.materialFee +
    data.examFee +
    data.otherCharges;
  const finalAmount = Math.max(0, totalAmount - data.discountAmount);

  const feePlan = await db.feePlan.create({
    data: {
      studentId: data.studentId,
      enrollmentId: data.enrollmentId ?? null,
      title: data.title,
      admissionFee: data.admissionFee,
      tuitionFee: data.tuitionFee,
      materialFee: data.materialFee,
      examFee: data.examFee,
      otherCharges: data.otherCharges,
      totalAmount,
      discountAmount: data.discountAmount,
      discountReason: data.discountReason ?? null,
      finalAmount,
      paidAmount: 0,
      balanceAmount: finalAmount,
      status: "PENDING",
      installments: {
        create: data.installments.map((inst) => ({
          installmentNumber: inst.installmentNumber,
          title: inst.title,
          dueDate: inst.dueDate,
          amount: inst.amount,
          paidAmount: 0,
          remainingAmount: inst.amount,
          status: "UPCOMING",
        })),
      },
    },
    include: {
      installments: { orderBy: { installmentNumber: "asc" } },
    },
  });

  await logAudit({
    action: "FEE_PLAN_CREATED",
    entity: "FeePlan",
    entityId: feePlan.id,
    details: `Fee plan "${data.title}" created for student ${data.studentId}. Final amount: ₹${finalAmount}`,
  });

  return { success: true, feePlan };
}

// ---------------------------------------------------------------------------
// Student Fee Details (student/parent portal)
// ---------------------------------------------------------------------------

export async function getStudentFeeDetails(studentId: string) {
  const session = await requireAuth();

  // Security: students can only see their own fees
  if (session.role === "STUDENT" && session.studentId !== studentId) {
    throw new Error("FORBIDDEN: You can only view your own fee records");
  }

  return await db.feePlan.findMany({
    where: { studentId },
    include: {
      installments: {
        orderBy: { installmentNumber: "asc" },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        include: { refunds: true },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Payments — Record
// ---------------------------------------------------------------------------

export async function recordPayment(data: {
  studentId: string;
  feePlanId: string;
  installmentId?: string;
  amount: number;
  paymentMethod: string;
  collectedBy?: string;
  referenceNo?: string;
  notes?: string;
}) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]);

  if (!data.amount || data.amount <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  const feePlan = await db.feePlan.findUnique({
    where: { id: data.feePlanId },
    include: { installments: { orderBy: { installmentNumber: "asc" } } },
  });
  if (!feePlan) throw new Error("Fee plan not found");

  if (data.amount > feePlan.balanceAmount) {
    throw new Error(
      `Payment amount (₹${data.amount}) cannot exceed remaining balance (₹${feePlan.balanceAmount})`
    );
  }

  const year = new Date().getFullYear();
  const paymentCount = await db.payment.count();
  const receiptNo = `REC-${year}-${String(paymentCount + 1).padStart(4, "0")}`;

  // Execute in database transaction to guarantee financial integrity
  const result = await db.$transaction(async (tx) => {
    // 1. Create Payment record
    const payment = await tx.payment.create({
      data: {
        receiptNo,
        studentId: data.studentId,
        feePlanId: data.feePlanId,
        installmentId: data.installmentId || null,
        amount: data.amount,
        paymentMethod: data.paymentMethod || "UPI",
        paymentDate: new Date(),
        collectedBy: data.collectedBy || session.name || "Accounts Desk",
        referenceNo: data.referenceNo || null,
        notes: data.notes || null,
        status: "SUCCESS",
      },
    });

    // 2. Update Fee Plan balances
    const newPaidAmount = feePlan.paidAmount + data.amount;
    const newBalanceAmount = Math.max(0, feePlan.finalAmount - newPaidAmount);
    const newStatus =
      newBalanceAmount === 0 ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "PENDING";

    await tx.feePlan.update({
      where: { id: feePlan.id },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newStatus,
      },
    });

    // 3. Update Installments (cascade payment across installments)
    let remainingToDistribute = data.amount;
    for (const inst of feePlan.installments) {
      if (remainingToDistribute <= 0) break;

      if (data.installmentId && inst.id !== data.installmentId) {
        continue;
      }

      const needed = inst.remainingAmount;
      if (needed <= 0) continue;

      const toApply = Math.min(remainingToDistribute, needed);
      const newInstPaid = inst.paidAmount + toApply;
      const newInstRem = Math.max(0, inst.amount - newInstPaid);

      await tx.feeInstallment.update({
        where: { id: inst.id },
        data: {
          paidAmount: newInstPaid,
          remainingAmount: newInstRem,
          status: newInstRem === 0 ? "PAID" : "PARTIAL",
        },
      });

      remainingToDistribute -= toApply;
    }

    return payment;
  });

  await logAudit({
    action: "PAYMENT_RECORDED",
    entity: "Payment",
    entityId: result.id,
    details: `Payment recorded: ₹${data.amount} for student ${data.studentId} (${result.receiptNo}) via ${data.paymentMethod}`,
  });

  return { success: true, payment: result };
}

// ---------------------------------------------------------------------------
// Payments — Query (paginated, filterable)
// ---------------------------------------------------------------------------

export async function getPayments({
  search,
  method,
  dateFrom,
  dateTo,
  page = 1,
  limit = 20,
}: {
  search?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
} = {}) {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]);

  const campusId = await getActiveCampusId();
  const where: Record<string, unknown> = {};

  if (campusId) {
    where.student = { instituteId: campusId };
  }

  if (search) {
    where.OR = [
      { receiptNo: { contains: search } },
      { student: { name: { contains: search } } },
      { student: { studentId: { contains: search } } },
    ];
  }

  if (method && method !== "ALL") {
    where.paymentMethod = method;
  }

  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      dateFilter.lte = to;
    }
    where.paymentDate = dateFilter;
  }

  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: "desc" },
      include: {
        student: true,
        feePlan: true,
        installment: true,
      },
    }),
    db.payment.count({ where }),
  ]);

  // KPI aggregates (always computed on full SUCCESS set for dashboard widgets)
  const [totalCollectedAgg, thisMonthAgg, pendingAgg, paymentsCountAgg, feePlansAgg] =
    await Promise.all([
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCESS" },
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "SUCCESS",
          paymentDate: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ),
          },
        },
      }),
      db.feeInstallment.aggregate({
        _sum: { remainingAmount: true },
        where: { remainingAmount: { gt: 0 } },
      }),
      db.payment.count({ where: { status: "SUCCESS" } }),
      db.feePlan.aggregate({
        _sum: { finalAmount: true },
      }),
    ]);

  const collected = totalCollectedAgg._sum.amount ?? 0;
  const pending = pendingAgg._sum.remainingAmount ?? 0;
  const totalFees = feePlansAgg._sum.finalAmount ?? (collected + pending);

  return {
    payments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    kpi: {
      totalCollected: collected,
      thisMonthCollected: thisMonthAgg._sum.amount ?? 0,
      totalPending: pending,
      totalFees,
      paymentsCount: paymentsCountAgg,
    },
  };
}

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

export async function processRefund(data: {
  paymentId: string;
  amount: number;
  reason: string;
}) {
  const session = await requireAuth(["SUPER_ADMIN"]);

  const payment = await db.payment.findUnique({
    where: { id: data.paymentId },
    include: { feePlan: true },
  });
  if (!payment) throw new Error("Payment record not found");

  if (payment.status === "REFUNDED") {
    throw new Error("This payment has already been refunded");
  }

  if (data.amount > payment.amount) {
    throw new Error(`Refund amount cannot exceed original payment amount (₹${payment.amount})`);
  }

  // Atomic reversal
  const result = await db.$transaction(async (tx) => {
    // 1. Create refund audit record
    const refund = await tx.refundAdjustment.create({
      data: {
        paymentId: payment.id,
        type: "REFUND",
        amount: data.amount,
        reason: data.reason,
        approvedBy: session.name,
      },
    });

    // 2. Mark payment as REFUNDED or ADJUSTED
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: data.amount === payment.amount ? "REFUNDED" : "ADJUSTED",
      },
    });

    // 3. Re-adjust Fee Plan
    const newPaidAmount = Math.max(0, payment.feePlan.paidAmount - data.amount);
    const newBalance = Math.max(0, payment.feePlan.finalAmount - newPaidAmount);

    await tx.feePlan.update({
      where: { id: payment.feePlanId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalance,
        status: newBalance === 0 ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "PENDING",
      },
    });

    return refund;
  });

  await logAudit({
    action: "PAYMENT_REFUNDED",
    entity: "RefundAdjustment",
    entityId: result.id,
    details: `Payment ${payment.receiptNo} refunded amount ₹${data.amount}. Reason: ${data.reason}`,
  });

  return { success: true, refund: result };
}

// ---------------------------------------------------------------------------
// Receipt Details
// ---------------------------------------------------------------------------

export async function getReceiptDetails(receiptNo: string) {
  await requireAuth();

  const payment = await db.payment.findUnique({
    where: { receiptNo },
    include: {
      student: {
        include: {
          parent: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: { course: true, batch: true },
            take: 1,
          },
        },
      },
      feePlan: true,
      installment: true,
    },
  });

  if (!payment) throw new Error("Receipt not found");

  const institute = await db.institute.findFirst();

  return {
    payment,
    institute,
  };
}

// ---------------------------------------------------------------------------
// Outstanding Fees Report
// ---------------------------------------------------------------------------

export async function getOutstandingFeesReport({
  batchId,
  statusFilter,
}: { batchId?: string; statusFilter?: string } = {}) {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]);

  const campusId = await getActiveCampusId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const installmentWhere: Record<string, unknown> = {
    remainingAmount: { gt: 0 },
    ...(campusId ? { feePlan: { student: { instituteId: campusId } } } : {}),
  };

  // Status filter
  if (statusFilter === "OVERDUE") {
    installmentWhere.dueDate = { lt: today };
  } else if (statusFilter === "DUE_THIS_WEEK") {
    installmentWhere.dueDate = { gte: today, lte: weekEnd };
  }

  const overdueInstallments = await db.feeInstallment.findMany({
    where: installmentWhere,
    include: {
      feePlan: {
        include: {
          student: {
            include: {
              parent: true,
              enrollments: {
                where: {
                  status: "ACTIVE",
                  ...(batchId ? { batchId } : {}),
                },
                include: { batch: true, course: true },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // If batch filter is set, exclude students not enrolled in that batch
  const filtered = batchId
    ? overdueInstallments.filter(
        (inst) => inst.feePlan.student.enrollments.length > 0
      )
    : overdueInstallments;

  return filtered.map((inst) => {
    const dueDate = new Date(inst.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - dueDate.getTime();
    const daysOverdue = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
    const isDueToday = dueDate.getTime() === today.getTime();
    const isDueThisWeek = dueDate >= today && dueDate <= weekEnd;
    const isOverdue = dueDate < today;

    return {
      installmentId: inst.id,
      installmentTitle: inst.title,
      dueDate: inst.dueDate,
      amount: inst.amount,
      paidAmount: inst.paidAmount,
      remainingAmount: inst.remainingAmount,
      status: inst.status,
      daysOverdue,
      isDueToday,
      isDueThisWeek,
      isOverdue,
      studentId: inst.feePlan.student.id,
      studentCode: inst.feePlan.student.studentId,
      studentName: inst.feePlan.student.name,
      studentPhone: inst.feePlan.student.phone,
      parentName: inst.feePlan.student.parent?.name,
      parentPhone: inst.feePlan.student.parent?.phone,
      batchName: inst.feePlan.student.enrollments[0]?.batch?.name ?? "-",
      courseName: inst.feePlan.student.enrollments[0]?.course?.name ?? "-",
      batchId: inst.feePlan.student.enrollments[0]?.batch?.id ?? null,
      planTotalFees: inst.feePlan.finalAmount,
      planDeposited: inst.feePlan.paidAmount,
      planPending: inst.feePlan.balanceAmount,
    };
  });
}

// ---------------------------------------------------------------------------
// Student-Wise Fee Accounts (Total, Deposited, Pending per Student)
// ---------------------------------------------------------------------------

export async function getStudentFeeAccounts({
  search,
  status,
  batchId,
}: {
  search?: string;
  status?: string;
  batchId?: string;
} = {}) {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]);

  const studentWhere: Record<string, unknown> = {};

  if (search) {
    studentWhere.OR = [
      { name: { contains: search } },
      { studentId: { contains: search } },
      { admissionNo: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  if (batchId && batchId !== "ALL") {
    studentWhere.enrollments = {
      some: { batchId, status: "ACTIVE" },
    };
  }

  const students = await db.student.findMany({
    where: studentWhere,
    orderBy: { name: "asc" },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { batch: true, course: true },
        take: 1,
      },
      feePlans: {
        include: {
          installments: {
            orderBy: { installmentNumber: "asc" },
          },
          payments: {
            orderBy: { paymentDate: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const accounts = students.map((s) => {
    const totalFees = s.feePlans.reduce((sum, p) => sum + p.finalAmount, 0);
    const totalDeposited = s.feePlans.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalPending = s.feePlans.reduce((sum, p) => sum + p.balanceAmount, 0);

    let feeStatus: "PAID" | "PARTIAL" | "PENDING" | "NO_PLAN" = "PENDING";
    if (s.feePlans.length === 0) {
      feeStatus = "NO_PLAN";
    } else if (totalPending === 0 && totalFees > 0) {
      feeStatus = "PAID";
    } else if (totalDeposited > 0) {
      feeStatus = "PARTIAL";
    } else {
      feeStatus = "PENDING";
    }

    const realizationPercent =
      totalFees > 0 ? Math.min(100, Math.round((totalDeposited / totalFees) * 100)) : 0;

    return {
      studentId: s.id,
      studentCode: s.studentId,
      admissionNo: s.admissionNo,
      name: s.name,
      phone: s.phone,
      batchName: s.enrollments[0]?.batch?.name ?? s.gradeClass ?? "Unassigned",
      courseName: s.enrollments[0]?.course?.name ?? "General Course",
      totalFees,
      totalDeposited,
      totalPending,
      realizationPercent,
      feeStatus,
      feePlansCount: s.feePlans.length,
      primaryFeePlanId: s.feePlans[0]?.id ?? null,
      lastPaymentDate: s.feePlans[0]?.payments[0]?.paymentDate ?? null,
      feePlans: s.feePlans.map((p) => ({
        id: p.id,
        title: p.title,
        finalAmount: p.finalAmount,
        paidAmount: p.paidAmount,
        balanceAmount: p.balanceAmount,
        status: p.status,
      })),
    };
  });

  if (status && status !== "ALL") {
    return accounts.filter((a) => a.feeStatus === status);
  }

  return accounts;
}


// ---------------------------------------------------------------------------
// Consolidated Finance Overview (Total, Deposited, Pending)
// ---------------------------------------------------------------------------

export async function getFinanceOverview() {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]);

  const [collectedAgg, pendingAgg, feePlansAgg, thisMonthAgg] = await Promise.all([
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCESS" },
    }),
    db.feeInstallment.aggregate({
      _sum: { remainingAmount: true },
      where: { remainingAmount: { gt: 0 } },
    }),
    db.feePlan.aggregate({
      _sum: { finalAmount: true },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "SUCCESS",
        paymentDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  const totalCollected = collectedAgg._sum.amount ?? 0;
  const totalPending = pendingAgg._sum.remainingAmount ?? 0;
  const totalFees = feePlansAgg._sum.finalAmount ?? (totalCollected + totalPending);
  const thisMonthCollected = thisMonthAgg._sum.amount ?? 0;

  return {
    totalFees,
    totalCollected,
    totalPending,
    thisMonthCollected,
  };
}
