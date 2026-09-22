import React from "react";
import { getStudentAttendanceRecords } from "@/server/actions/portal";
import { StudentAttendanceClient } from "./attendance-client";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Attendance - Student Portal",
};

export default async function StudentAttendancePage() {
  const res = await getStudentAttendanceRecords();

  if (!res.success || !res.student) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-3 max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Attendance Records Unavailable</h2>
        <p className="text-xs text-zinc-400">
          No linked student record found for your user account.
        </p>
      </div>
    );
  }

  return (
    <StudentAttendanceClient
      records={res.data || []}
      studentName={res.student.name}
    />
  );
}
