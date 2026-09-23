import React from "react";
import { resolveCurrentStudent } from "@/server/actions/portal";
import { StudentProfileClient } from "./profile-client";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile - Student Portal",
};

export default async function StudentProfilePage() {
  const { student } = await resolveCurrentStudent();

  if (!student) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-3 max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Profile Unavailable</h2>
        <p className="text-xs text-zinc-400">
          No student registration is linked to your user account.
        </p>
      </div>
    );
  }

  return (
    <StudentProfileClient
      student={{
        name: student.name,
        studentId: student.studentId,
        admissionNo: student.admissionNo,
        email: student.email,
        phone: student.phone,
        dob: student.dob,
        gender: student.gender,
        address: student.address,
        city: student.city,
        emergencyContact: student.emergencyContact,
        gradeClass: student.gradeClass,
        photoUrl: student.photoUrl,
        status: student.status,
        admissionDate: student.admissionDate,
        parent: student.parent,
        institute: student.institute
          ? {
              name: student.institute.name,
              code: student.institute.code,
            }
          : null,
        session: student.session
          ? {
              name: student.session.name,
            }
          : null,
      }}
    />
  );
}
