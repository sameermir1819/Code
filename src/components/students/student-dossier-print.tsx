"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface StudentDossierPrintProps {
  student: any;
  activeEnrollment: any;
}

export function StudentDossierPrint({ student, activeEnrollment }: StudentDossierPrintProps) {
  const batchName = activeEnrollment?.batch?.name || "Active Batch";
  const courseName = activeEnrollment?.course?.name || "Academic Coaching Program";
  const feePlan = student.feePlans?.[0];

  return (
    <div className="hidden print-only text-zinc-900 bg-white p-8 space-y-6 max-w-4xl mx-auto border-2 border-zinc-800">
      {/* ── 1. INSTITUTION LETTERHEAD ── */}
      <div className="border-b-2 border-zinc-900 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-primary text-white flex items-center justify-center font-black text-2xl border border-zinc-900 shrink-0">
            FL
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-primary">
              FUTUREX LEARNING
            </h1>
            <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Central Student Dossier &amp; Cumulative Academic Record
            </p>
            <p className="text-[10px] text-zinc-500">
              Head Office: Plot 42, Knowledge Park, Central Avenue, New Delhi • Helpline: +91 98765 43210
            </p>
          </div>
        </div>
        <div className="text-right border border-zinc-300 p-2 rounded bg-zinc-50 text-xs">
          <span className="font-mono font-bold block text-zinc-900">
            ID: {student.studentId}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono block">
            Adm: {student.admissionNo}
          </span>
          <span className="text-[10px] text-zinc-600 block">
            Generated: {formatDate(new Date())}
          </span>
        </div>
      </div>

      {/* ── 2. STUDENT PARTICULAR MATRIX ── */}
      <div className="grid grid-cols-4 gap-4 border border-zinc-300 rounded-lg p-4 bg-zinc-50 text-xs">
        <div className="col-span-1 flex flex-col items-center justify-center border-r border-zinc-300 pr-3">
          <div className="h-24 w-24 rounded-lg bg-zinc-200 border-2 border-zinc-400 flex items-center justify-center font-black text-3xl text-zinc-600">
            {student.name.charAt(0)}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 uppercase font-semibold">
            {student.status}
          </span>
        </div>

        <div className="col-span-3 grid grid-cols-2 gap-y-2 gap-x-4 pl-2">
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold block">Full Legal Name:</span>
            <span className="font-bold text-sm text-zinc-900">{student.name}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold block">Classroom Batch:</span>
            <span className="font-bold text-sm text-primary">{batchName}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold block">Date of Birth &amp; Gender:</span>
            <span className="font-medium text-zinc-800">
              {formatDate(student.dob)} ({student.gender})
            </span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold block">Enrolled Program:</span>
            <span className="font-medium text-zinc-800">{courseName}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold block">Contact Number:</span>
            <span className="font-mono text-zinc-800">{student.phone || "—"}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold block">Email Address:</span>
            <span className="text-zinc-800">{student.email || "—"}</span>
          </div>
          <div className="col-span-2">
            <span className="text-zinc-500 text-[10px] uppercase font-semibold block">Permanent Address:</span>
            <span className="text-zinc-800">{student.address || "New Delhi NCR, India"}</span>
          </div>
        </div>
      </div>

      {/* ── 3. PARENT & GUARDIAN PARTICULARS ── */}
      <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50 text-xs">
        <h3 className="font-bold text-[11px] uppercase tracking-wide text-zinc-700 mb-2 border-b pb-1">
          Parent &amp; Guardian Dossier
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <span className="text-zinc-500 text-[10px] block">Guardian Name:</span>
            <strong className="text-zinc-900">{student.parent?.name || "—"}</strong>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] block">Relationship:</span>
            <span className="text-zinc-800">{student.parent?.relation || "Father"}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] block">Emergency Phone:</span>
            <span className="font-mono font-bold text-zinc-900">{student.parent?.phone || student.emergencyContact || "—"}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] block">Profession:</span>
            <span className="text-zinc-800">{student.parent?.occupation || "—"}</span>
          </div>
        </div>
      </div>

      {/* ── 4. ATTENDANCE & FINANCIAL SUMMARY ── */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        {/* Attendance Summary */}
        <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50 space-y-2">
          <h4 className="font-bold text-[11px] uppercase tracking-wide text-zinc-700 border-b pb-1">
            Classroom Attendance Status
          </h4>
          <div className="flex justify-between items-center">
            <span className="text-zinc-600">Attendance Percentage:</span>
            <span className="font-black text-sm text-emerald-700">{student.attendanceRate}%</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Total Recorded Sessions:</span>
            <span className="font-semibold text-zinc-900">{student.attendances?.length || 0} Sessions</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Advisory Threshold:</span>
            <span className="font-semibold text-zinc-800">75% Mandatory</span>
          </div>
        </div>

        {/* Financial Ledger */}
        <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50 space-y-1.5">
          <h4 className="font-bold text-[11px] uppercase tracking-wide text-zinc-700 border-b pb-1">
            Fee &amp; Payment Ledger
          </h4>
          <div className="flex justify-between text-zinc-600">
            <span>Agreed Program Fee:</span>
            <span className="font-semibold text-zinc-900">{formatCurrency(feePlan?.finalAmount || 0)}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Total Realized to Date:</span>
            <span className="font-bold text-emerald-700">{formatCurrency(feePlan?.paidAmount || 0)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1 text-zinc-900">
            <span>Balance Outstanding:</span>
            <span className={feePlan?.balanceAmount > 0 ? "text-amber-600 font-black" : "text-emerald-700 font-black"}>
              {feePlan?.balanceAmount > 0 ? formatCurrency(feePlan.balanceAmount) : "Cleared (NIL)"}
            </span>
          </div>
        </div>
      </div>

      {/* ── 5. RECENT EXAMS & ASSESSMENTS ── */}
      <div className="space-y-2 text-xs">
        <h4 className="font-bold text-[11px] uppercase tracking-wide text-zinc-700">
          Academic Assessment Results &amp; Test Records
        </h4>
        <div className="border border-zinc-300 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-100 border-b border-zinc-300 text-zinc-800 font-bold">
              <tr>
                <th className="p-2 border-r border-zinc-300">Exam Title</th>
                <th className="p-2 border-r border-zinc-300">Subject</th>
                <th className="p-2 border-r border-zinc-300">Date</th>
                <th className="p-2 border-r border-zinc-300">Marks</th>
                <th className="p-2 border-r border-zinc-300">% Score</th>
                <th className="p-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {student.marks?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-zinc-500 italic">
                    No examination records recorded yet.
                  </td>
                </tr>
              ) : (
                student.marks.slice(0, 5).map((m: any) => (
                  <tr key={m.id}>
                    <td className="p-2 border-r border-zinc-200 font-medium">{m.exam.title}</td>
                    <td className="p-2 border-r border-zinc-200 text-zinc-600">{m.exam.subject.name}</td>
                    <td className="p-2 border-r border-zinc-200 text-zinc-600">{formatDate(m.exam.examDate)}</td>
                    <td className="p-2 border-r border-zinc-200 font-bold">
                      {m.marksObtained} / {m.exam.maxMarks}
                    </td>
                    <td className="p-2 border-r border-zinc-200 font-semibold">{m.percentage}%</td>
                    <td className="p-2 text-center font-bold">{m.grade}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. OFFICIAL VERIFICATION & SIGNATURES ── */}
      <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs border-t-2 border-zinc-800">
        <div>
          <div className="w-36 border-b border-zinc-500 mx-auto mb-1"></div>
          <span className="font-semibold text-zinc-700 block">Student / Guardian</span>
          <span className="text-[10px] text-zinc-400">Identity &amp; Dossier Acknowledged</span>
        </div>
        <div>
          <div className="w-36 border-b border-zinc-500 mx-auto mb-1"></div>
          <span className="font-semibold text-zinc-700 block">Academic Incharge</span>
          <span className="text-[10px] text-zinc-400">Records Verified &amp; Audited</span>
        </div>
        <div>
          <div className="w-36 border-b border-zinc-500 mx-auto mb-1"></div>
          <span className="font-bold text-zinc-900 block">Center Director</span>
          <span className="text-[10px] text-zinc-400">Futurex Learning Seal</span>
        </div>
      </div>
    </div>
  );
}

