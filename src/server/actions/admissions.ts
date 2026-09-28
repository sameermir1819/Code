"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";

import { logAudit } from "./audit";
import { getActiveCampusId } from "./campus";
import { createStudentUser } from "@/lib/student-user";
import { authorizedCampusId } from "@/lib/campus-scope";
import { allocateStudentIdentifiers } from "@/lib/student-identifiers";
import { allocatePaymentReceiptNumber } from "@/lib/payment-receipts";
import { roundMoney } from "@/lib/finance-transaction";
import type { Prisma } from "@prisma/client";

export interface AdmissionPayload {
  // Student
  name: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender: string;
  address?: string;
  city?: string;
  state?: string;
  emergencyContact?: string;
  schoolCollege?: string;
  gradeClass?: string;
  admissionDate?: string;
  // Parent
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentRelation?: string;
  parentOccupation?: string;
  // Academic
  campusId?: string;
  batchId: string;
  admissionSource?: "DIRECT_ADMISSION" | "SCHOLARSHIP_TEST";
  scholarshipTestName?: string;
  scholarshipTestDate?: string;
  scholarshipRollNumber?: string;
  scholarshipMarks?: number;
  scholarshipMaxMarks?: number;
  scholarshipRank?: number;
  // Fees
  admissionFee: number;
  tuitionFee: number;
  materialFee: number;
  examFee: number;
  discountAmount: number;
  discountReason?: string;
  installmentCount: number; // 1, 2, 3, or 4
  // Initial Payment
  initialPaymentAmount: number;
  paymentMethod: string;
  paymentDate?: string;
  referenceNo?: string;
  notes?: string;
}

