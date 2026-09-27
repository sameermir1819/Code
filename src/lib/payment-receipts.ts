import type { Prisma } from "@prisma/client";

export async function allocatePaymentReceiptNumber(
  tx: Prisma.TransactionClient,
  year: number,
) {
  const prefix = `REC-${year}-`;

  // Admissions can be submitted concurrently. Serialize number allocation for
  // this year so two transactions cannot issue the same receipt number.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`payment-receipt-${year}`}))`;

  const existingReceipts = await tx.payment.findMany({
    where: { receiptNo: { startsWith: prefix } },
    select: { receiptNo: true },
  });
  const highestNumber = existingReceipts.reduce((highest, payment) => {
    const suffix = payment.receiptNo.slice(prefix.length);
    return /^\d+$/.test(suffix) ? Math.max(highest, Number(suffix)) : highest;
  }, 0);

  return `${prefix}${String(highestNumber + 1).padStart(4, "0")}`;
}
