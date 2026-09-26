"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";

import { getActiveCampusId } from "./campus";
import { authorizedCampusId } from "@/lib/campus-scope";
import { collectionTotals, postedPaymentStatuses } from "@/lib/collection-totals";

export async function getAuditLogs(limit = 100) {
  await requireStaffPermission("audit.view");
  return await db.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFinancialSummaryReport() {
  await requireStaffPermission("fees.view");
  await requireStaffPermission("reports.view");
  const instituteId: string | undefined = undefined;

  const [collections, feePlanAggs, paymentMethods] = await Promise.all([
    collectionTotals(instituteId),
    db.feePlan.aggregate({
      where: {},
      _sum: { totalAmount: true, discountAmount: true, finalAmount: true, paidAmount: true, balanceAmount: true },
      _count: true,
    }),
    db.payment.groupBy({
      where: { status: { in: postedPaymentStatuses } },
      by: ["paymentMethod"],
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    totalRevenueGross: feePlanAggs._sum.totalAmount || 0,
    totalDiscounts: feePlanAggs._sum.discountAmount || 0,
    totalNetBilled: feePlanAggs._sum.finalAmount || 0,
    totalCollections: collections.gross,
    totalRefunds: collections.refunds,
    netCollected: collections.net,
    totalOutstanding: feePlanAggs._sum.balanceAmount || 0,
    paymentMethodsBreakdown: paymentMethods.map((pm) => ({
      method: pm.paymentMethod,
      amount: pm._sum.amount || 0,
      count: pm._count,
    })),
  };
}