function parseDate(value: string, label: string) {
  const date = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is invalid.`);
  }
  return date;
}

function hasReceiptTarget(error: { meta?: { target?: string[] | string } }) {
  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.join(",")
    : String(error.meta?.target || "");
  return target.includes("receiptNo");
}

async function runAdmissionTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 30000,
      });
    } catch (error: unknown) {
      const conflict = error as { code?: string; meta?: { target?: string[] | string } };
      const retryable = conflict.code === "P2034" ||
        (conflict.code === "P2002" && hasReceiptTarget(conflict));
      if (!retryable || attempt >= 2) throw error;
    }
  }
}

async function processAdmissionOrThrow(payload: AdmissionPayload) {
  await requireStaffPermission("fees.create");
  await requireStaffPermission("fees.update");
  const session = await requireStaffPermission("students.create");
  if (
    payload.campusId &&
    session.role !== "SUPER_ADMIN" &&
    session.instituteId &&
    payload.campusId !== session.instituteId
  ) {
    throw new Error("You can only admit students to your assigned campus.");
  }

  const campusId = authorizedCampusId(
    session,
    payload.campusId || (await getActiveCampusId())
  );

  const batch = await db.batch.findFirst({
    where: { id: payload.batchId, instituteId: campusId, status: "ACTIVE" },
    include: { course: true },
  });
  if (!batch) throw new Error("Selected batch does not belong to the selected location.");
  const course = batch.course;

  const year = new Date().getFullYear();

  if (!payload.name?.trim()) throw new Error("Student name is required.");
  if (!payload.parentName?.trim()) throw new Error("Parent or guardian name is required.");
  if (!payload.parentPhone?.trim()) throw new Error("Parent phone number is required.");

  const moneyValues = [
    payload.admissionFee,
    payload.tuitionFee,
    payload.materialFee,
    payload.examFee,
    payload.discountAmount,
    payload.initialPaymentAmount,
  ];
  if (moneyValues.some((value) => !Number.isFinite(value) || !Number.isSafeInteger(Math.round(value * 100)) || value < 0 || Math.abs(roundMoney(value) - value) > 1e-8)) {
    throw new Error("Fee and payment amounts must be non-negative with at most two decimal places.");
  }
  if (![1, 2, 3, 4].includes(payload.installmentCount)) {
    throw new Error("Installment count must be between 1 and 4.");
  }

  if (payload.admissionSource && !["DIRECT_ADMISSION", "SCHOLARSHIP_TEST"].includes(payload.admissionSource)) {
    throw new Error("Invalid admission type.");
  }
  const admissionSource = payload.admissionSource === "SCHOLARSHIP_TEST"
    ? "SCHOLARSHIP_TEST"
    : "DIRECT_ADMISSION";
  const finalAdmissionDate = payload.admissionDate ? parseDate(payload.admissionDate, "Admission date") : new Date();
  const paymentDate = payload.paymentDate ? parseDate(payload.paymentDate, "Payment date") : finalAdmissionDate;
  const dateOfBirth = payload.dob ? parseDate(payload.dob, "Date of birth") : null;
  if (dateOfBirth && dateOfBirth > finalAdmissionDate) throw new Error("Date of birth cannot be after admission date.");
  let scholarshipPercentage: number | null = null;
  let scholarshipTestDate: Date | null = null;
  if (admissionSource === "SCHOLARSHIP_TEST") {
    if (!payload.scholarshipTestName?.trim()) throw new Error("Scholarship test name is required.");
    if (!payload.scholarshipTestDate) throw new Error("Scholarship test date is required.");
    scholarshipTestDate = parseDate(payload.scholarshipTestDate, "Scholarship test date");
    if (!payload.scholarshipRollNumber?.trim()) throw new Error("Scholarship test roll number is required.");
    if (!Number.isFinite(payload.scholarshipMarks) || !Number.isFinite(payload.scholarshipMaxMarks) ||
        payload.scholarshipMarks! < 0 || payload.scholarshipMaxMarks! <= 0 ||
        payload.scholarshipMarks! > payload.scholarshipMaxMarks!) {
      throw new Error("Scholarship marks must be between zero and the maximum marks.");
    }
    if (payload.scholarshipRank !== undefined &&
        (!Number.isInteger(payload.scholarshipRank) || payload.scholarshipRank < 1)) {
      throw new Error("Scholarship rank must be a positive whole number.");
    }
    scholarshipPercentage = roundMoney((payload.scholarshipMarks! / payload.scholarshipMaxMarks!) * 100);
  }

  // Calculate fee sums
  const totalGross = roundMoney(
    payload.admissionFee + payload.tuitionFee + payload.materialFee + payload.examFee
  );
  if (payload.discountAmount > totalGross) throw new Error("Scholarship discount cannot exceed the gross fee.");
  const finalFee = roundMoney(totalGross - payload.discountAmount);
  const paid = roundMoney(payload.initialPaymentAmount);
  if (paid > finalFee) throw new Error("Initial payment cannot exceed the final fee amount.");
  const balance = roundMoney(finalFee - paid);

  // Execute in an atomic transaction
  const result = await runAdmissionTransaction(async (tx) => {
    // Serialize admissions for this batch so two simultaneous requests cannot
    // both take the final seat.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`batch-admission-${batch.id}`}))`;
    const activeEnrollmentCount = await tx.enrollment.count({
      where: { batchId: batch.id, status: "ACTIVE" },
    });
    if (activeEnrollmentCount >= batch.capacity) {
      throw new Error(`Batch "${batch.name}" is full (${batch.capacity} seats). Select another batch.`);
    }
    const { studentId: studentIdStr, admissionNo: admissionNoStr } = await allocateStudentIdentifiers(tx, campusId);
    const receiptNoStr = paid > 0 ? await allocatePaymentReceiptNumber(tx, year) : null;
    // 1. Parent
    let parent = await tx.parent.findFirst({
      where: { phone: payload.parentPhone },
    });
    if (!parent) {
      parent = await tx.parent.create({
        data: {
          name: payload.parentName,
          phone: payload.parentPhone,
          email: payload.parentEmail || null,
          relation: payload.parentRelation || "Father",
          occupation: payload.parentOccupation || null,
          address: payload.address || null,
        },
      });
    }

    // 2. Student
    const student = await tx.student.create({
      data: {
        instituteId: campusId,
        studentId: studentIdStr,
        admissionNo: admissionNoStr,
        name: payload.name.trim(),
        email: payload.email || null,
        phone: payload.phone || null,
        dob: dateOfBirth,
        gender: payload.gender || "MALE",
        address: payload.address || null,
        city: payload.city || "Srinagar",
        state: payload.state || "Jammu & Kashmir",
        emergencyContact: payload.emergencyContact || null,
        schoolCollege: payload.schoolCollege || null,
        gradeClass: payload.gradeClass || "Class 11",
        parentId: parent.id,
        admissionDate: finalAdmissionDate,
        status: "ACTIVE",
        notes: payload.notes || null,
      },
    });
    await createStudentUser(tx, student);

    // 3. Enrollment
    const enrollment = await tx.enrollment.create({
      data: {
        studentId: student.id,
        courseId: course.id,
        batchId: batch.id,
        startDate: finalAdmissionDate,
        status: "ACTIVE",
        source: admissionSource,
        scholarshipTestName: admissionSource === "SCHOLARSHIP_TEST" ? payload.scholarshipTestName!.trim() : null,
        scholarshipTestDate,
        scholarshipRollNumber: admissionSource === "SCHOLARSHIP_TEST" ? payload.scholarshipRollNumber!.trim().toUpperCase() : null,
        scholarshipMarks: admissionSource === "SCHOLARSHIP_TEST" ? payload.scholarshipMarks : null,
        scholarshipMaxMarks: admissionSource === "SCHOLARSHIP_TEST" ? payload.scholarshipMaxMarks : null,
        scholarshipPercentage,
        scholarshipRank: admissionSource === "SCHOLARSHIP_TEST" ? payload.scholarshipRank || null : null,
        notes: admissionSource === "SCHOLARSHIP_TEST"
          ? `Admitted into ${batch.name} through ${payload.scholarshipTestName!.trim()}`
          : `Admitted into ${batch.name}`,
      },
    });

    // 4. Fee Plan
    const feePlan = await tx.feePlan.create({
      data: {
        studentId: student.id,
        enrollmentId: enrollment.id,
        title: `${batch.name} Fee Plan`,
        admissionFee: payload.admissionFee,
        tuitionFee: payload.tuitionFee,
        materialFee: payload.materialFee,
        examFee: payload.examFee,
        totalAmount: totalGross,
        discountAmount: payload.discountAmount || 0,
        discountReason: payload.discountAmount > 0
          ? (payload.discountReason?.trim() || (admissionSource === "SCHOLARSHIP_TEST"
              ? `${payload.scholarshipTestName!.trim()} scholarship (${scholarshipPercentage}%)`
              : "Admission discount"))
          : null,
        finalAmount: finalFee,
        paidAmount: paid,
        balanceAmount: balance,
        status: balance === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING",
      },
    });

    // 5. Installments
    const count = Math.max(1, payload.installmentCount || 1);
    const totalPaise = Math.round(finalFee * 100);
    const baseInstallmentPaise = Math.floor(totalPaise / count);
    const remainderPaise = totalPaise % count;
    let paymentLeft = paid;

    for (let i = 1; i <= count; i++) {
      const dueDate = new Date(finalAdmissionDate);
      dueDate.setMonth(finalAdmissionDate.getMonth() + (i - 1) * 2); // every 2 months
      const installmentAmount = (baseInstallmentPaise + (i <= remainderPaise ? 1 : 0)) / 100;
      const instPaid = Math.min(paymentLeft, installmentAmount);
      paymentLeft = roundMoney(paymentLeft - instPaid);
      const instRemaining = roundMoney(installmentAmount - instPaid);

      await tx.feeInstallment.create({
        data: {
          feePlanId: feePlan.id,
          installmentNumber: i,
          title: `Installment ${i} of ${count}`,
          dueDate,
          amount: installmentAmount,
          paidAmount: instPaid,
          remainingAmount: instRemaining,
          status:
            instRemaining === 0 ? "PAID" : instPaid > 0 ? "PARTIAL" : i === 1 ? "DUE" : "UPCOMING",
        },
      });
    }

    // 6. Payment Record (if initial payment > 0)
    let paymentRecord = null;
    if (paid > 0) {
      paymentRecord = await tx.payment.create({
        data: {
          receiptNo: receiptNoStr!,
          studentId: student.id,
          feePlanId: feePlan.id,
          amount: paid,
          paymentMethod: payload.paymentMethod || "UPI",
          paymentDate,
          collectedBy: session.name || "Admissions Desk",
          referenceNo: payload.referenceNo || null,
          notes: `Admission fee collection for ${course.name}`,
          status: "SUCCESS",
        },
      });
    }

    return {
      student,
      enrollment,
      feePlan,
      payment: paymentRecord,
    };
  });

  // Admission is committed already. Audit telemetry must never turn a saved
  // admission into a visible failure that could encourage a duplicate retry.
  try {
    await logAudit({
      action: "ADMISSION_PROCESSED",
      entity: "Student",
      entityId: result.student.id,
      details: `Admission created: ${result.student.name} (${result.student.studentId}) in batch ${batch.name}, fee: ₹${finalFee}, paid: ₹${paid}`,
    });
  } catch (auditError) {
    console.error("Admission saved, but audit logging failed:", auditError);
  }

  return {
    success: true as const,
    studentId: result.student.id,
    rollNumber: result.student.studentId,
    admissionNo: result.student.admissionNo,
    receiptNo: result.payment?.receiptNo || null,
    admissionSource,
    scholarshipPercentage,
  };
}

