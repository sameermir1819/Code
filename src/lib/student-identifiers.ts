import type { Prisma } from "@prisma/client";

export async function allocateStudentIdentifiers(
  tx: Prisma.TransactionClient,
  instituteId: string,
  date = new Date(),
) {
  const institute = await tx.campus.findUnique({
    where: { id: instituteId },
    select: { code: true },
  });
  if (!institute) throw new Error("Campus not found while generating student ID.");

  const year = date.getFullYear();
  const sequence = await tx.studentIdSequence.upsert({
    where: { instituteId_year: { instituteId, year } },
    create: { instituteId, year, nextNumber: 2 },
    update: { nextNumber: { increment: 1 } },
    select: { nextNumber: true },
  });
  const number = sequence.nextNumber - 1;
  const normalizedCampusCode = institute.code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/^(FX|FL)-/, "");
  const campusCode = (normalizedCampusCode || "CMP").slice(0, 3);
  const shortYear = String(year).slice(-2);
  const suffix = String(number).padStart(3, "0");

  return {
    studentId: `${campusCode}-${shortYear}-${suffix}`,
    admissionNo: `ADM-${campusCode}-${shortYear}-${suffix}`,
  };
}
