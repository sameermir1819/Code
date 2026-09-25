import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// Read balances and write the ledger in one serializable transaction. A retry
// must re-read all balances after a competing payment or refund commits.
export async function financeTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, { isolationLevel: "Serializable" });
    } catch (error) {
      const conflict = error as { code?: string; meta?: { target?: string[] } };
      const retryable = conflict.code === "P2034" ||
        (conflict.code === "P2002" && conflict.meta?.target?.includes("receiptNo"));
      if (!retryable || attempt >= 2) throw error;
    }
  }
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function validateAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0 ||
      !Number.isSafeInteger(Math.round(amount * 100)) ||
      Math.abs(roundMoney(amount) - amount) > 1e-8) {
    throw new Error("Amount must be positive and have at most two decimal places");
  }
}
