import { requireStaffPermission } from "@/lib/auth";
import { authorizedCampusId } from "@/lib/campus-scope";
import { db } from "@/lib/db";
import { getActiveCampusId } from "@/server/actions/campus";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Award, TrendingUp, ClipboardCheck, Users, BarChart2 } from "lucide-react";
import Link from "next/link";

import { PrintButton } from "@/components/ui/print-button";

export const dynamic = "force-dynamic";

// ─── Grade badge colours ─────────────────────────────────────────────────────
function GradeBadge({ grade, passed }: { grade: string; passed: boolean }) {
  const colourMap: Record<string, string> = {
    "A+": "bg-emerald-100 text-emerald-700 border-emerald-200",
    A: "bg-green-100 text-green-700 border-green-200",
    "B+": "bg-teal-100 text-teal-700 border-teal-200",
    B: "bg-blue-100 text-blue-700 border-blue-200",
    C: "bg-amber-100 text-amber-700 border-amber-200",
    D: "bg-orange-100 text-orange-700 border-orange-200",
    F: "bg-red-100 text-red-700 border-red-200",
  };
  const cls =
    colourMap[grade] ??
    (passed
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-red-100 text-red-700 border-red-200");
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cls}`}
    >
      {grade}
    </span>
  );
}

function ExamStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    UPCOMING: "bg-blue-100 text-blue-700 border-blue-200",
    ONGOING: "bg-amber-100 text-amber-700 border-amber-200",
    COMPLETED: "bg-secondary text-secondary-foreground",
    PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

export default async function ResultsPage() {
  const session = await requireStaffPermission("results.view");
  const campusId = authorizedCampusId(session, await getActiveCampusId());
  // ── Fetch all marks with full relational data ──────────────────────────────
  const allMarks = await db.marks.findMany({
    where: { exam: { batch: { instituteId: campusId } } },
    orderBy: { marksObtained: "desc" },
    include: {
      student: true,
      exam: {
        include: { subject: true, batch: true },
      },
    },
  });

  // ── Fetch all exams for the "by-exam" analytics section ──────────────────
  const allExams = await db.exam.findMany({
    where: { batch: { instituteId: campusId } },
    orderBy: { examDate: "desc" },
    include: {
      subject: true,
      batch: true,
      marks: true,
      _count: { select: { marks: true } },
    },
  });

  // ── KPI Computations ───────────────────────────────────────────────────────
  const totalAssessments = allExams.length;
  const gradedMarks = allMarks.length;
  const passedMarks = allMarks.filter((m) => m.isPassed).length;
  const overallPassRate =
    gradedMarks > 0 ? Math.round((passedMarks / gradedMarks) * 100) : 0;
  const topScore =
    allMarks.length > 0
      ? Math.max(...allMarks.map((m) => m.percentage))
      : 0;
  const activeExams = allExams.filter(
    (e) => e.status === "UPCOMING" || e.status === "ONGOING"
  ).length;

  // ── Per-exam analytics ────────────────────────────────────────────────────
  const examAnalytics = allExams.map((exam) => {
    const examMarks = exam.marks;
    const count = examMarks.length;
    const avgScore =
      count > 0
        ? Math.round(
            (examMarks.reduce((a, m) => a + m.percentage, 0) / count) * 10
          ) / 10
        : 0;
    const passCount = examMarks.filter((m) => m.isPassed).length;
    const passRate = count > 0 ? Math.round((passCount / count) * 100) : 0;
    const topMark =
      count > 0 ? Math.max(...examMarks.map((m) => m.marksObtained)) : 0;
    return {
      ...exam,
      graded: count,
      avgScore,
      passRate,
      topMark,
    };
  });

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Results &amp; Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Merit rankings, subject performance, and per-exam grade analytics.
          </p>
        </div>
        <PrintButton label="Print Official Merit Gazette" />
      </div>

      {/* Printable Institution Letterhead for Merit Board */}
      <div className="hidden print-only border-b-2 border-zinc-900 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center font-black text-lg border border-black">
              FL
            </div>
            <div>
              <h1 className="text-lg font-black text-primary">FUTUREX LEARNING</h1>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                Official Examination Merit Gazette &amp; Rank Ledger
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-zinc-600">
            <p>Generated: {formatDate(new Date())}</p>
            <p className="font-mono">Central Examination Cell</p>
          </div>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Assessments",
            value: totalAssessments,
            icon: ClipboardCheck,
            color: "text-primary",
          },
          {
            label: "Overall Pass Rate",
            value: `${overallPassRate}%`,
            icon: TrendingUp,
            color: "text-emerald-600",
          },
          {
            label: "Top Score",
            value: `${topScore}%`,
            icon: Award,
            color: "text-amber-600",
          },
          {
            label: "Active Exams",
            value: activeExams,
            icon: BarChart2,
            color: "text-blue-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted/50 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 1: MERIT BOARD
      ───────────────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="p-5 border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Merit Board
          </CardTitle>
          <CardDescription className="text-xs">
            All assessed students ranked by marks obtained across every exam
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {allMarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="rounded-full bg-muted p-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">No results yet</p>
              <p className="text-sm text-muted-foreground">
                Enter marks for scheduled exams to see rankings here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                    <th className="p-3 pl-5">Rank</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3">Exam</th>
                    <th className="p-3">Score / Max</th>
                    <th className="p-3">%</th>
                    <th className="p-3 pr-5">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allMarks.map((m, idx) => (
                    <tr
                      key={m.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        idx < 3 ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <td className="p-3 pl-5 font-bold text-sm">
                        {idx === 0
                          ? "🥇 1"
                          : idx === 1
                          ? "🥈 2"
                          : idx === 2
                          ? "🥉 3"
                          : `#${idx + 1}`}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">
                          {m.student.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {m.student.studentId}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {m.exam.batch.name}
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-foreground block">
                          {m.exam.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {m.exam.subject.name}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-sm text-primary">
                          {m.marksObtained}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {m.exam.maxMarks}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{m.percentage}%</td>
                      <td className="p-3 pr-5">
                        <GradeBadge grade={m.grade} passed={m.isPassed} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 2: BY-EXAM ANALYTICS
      ───────────────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="p-5 border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            Exam-Level Analytics
          </CardTitle>
          <CardDescription className="text-xs">
            Aggregated performance metrics per scheduled assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {allExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="rounded-full bg-muted p-4">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">
                No exams scheduled
              </p>
              <p className="text-sm text-muted-foreground">
                Schedule exams from the Examinations page first.
              </p>
              <Link
                href="/exams"
                className="text-xs text-primary underline underline-offset-2"
              >
                Go to Examinations →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                    <th className="p-3 pl-5">Exam Title</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Graded</th>
                    <th className="p-3 text-center">Avg Score</th>
                    <th className="p-3 text-center">Pass Rate</th>
                    <th className="p-3 text-center">Top Mark</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {examAnalytics.map((ea) => (
                    <tr
                      key={ea.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-3 pl-5">
                        <span className="font-semibold text-foreground block">
                          {ea.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {ea.code}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {ea.subject.name}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {ea.batch.name}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatDate(ea.examDate)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-semibold text-foreground">
                          {ea.graded}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {ea.graded > 0 ? (
                          <span
                            className={`font-semibold ${
                              ea.avgScore >= 60
                                ? "text-emerald-600"
                                : ea.avgScore >= 40
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {ea.avgScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {ea.graded > 0 ? (
                          <span
                            className={`font-semibold ${
                              ea.passRate >= 70
                                ? "text-emerald-600"
                                : ea.passRate >= 40
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {ea.passRate}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-semibold text-primary">
                        {ea.graded > 0 ? `${ea.topMark}` : "—"}
                      </td>
                      <td className="p-3 text-center">
                        <ExamStatusBadge status={ea.status} />
                      </td>
                      <td className="p-3 pr-5 text-right">
                        <Link
                          href={`/exams/${ea.id}/marks`}
                          className="inline-flex items-center gap-1 text-primary text-[11px] font-semibold hover:underline underline-offset-2"
                        >
                          <Award className="h-3 w-3" />
                          Enter Marks
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
