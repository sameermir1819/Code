import React from "react";
import Link from "next/link";
import { getStudentPortalOverview } from "@/server/actions/portal";
import {
  CalendarCheck2,
  Award,
  Receipt,
  BookOpen,
  QrCode,
  Sparkles,
  TrendingUp,
  Clock,
  Building2,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Bell,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentPortalPage() {
  const res = await getStudentPortalOverview();

  if (!res.success || !res.data) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Student Account Setup Required</h2>
        <p className="text-sm text-zinc-400">
          {res.error ||
            "Your user login is not yet linked to an active student registration. Please contact your campus administrator with your Admission Number."}
        </p>
        <a
          href="/login"
          className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs"
        >
          Return to Login
        </a>
      </div>
    );
  }

  const {
    student,
    enrollments,
    attendanceStats,
    feeSummary,
    recentMarks,
    announcements,
    studyMaterialsCount,
  } = res.data;

  const primaryEnrollment = enrollments[0];

  return (
    <div className="space-y-6">
      {/* ── Welcome Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-white/10 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-primary-foreground">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Academic Year {student.session?.name || "2025-2026"}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Welcome back, {student.name.split(" ")[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
              Enrolled in{" "}
              <span className="font-semibold text-white">
                {primaryEnrollment?.course?.name || "Academic Program"}
              </span>{" "}
              • Batch:{" "}
              <span className="font-semibold text-white">
                {primaryEnrollment?.batch?.name || "Main Batch"}
              </span>
            </p>
          </div>

          {/* Quick Details Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/10">
              <span className="text-[10px] text-zinc-400 block font-medium">STUDENT ID</span>
              <span className="font-mono font-bold text-white text-xs">{student.studentId}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/10">
              <span className="text-[10px] text-zinc-400 block font-medium">ADMISSION NO</span>
              <span className="font-mono font-bold text-white text-xs">{student.admissionNo}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/10">
              <span className="text-[10px] text-zinc-400 block font-medium">STATUS</span>
              <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {student.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance */}
        <a
          href="/portal/attendance"
          className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 transition-all group block"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Attendance Rate</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {attendanceStats.attendanceRate}%
            </span>
            <span className="text-[11px] text-zinc-400">
              ({attendanceStats.presentCount}/{attendanceStats.totalClasses} classes)
            </span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                attendanceStats.attendanceRate >= 85
                  ? "bg-emerald-500"
                  : attendanceStats.attendanceRate >= 75
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, attendanceStats.attendanceRate)}%` }}
            />
          </div>
        </a>

        {/* Exams & Tests */}
        <a
          href="/portal/results"
          className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 transition-all group block"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Exams Taken</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {recentMarks.length}
            </span>
            <span className="text-[11px] text-zinc-400">Evaluated Tests</span>
          </div>
          <span className="text-[11px] text-purple-300 flex items-center gap-1 mt-2.5 font-medium">
            <span>View performance ledger</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        </a>

        {/* Fee Status */}
        <a
          href="/portal/fees"
          className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 transition-all group block"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Fee Balance</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              ₹{feeSummary.balanceFees.toLocaleString("en-IN")}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                feeSummary.balanceFees === 0
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/20 text-amber-300"
              }`}
            >
              {feeSummary.balanceFees === 0 ? "Cleared" : "Pending Due"}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 block mt-2.5 truncate">
            Paid: ₹{feeSummary.paidFees.toLocaleString("en-IN")} of ₹{feeSummary.totalFees.toLocaleString("en-IN")}
          </span>
        </a>

        {/* Study Material */}
        <a
          href="/portal/materials"
          className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 transition-all group block"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Study Material</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {studyMaterialsCount}
            </span>
            <span className="text-[11px] text-zinc-400">Available Files</span>
          </div>
          <span className="text-[11px] text-indigo-300 flex items-center gap-1 mt-2.5 font-medium">
            <span>Browse notes &amp; PDFs</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        </a>
      </div>

      {/* ── Two-Column Operational Dashboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide): Classes, Attendance Trail & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Enrolled Batches */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  My Enrolled Courses &amp; Batches
                </h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {enrollments.length} Active {enrollments.length === 1 ? "Batch" : "Batches"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollments.map((enr) => {
                const timetableCount = (enr.batch as any)._count?.timetableSlots ?? 0;
                const materialsCount = (enr.batch as any)._count?.studyMaterials ?? 0;

                return (
                  <div
                    key={enr.id}
                    className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/10 text-zinc-300 border border-white/10">
                              {enr.batch.code}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ACTIVE
                            </span>
                          </div>
                          <Link
                            href={`/portal/batches/${enr.batch.id}`}
                            className="font-bold text-white text-base leading-snug group-hover:text-indigo-400 transition-colors block"
                          >
                            {enr.batch.name}
                          </Link>
                          <p className="text-xs text-zinc-400 mt-0.5">{enr.course.name}</p>
                        </div>

                        <span className="text-[10px] px-2.5 py-1 rounded-xl font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {enr.batch.room || "Room 1"}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-400 space-y-1.5 pt-2 border-t border-white/5">
                        {enr.batch.teachers.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Faculty:</span>
                            <span className="text-zinc-300 font-medium truncate max-w-[170px]">
                              {enr.batch.teachers.map((t) => t.teacher.name).join(", ")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Weekly Classes:</span>
                          <span className="text-indigo-300 font-mono font-medium">
                            {timetableCount} {timetableCount === 1 ? "Slot" : "Slots"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Quick Links into Batch */}
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                      <Link
                        href={`/portal/batches/${enr.batch.id}?tab=timetable`}
                        className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-indigo-600/30 text-zinc-300 hover:text-white border border-white/5 hover:border-indigo-500/50 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>Timetable</span>
                      </Link>
                      <Link
                        href={`/portal/batches/${enr.batch.id}?tab=materials`}
                        className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-indigo-600/30 text-zinc-300 hover:text-white border border-white/5 hover:border-indigo-500/50 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <BookOpen className="w-3 h-3 text-purple-400" />
                        <span>Notes ({materialsCount})</span>
                      </Link>
                      <Link
                        href={`/portal/batches/${enr.batch.id}`}
                        title="View Batch Details"
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/5 transition-all"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Attendance Trail */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recent Attendance Feed
                </h3>
              </div>
              <a
                href="/portal/attendance"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {attendanceStats.recent.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                No attendance sessions recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-white/5">
                {attendanceStats.recent.map((att) => {
                  const dateStr = new Date(att.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={att.id}
                      className="py-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg ${
                            att.status === "PRESENT"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : att.status === "LATE"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {att.status === "PRESENT" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : att.status === "LATE" ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-white block">{dateStr}</span>
                          <span className="text-[11px] text-zinc-400">
                            {att.batch?.name || "Regular Lecture"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase ${
                          att.status === "PRESENT"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : att.status === "LATE"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Exam Marks */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recent Examination Reports
                </h3>
              </div>
              <a
                href="/portal/results"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>All Test Reports</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {recentMarks.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                No exam evaluations published yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentMarks.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs leading-snug">
                          {m.exam.title}
                        </h4>
                        <span className="text-[10px] text-zinc-400">
                          {m.exam.subject?.name || "Academic Subject"} •{" "}
                          {new Date(m.exam.examDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {m.grade}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs pt-1 border-t border-white/5">
                      <span className="text-zinc-400">Score:</span>
                      <span className="font-bold text-white">
                        {m.marksObtained} / {m.exam.maxMarks}{" "}
                        <span className="text-emerald-400 text-[10px]">({m.percentage}%)</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col wide): Quick Actions, Announcements, ID Card preview */}
        <div className="space-y-6">
          {/* Digital ID Card Preview Tile */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-blue-950/30 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Digital Smart ID
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-zinc-300">
              Access your verified CR-80 digital identity badge for campus entry, library access,
              and attendance check-ins.
            </p>

            <a
              href="/portal/id-card"
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all block text-center"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Open &amp; Print ID Card</span>
            </a>
          </div>

          {/* Notice Board / Announcements */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Notice Board
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Official</span>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                No active announcements at this time.
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.map((anc) => (
                  <div
                    key={anc.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1"
                  >
                    <span className="font-bold text-white text-xs block leading-snug">
                      {anc.title}
                    </span>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {anc.message}
                    </p>
                    <span className="text-[9px] text-zinc-500 block pt-0.5">
                      {new Date(anc.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campus Support Card */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs">
              Campus Academic Help Desk
            </h3>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              For batch change requests, timetable conflicts, or fee inquiries, connect with the
              academic administration team.
            </p>
            <div className="pt-2 space-y-2 border-t border-white/5 text-zinc-300">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{student.institute?.phone || "+91 98765 43210"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{student.institute?.email || "admissions@institute.com"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
