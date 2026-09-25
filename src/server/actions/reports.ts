"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";

import { getActiveCampusId } from "./campus";
import { authorizedCampusId } from "@/lib/campus-scope";
import { collectionTotals, postedPaymentStatuses } from "@/lib/collection-totals";

export async function getAuditLogs(limit = 100) {
  const session = await requireStaffPermission("audit.view");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());
  return await db.auditLog.findMany({
    where: { instituteId },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFinancialSummaryReport() {
  await requireStaffPermission("fees.view");
  const session = await requireStaffPermission("reports.view");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());

  const [collections, feePlanAggs, paymentMethods] = await Promise.all([
    collectionTotals(instituteId),
    db.feePlan.aggregate({
      where: { student: { instituteId } },
      _sum: { totalAmount: true, discountAmount: true, finalAmount: true, paidAmount: true, balanceAmount: true },
      _count: true,
    }),
    db.payment.groupBy({
      where: { student: { instituteId }, status: { in: postedPaymentStatuses } },
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
