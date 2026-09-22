import React from "react";
import { getStudentExamsAndResults } from "@/server/actions/portal";
import {
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Exams & Results - Student Portal",
};

export default async function StudentResultsPage() {
  const res = await getStudentExamsAndResults();

  if (!res.success || !res.student) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-3 max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Examination Records Unavailable</h2>
        <p className="text-xs text-zinc-400">
          No linked student record found for your account.
        </p>
      </div>
    );
  }

  const marksList = res.data || [];
  const totalExams = marksList.length;
  const passedExams = marksList.filter((m) => m.isPassed).length;
  const avgPercentage =
    totalExams > 0
      ? Math.round(marksList.reduce((sum, m) => sum + m.percentage, 0) / totalExams)
      : 0;

  const highestScore =
    totalExams > 0
      ? Math.max(...marksList.map((m) => m.percentage))
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Examination &amp; Assessment Reports</h1>
        <p className="text-xs text-zinc-400">
          Evaluated test papers, rank cards, and subject-wise academic matrices for {res.student.name}.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[11px] text-zinc-400 block font-medium">Tests Evaluated</span>
          <span className="text-2xl sm:text-3xl font-black text-white block mt-0.5">
            {totalExams}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-1">Recorded Assessments</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
          <span className="text-[11px] text-purple-300 block font-medium">Average Performance</span>
          <span className="text-2xl sm:text-3xl font-black text-purple-400 block mt-0.5">
            {avgPercentage}%
          </span>
          <span className="text-[10px] text-purple-300/80 block mt-1">Overall GPA equivalent</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[11px] text-emerald-300 block font-medium">Highest Test Score</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 block mt-0.5">
            {highestScore}%
          </span>
          <span className="text-[10px] text-emerald-300/80 block mt-1">Best Evaluation</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <span className="text-[11px] text-blue-300 block font-medium">Clearance Rate</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-400 block mt-0.5">
            {totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 100}%
          </span>
          <span className="text-[10px] text-blue-300/80 block mt-1">
            {passedExams}/{totalExams} Passed
          </span>
        </div>
      </div>

      {/* Reports Grid */}
      {marksList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-zinc-500 text-xs">
          No evaluated test results have been published for your profile yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marksList.map((m) => {
            const dateStr = new Date(m.exam.examDate).toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 hover:border-white/20 transition-all"
              >
                {/* Exam Title & Subject */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                      {m.exam.code}
                    </span>
                    <h3 className="font-bold text-white text-sm leading-snug">{m.exam.title}</h3>
                    <p className="text-xs text-primary font-medium">
                      {m.exam.subject?.name || "Academic Subject"} • {m.exam.batch?.name}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-black px-2.5 py-1 rounded-xl inline-block ${
                        m.percentage >= 85
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : m.percentage >= 60
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : m.percentage >= 40
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      Grade {m.grade}
                    </span>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Score Achieved:</span>
                    <span className="font-black text-white">
                      {m.marksObtained} / {m.exam.maxMarks}{" "}
                      <span className="text-xs text-zinc-400 font-normal">({m.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.percentage >= 75
                          ? "bg-emerald-500"
                          : m.percentage >= 50
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, m.percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Details Footer */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {dateStr}
                  </span>

                  <span
                    className={`flex items-center gap-1 font-bold ${
                      m.isPassed ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {m.isPassed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASSED</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>RE-APPEAR</span>
                      </>
                    )}
                  </span>
                </div>

                {m.remarks && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-300">
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold">
                      Instructor Remarks
                    </span>
                    {m.remarks}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
