import type { Prisma } from "@prisma/client";

// All registration creation and renumbering shares this transaction lock.
export async function lockTestSeriesNumbers(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(73190422)`;
}

function nextNumber(values: string[], prefix: string) {
  return values.reduce((max, value) => {
    const suffix = value.startsWith(prefix) ? value.slice(prefix.length) : "";
    return /^\d+$/.test(suffix) ? Math.max(max, Number(suffix)) : max;
  }, 0) + 1;
}

export async function allocateTestSeriesNumbers(tx: Prisma.TransactionClient, seriesCode: string, year: number) {
  const rollPrefix = `TS-${year}-${seriesCode}-ROLL-`;
  const receiptPrefix = `TS-REC-${year}-`;
  const rows = await tx.testSeriesRegistration.findMany({
    where: { OR: [{ rollNumber: { startsWith: rollPrefix } }, { receiptNo: { startsWith: receiptPrefix } }] },
    select: { rollNumber: true, receiptNo: true },
  });
  return {
    rollNumber: `${rollPrefix}${String(nextNumber(rows.map(r => r.rollNumber), rollPrefix)).padStart(4, "0")}`,
    receiptNo: `${receiptPrefix}${String(nextNumber(rows.map(r => r.receiptNo), receiptPrefix)).padStart(4, "0")}`,
  };
}

export async function compactTestSeriesRolls(tx: Prisma.TransactionClient, seriesIds: string[]) {
  // Legacy roll prefixes may be shared by multiple series. Reserve numbers
  // owned by other series, and process numeric order (not creation timestamps).
  const rows = await tx.testSeriesRegistration.findMany({ select: { id: true, testSeriesId: true, rollNumber: true } });
  const occupied = new Set(rows.map(r => r.rollNumber));
  for (const seriesId of [...new Set(seriesIds)].sort()) {
    const groups = new Map<string, typeof rows>();
    for (const row of rows.filter(r => r.testSeriesId === seriesId)) {
      const match = row.rollNumber.match(/^(TS-.*-ROLL-)(\d+)$/);
      if (!match) continue;
      groups.set(match[1], [...(groups.get(match[1]) || []), row]);
    }
    for (const [prefix, group] of groups) {
      group.sort((a, b) => Number(a.rollNumber.slice(prefix.length)) - Number(b.rollNumber.slice(prefix.length)));
      let sequence = 1;
      for (const row of group) {
        occupied.delete(row.rollNumber);
        let next = `${prefix}${String(sequence).padStart(4, "0")}`;
        while (occupied.has(next)) next = `${prefix}${String(++sequence).padStart(4, "0")}`;
        if (next !== row.rollNumber) await tx.testSeriesRegistration.update({ where: { id: row.id }, data: { rollNumber: next } });
        occupied.add(next);
        sequence++;
      }
    }
  }
}
