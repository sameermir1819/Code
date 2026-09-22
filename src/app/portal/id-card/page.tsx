import React from "react";
import { resolveCurrentStudent } from "@/server/actions/portal";
import { getActiveCampus } from "@/server/actions/campus";
import { db } from "@/lib/db";
import { StudentIDCardView } from "./id-card-view";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Digital ID Card - Student Portal",
};

export default async function StudentIDCardPage() {
  const [{ student }, activeCampus] = await Promise.all([
    resolveCurrentStudent(),
    getActiveCampus(),
  ]);

  if (!student) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-3 max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">ID Card Unavailable</h2>
        <p className="text-xs text-zinc-400">
          No student registration is linked to your account.
        </p>
      </div>
    );
  }

  // Fetch student's primary enrollment
  const enrollment = await db.enrollment.findFirst({
    where: { studentId: student.id, status: "ACTIVE" },
    include: {
      course: true,
      batch: true,
    },
  });

  const instituteName = activeCampus?.name || student.institute?.name || "Futurex Learning";
  const instituteCode = activeCampus?.code || student.institute?.code || "FL-CAMPUS";
  const instituteLogoUrl = activeCampus?.logoUrl || student.institute?.logoUrl || "/logo.png";

  return (
    <StudentIDCardView
      student={{
        name: student.name,
        studentId: student.studentId,
        admissionNo: student.admissionNo,
        phone: student.phone,
        emergencyContact: student.emergencyContact,
        gradeClass: student.gradeClass,
        photoUrl: student.photoUrl,
        admissionDate: student.admissionDate,
        enrollmentCourse: enrollment?.course?.name,
        enrollmentBatch: enrollment?.batch?.name,
      }}
      institute={{
        name: instituteName,
        code: instituteCode,
        logoUrl: instituteLogoUrl,
        address: activeCampus?.address || student.institute?.address,
        phone: activeCampus?.phone || student.institute?.phone,
      }}
    />
  );
}
