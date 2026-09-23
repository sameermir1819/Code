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
  Clock,
  GraduationCap,
  AlertCircle,
  ChevronRight,
  Bell,
  Phone,
  Mail,
  User,
  Layers,
  ShieldCheck,
  ArrowRight,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Portal - Academic Command Center",
};

export default async function StudentPortalPage() {
  const res = await getStudentPortalOverview();

  if (!res.success || !res.data) {
    return (
      <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-center space-y-4 max-w-lg mx-auto my-16 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Student Account Setup Required</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {res.error ||
            "Your login is not yet linked to an active student registration. Please contact your campus administration with your Admission Number."}
        </p>
        <a
          href="/student-login"
          className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
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

  // Compute greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Identify today's day of week
  const daysOfWeek = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const todayDay = daysOfWeek[new Date().getDay()];

  // Gather today's lecture slots across all active enrolled batches
  const todayLectures = enrollments
    .flatMap((enr) => {
      const slots = (enr.batch as any).timetableSlots || [];
      return slots
        .filter((s: any) => s.dayOfWeek === todayDay)
        .map((s: any) => ({
          ...s,
          batchName: enr.batch.name,
          batchId: enr.batch.id,
          courseName: enr.course.name,
        }));
    })
    .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

  const studentInitials = student.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Primary navigation action tiles
  const ACTION_BUTTONS = [
    {
      title: "My Batches & Timetable",
      desc: "Weekly lecture schedule, faculty & rooms",
      href: "/portal/batches",
      badge: `${enrollments.length} Active ${enrollments.length === 1 ? "Batch" : "Batches"}`,
      badgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      icon: GraduationCap,
      color: "from-indigo-600 to-indigo-800",
      iconBg: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    },
    {
      title: "Attendance Ledger",
      desc: "Daily presence records & attendance rate",
      href: "/portal/attendance",
      badge: `${attendanceStats.attendanceRate}% Present`,
      badgeColor:
        attendanceStats.attendanceRate >= 75
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          : "bg-rose-500/15 text-rose-400 border-rose-500/30",
      icon: CalendarCheck2,
      color: "from-blue-600 to-blue-800",
      iconBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    {
      title: "Study Notes & Materials",
      desc: "Classroom PDFs, lecture slides & guides",
      href: "/portal/materials",
      badge: `${studyMaterialsCount} Documents`,
      badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      icon: BookOpen,
      color: "from-purple-600 to-purple-800",
      iconBg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    {
      title: "Exams & Results",
      desc: "Evaluation scorecards, ranks & percentages",
      href: "/portal/results",
      badge: `${recentMarks.length} Scorecards`,
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      icon: Award,
      color: "from-amber-600 to-amber-800",
      iconBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    {
      title: "Fee Receipts & Dues",
      desc: "Installment breakdown & payment ledger",
      href: "/portal/fees",
      badge:
        feeSummary.balanceFees === 0
          ? "All Cleared"
          : `₹${feeSummary.balanceFees.toLocaleString("en-IN")} Due`,
      badgeColor:
        feeSummary.balanceFees === 0
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          : "bg-amber-500/15 text-amber-300 border-amber-500/30",
      icon: Receipt,
      color: "from-emerald-600 to-emerald-800",
      iconBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    {
      title: "Offline Test Series",
      desc: "Mock test schedules, centers & answers",
      href: "/portal/test-series",
      badge: "Test Series",
      badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      icon: Layers,
      color: "from-cyan-600 to-cyan-800",
      iconBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    },
    {
      title: "Digital Smart ID Card",
      desc: "Official QR pass for campus & exams",
      href: "/portal/id-card",
      badge: "Verified Badge",
      badgeColor: "bg-pink-500/15 text-pink-300 border-pink-500/30",
      icon: QrCode,
      color: "from-pink-600 to-pink-800",
      iconBg: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    },
    {
      title: "Profile & Security",
      desc: "Personal information & security settings",
      href: "/portal/profile",
      badge: "Account",
      badgeColor: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
      icon: ShieldCheck,
      color: "from-zinc-600 to-zinc-800",
      iconBg: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Compact Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-[#0d1322] to-purple-950/40 border border-white/10 p-6 sm:p-7 backdrop-blur-2xl shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-600/30 shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#090e1a] flex items-center justify-center text-white font-extrabold text-xl overflow-hidden">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{studentInitials}</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {student.status || "ACTIVE"}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  ID: {student.studentId}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {greeting}, {student.name.split(" ")[0]}!
              </h1>

              <p className="text-xs text-zinc-300 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white">
                  {primaryEnrollment?.course?.name || "Academic Program"}
                </span>
                {primaryEnrollment?.batch?.name && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="text-indigo-300 font-medium">
                      {primaryEnrollment.batch.name}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <Link
              href="/portal/id-card"
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-pink-400" />
              <span>Smart ID</span>
            </Link>
            <Link
              href="/portal/profile"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>My Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Today's Lecture Alert (Shown only if lectures scheduled today) ── */}
      {todayLectures.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-indigo-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Today&apos;s Lectures ({todayDay})
              </h3>
            </div>
            <Link
              href="/portal/batches?tab=timetable"
              className="text-xs font-semibold text-indigo-400 hover:text-white flex items-center gap-1"
            >
              <span>Weekly Timetable</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {todayLectures.map((slot: any) => (
              <Link
                key={slot.id}
                href={`/portal/batches/${slot.batchId}?tab=timetable`}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-mono font-bold">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs leading-tight group-hover:text-indigo-300 transition-colors">
                    {slot.subject?.name || "Lecture"}
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    {slot.teacher?.name || "Faculty"} • {slot.room || "Room 1"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 4 Quick Glance KPI Chips ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Attendance */}
        <Link
          href="/portal/attendance"
          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-blue-500/40 transition-all group block shadow-md"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold">Attendance</span>
            <CalendarCheck2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white">
              {attendanceStats.attendanceRate}%
            </span>
            <span className="text-[10px] text-zinc-400">
              ({attendanceStats.presentCount}/{attendanceStats.totalClasses})
            </span>
          </div>
        </Link>

        {/* Exams */}
        <Link
          href="/portal/results"
          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-purple-500/40 transition-all group block shadow-md"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold">Evaluations</span>
            <Award className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white">
              {recentMarks.length}
            </span>
            <span className="text-[10px] text-zinc-400">Scorecards</span>
          </div>
        </Link>

        {/* Fee Balance */}
        <Link
          href="/portal/fees"
          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/40 transition-all group block shadow-md"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold">Fee Status</span>
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black text-white">
              {feeSummary.balanceFees === 0
                ? "Cleared"
                : `₹${feeSummary.balanceFees.toLocaleString("en-IN")}`}
            </span>
            {feeSummary.balanceFees > 0 && (
              <span className="text-[10px] text-amber-400 font-bold uppercase">
                Pending
              </span>
            )}
          </div>
        </Link>

        {/* Study Materials */}
        <Link
          href="/portal/materials"
          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-indigo-500/40 transition-all group block shadow-md"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold">Materials</span>
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white">
              {studyMaterialsCount}
            </span>
            <span className="text-[10px] text-zinc-400">Files Available</span>
          </div>
        </Link>
      </div>

      {/* ── Main Navigation Action Hub (Buttons / Tiles) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Academic Services Hub</span>
          </h2>
          <span className="text-[11px] text-zinc-400">
            Tap any section to open dedicated page
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {ACTION_BUTTONS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative p-5 rounded-3xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/50 transition-all duration-200 shadow-lg flex flex-col justify-between space-y-4 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-md group-hover:scale-110 transition-transform ${item.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 group-hover:text-white transition-colors">
                  <span className="font-semibold text-[11px]">Open Department</span>
                  <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-indigo-600 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Official Announcements & Support Banner ── */}
      {announcements.length > 0 && (
        <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Official Campus Notices
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {announcements.length} Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.slice(0, 2).map((anc) => (
              <div
                key={anc.id}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-white text-xs leading-snug">
                    {anc.title}
                  </h4>
                  <span className="text-[9px] text-zinc-500 shrink-0">
                    {new Date(anc.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {anc.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Academic Helpline Footer ── */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Need help with timetable or batch changes? Contact Academic Office</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-300">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-mono">
              {student.institute?.phone || "+91 98765 43210"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] truncate max-w-[150px]">
              {student.institute?.email || "help@institute.com"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
