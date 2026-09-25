"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";

import { logAudit } from "./audit";
import { getActiveCampusId } from "./campus";
import { createStudentUser } from "@/lib/student-user";

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
  courseId: string;
  batchId: string;
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

export async function processAdmission(payload: AdmissionPayload) {
  await requireStaffPermission("fees.create");
  await requireStaffPermission("fees.update");
  const session = await requireStaffPermission("students.create");

  const campusId = await getActiveCampusId();
  if (!campusId) throw new Error("No active campus found.");

  const course = await db.course.findUnique({ where: { id: payload.courseId } });
  if (!course) throw new Error("Selected course not found");

  const batch = await db.batch.findUnique({ where: { id: payload.batchId } });
  if (!batch) throw new Error("Selected batch not found");

  const year = new Date().getFullYear();
  const studentCount = await db.student.count();
  const paymentCount = await db.payment.count();

  const studentIdStr = `STU-${year}-${String(studentCount + 1).padStart(4, "0")}`;
  const admissionNoStr = `ADM-${year}-${String(studentCount + 1).padStart(4, "0")}`;
  const receiptNoStr = `REC-${year}-${String(paymentCount + 1).padStart(4, "0")}`;

  // Calculate fee sums
  const totalGross =
    payload.admissionFee + payload.tuitionFee + payload.materialFee + payload.examFee;
  const finalFee = Math.max(0, totalGross - (payload.discountAmount || 0));
  const paid = payload.initialPaymentAmount || 0;
  const balance = Math.max(0, finalFee - paid);

  // Execute in an atomic transaction
  const result = await db.$transaction(async (tx) => {
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

    const finalAdmissionDate = payload.admissionDate
      ? new Date(payload.admissionDate)
      : new Date();

    // 2. Student
    const student = await tx.student.create({
      data: {
        instituteId: campusId,
        studentId: studentIdStr,
        admissionNo: admissionNoStr,
        name: payload.name,
        email: payload.email || null,
        phone: payload.phone || null,
        dob: payload.dob ? new Date(payload.dob) : null,
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
        source: "DIRECT_ADMISSION",
        notes: `Admitted into ${batch.name}`,
      },
    });

    // 4. Fee Plan
    const feePlan = await tx.feePlan.create({
      data: {
        studentId: student.id,
        enrollmentId: enrollment.id,
        title: `${course.name} - Annual Plan`,
        admissionFee: payload.admissionFee,
        tuitionFee: payload.tuitionFee,
        materialFee: payload.materialFee,
        examFee: payload.examFee,
        totalAmount: totalGross,
        discountAmount: payload.discountAmount || 0,
        discountReason: payload.discountReason || null,
        finalAmount: finalFee,
        paidAmount: paid,
        balanceAmount: balance,
        status: balance === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING",
      },
    });

    // 5. Installments
    const count = Math.max(1, payload.installmentCount || 1);
    const installmentAmount = Math.round(finalFee / count);
    const now = new Date();

    for (let i = 1; i <= count; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(now.getMonth() + (i - 1) * 2); // every 2 months

      let instPaid = 0;
      if (i === 1) {
        instPaid = Math.min(paid, installmentAmount);
      } else if (paid > installmentAmount * (i - 1)) {
        instPaid = Math.min(paid - installmentAmount * (i - 1), installmentAmount);
      }

      const instRemaining = Math.max(0, installmentAmount - instPaid);

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
          receiptNo: receiptNoStr,
          studentId: student.id,
          feePlanId: feePlan.id,
          amount: paid,
          paymentMethod: payload.paymentMethod || "UPI",
          paymentDate: payload.paymentDate
            ? new Date(payload.paymentDate)
            : finalAdmissionDate,
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

  await logAudit({
    action: "ADMISSION_PROCESSED",
    entity: "Student",
    entityId: result.student.id,
    details: `Admission created: ${result.student.name} (${result.student.studentId}) in batch ${batch.name}, fee: ₹${finalFee}, paid: ₹${paid}`,
  });

  return {
    success: true,
    studentId: result.student.id,
    admissionNo: result.student.admissionNo,
    receiptNo: result.payment?.receiptNo || null,
  };
}