function admissionErrorMessage(error: unknown) {
  const prismaError = error as { code?: string; meta?: { target?: string[] | string } };
  if (prismaError.code === "P2002") {
    const target = Array.isArray(prismaError.meta?.target)
      ? prismaError.meta.target.join(", ")
      : String(prismaError.meta?.target || "record");
    if (target.includes("email")) return "This email address is already linked to an account. Use a different email.";
    if (target.includes("receiptNo")) return "Receipt number conflict occurred. Please submit the admission again.";
    if (target.includes("studentId") || target.includes("admissionNo")) return "Student number conflict occurred. Please submit the admission again.";
    return "A record with the same unique information already exists.";
  }
  if (prismaError.code === "P2003" || prismaError.code === "P2025") {
    return "The selected campus, batch, course, or related record is no longer available. Refresh and select it again.";
  }
  if (prismaError.code === "P2034") {
    return "Another admission was saved at the same time. Please submit this form again.";
  }
  if (error instanceof Error) {
    const safeMessage = /required|invalid|cannot|must|selected|assigned|scholarship|installment|fee|payment|student account|campus|batch|permission|access|already/i;
    if (safeMessage.test(error.message) && error.message.length <= 300) return error.message;
  }
  return prismaError.code
    ? `Admission could not be saved because of database error ${prismaError.code}. Please contact the administrator.`
    : "Admission could not be saved. Please retry; if it continues, contact the administrator.";
}

export async function processAdmission(payload: AdmissionPayload) {
  try {
    return await processAdmissionOrThrow(payload);
  } catch (error: unknown) {
    // Keep the complete server-side error in logs while returning only a safe,
    // actionable message to the production UI.
    console.error("Admission processing failed:", error);
    return { success: false as const, error: admissionErrorMessage(error) };
  }
}
