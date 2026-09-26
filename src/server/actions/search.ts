"use server";

import { db } from "@/lib/db";
import { getSession, getEffectivePermissions } from "@/lib/auth";
import { getActiveCampusId } from "./campus";
import { authorizedCampusId } from "@/lib/campus-scope";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "STUDENT" | "BATCH" | "RECEIPT" | "NAVIGATION";
  href: string;
  badge?: string;
}

export async function globalQuickSearch(query: string): Promise<SearchResultItem[]> {
  const session = await getSession();
  if (!session || ["STUDENT", "PARENT"].includes(session.role)) return [];

  const q = query.trim();
  if (!q || q.length < 2) return [];

  try {
    const permissions = await getEffectivePermissions(session);
    const canReadStudents = permissions.includes("students.view");
    const canReadFinance = permissions.includes("fees.view");
    const canReadAcademics = permissions.includes("batches.view");
    const canReadFaculty = permissions.includes("teachers.view");
    const [students, batches, payments, teachers] = await Promise.all([
      canReadStudents ? db.student.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { studentId: { contains: q, mode: "insensitive" } },
            { admissionNo: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          studentId: true,
          admissionNo: true,
          status: true,
          gradeClass: true,
        },
        take: 5,
      }) : Promise.resolve([]),
      canReadAcademics ? db.batch.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
        },
        take: 4,
      }) : Promise.resolve([]),
      canReadFinance ? db.payment.findMany({
        where: {
          OR: [
            { receiptNo: { contains: q, mode: "insensitive" } },
            { referenceNo: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          receiptNo: true,
          amount: true,
          paymentDate: true,
          student: {
            select: { name: true },
          },
        },
        take: 4,
      }) : Promise.resolve([]),
      canReadFaculty ? db.teacher.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { teacherId: { contains: q, mode: "insensitive" } },
            { specialization: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          teacherId: true,
          specialization: true,
          status: true,
        },
        take: 3,
      }) : Promise.resolve([]),
    ]);

    const results: SearchResultItem[] = [];

    // Map Students
    students.forEach((s) => {
      results.push({
        id: `student-${s.id}`,
        title: s.name,
        subtitle: `Roll: ${s.studentId} • Adm: ${s.admissionNo} • ${s.gradeClass || "Classroom"}`,
        category: "STUDENT",
        href: `/students/${s.id}`,
        badge: s.status,
      });
    });

    // Map Batches
    batches.forEach((b) => {
      results.push({
        id: `batch-${b.id}`,
        title: b.name,
        subtitle: `Batch Code: ${b.code}`,
        category: "BATCH",
        href: `/dashboard/batches/${b.id}`,
        badge: b.status,
      });
    });

    // Map Payments
    payments.forEach((p) => {
      results.push({
        id: `receipt-${p.id}`,
        title: `Receipt #${p.receiptNo}`,
        subtitle: `₹${p.amount.toLocaleString("en-IN")} • ${p.student.name}`,
        category: "RECEIPT",
        href: `/finance/receipts/${p.receiptNo}`,
      });
    });

    // Map Faculty / Teachers
    teachers.forEach((t) => {
      results.push({
        id: `faculty-${t.id}`,
        title: t.name,
        subtitle: `Faculty ID: ${t.teacherId} • ${t.specialization || "Instructor"}`,
        category: "NAVIGATION",
        href: `/faculty`,
        badge: t.status,
      });
    });

    return results;
  } catch (err) {
    console.error("Global search error:", err);
    return [];
  }
}
