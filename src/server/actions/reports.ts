"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function getAuditLogs(limit = 100) {
  await requireAuth(["SUPER_ADMIN"]);
  return await db.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFinancialSummaryReport() {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]);

  const [paymentAggs, refundAggs, feePlanAggs, paymentMethods] = await Promise.all([
    db.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
      _count: true,
    }),
    db.refundAdjustment.aggregate({
      _sum: { amount: true },
      _count: true,
    }),
    db.feePlan.aggregate({
      _sum: { totalAmount: true, discountAmount: true, finalAmount: true, paidAmount: true, balanceAmount: true },
      _count: true,
    }),
    db.payment.groupBy({
      by: ["paymentMethod"],
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    totalRevenueGross: feePlanAggs._sum.totalAmount || 0,
    totalDiscounts: feePlanAggs._sum.discountAmount || 0,
    totalNetBilled: feePlanAggs._sum.finalAmount || 0,
    totalCollections: paymentAggs._sum.amount || 0,
    totalRefunds: refundAggs._sum.amount || 0,
    netCollected: (paymentAggs._sum.amount || 0) - (refundAggs._sum.amount || 0),
    totalOutstanding: feePlanAggs._sum.balanceAmount || 0,
    paymentMethodsBreakdown: paymentMethods.map((pm) => ({
      method: pm.paymentMethod,
      amount: pm._sum.amount || 0,
      count: pm._count,
    })),
  };
}
