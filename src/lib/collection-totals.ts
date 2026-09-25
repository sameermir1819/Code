import { db } from "./db";
import type { Prisma } from "@prisma/client";

export const postedPaymentStatuses = ["SUCCESS", "ADJUSTED", "REFUNDED"];
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

// Cash flow: collections use paymentDate; refunds use their own refundDate.
export async function collectionTotals(instituteId: string, dates?: Prisma.DateTimeFilter) {
  const payment = { student: { instituteId }, status: { in: postedPaymentStatuses } };
  const [collected, refunded] = await Promise.all([
    db.payment.aggregate({ where: { ...payment, ...(dates ? { paymentDate: dates } : {}) }, _sum: { amount: true }, _count: true }),
    db.refundAdjustment.aggregate({ where: { payment, ...(dates ? { refundDate: dates } : {}) }, _sum: { amount: true } }),
  ]);
  const gross = money(collected._sum.amount ?? 0);
  const refunds = money(refunded._sum.amount ?? 0);
  return { gross, refunds, net: money(gross - refunds), count: collected._count };
}

export function indiaDateRange(now: Date, unit: "day" | "month", monthOffset = 0) {
  const india = new Date(now.getTime() + 330 * 60_000);
  const year = india.getUTCFullYear(), month = india.getUTCMonth() + monthOffset;
  const day = unit === "month" ? 1 : india.getUTCDate();
  const start = new Date(Date.UTC(year, month, day) - 330 * 60_000);
  const end = new Date(Date.UTC(year, unit === "month" ? month + 1 : month, unit === "month" ? 1 : day + 1) - 330 * 60_000 - 1);
  return { start, end };
}
export function indiaMonthStart(now = new Date()) {
  return indiaDateRange(now, "month").start;
}

export async function financeMetrics(instituteId: string) {
  const [all, month, plans] = await Promise.all([
    collectionTotals(instituteId),
    collectionTotals(instituteId, { gte: indiaMonthStart() }),
    db.feePlan.aggregate({ where: { student: { instituteId } }, _sum: { finalAmount: true, balanceAmount: true } }),
  ]);
  return {
    totalCollected: all.net, thisMonthCollected: month.net,
    totalPending: money(plans._sum.balanceAmount ?? 0),
    totalFees: money(plans._sum.finalAmount ?? 0), paymentsCount: all.count,
  };
}
