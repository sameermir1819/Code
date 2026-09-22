"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExamById, saveExamMarks } from "@/server/actions/exams";
import { calculateGrade, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, CheckCircle2, Award, Printer } from "lucide-react";
import Link from "next/link";

export default function ExamMarksEntryPage() {
  const params = useParams();
  const examId = params.id as string;
  const router = useRouter();

  const [exam, setExam] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadExam() {
      const data = await getExamById(examId);
      setExam(data.exam);
      setRoster(data.roster);
      setAnalytics(data.analytics);
    }
    loadExam();
  }, [examId]);

  const handleMarksChange = (studentId: string, val: number) => {
    setRoster((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          const max = exam?.maxMarks || 100;
          const marks = Math.min(max, Math.max(0, val));
          const pct = Math.round((marks / max) * 1000) / 10;
          const { grade, isPassed } = calculateGrade(pct);
          return {
            ...item,
            marksObtained: marks,
            percentage: pct,
            grade,
            isPassed,
          };
        }
        return item;
      })
    );
  };

  const handleRemarksChange = (studentId: string, rem: string) => {
    setRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, remarks: rem } : item))
    );
  };

  const handleSave = () => {
    setFeedback("");
    startTransition(async () => {
      try {
        await saveExamMarks(
          examId,
          roster.map((r) => ({
            studentId: r.studentId,
            marksObtained: Number(r.marksObtained),
            remarks: r.remarks,
          }))
        );
        setFeedback("Exam marks and grades saved successfully!");
        router.refresh();
      } catch (e: any) {
        setFeedback(`Error: ${e.message}`);
      }
    });
  };

  if (!exam) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading exam roster...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/exams"
            className="h-9 w-9 rounded-lg border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{exam.title}</h1>
            <p className="text-xs text-muted-foreground">
              {exam.subject.name} • {exam.batch.name} • Max: {exam.maxMarks} Marks (Passing: {exam.passingMarks})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="text-xs flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Award Sheet</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="text-xs flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isPending ? "Saving Grades..." : "Save & Publish Marks"}</span>
          </Button>
        </div>
      </div>

      {/* Print-Only Official Exam Letterhead */}
      <div className="hidden print-only border-b-2 border-zinc-900 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center font-black text-lg border border-black">
              FL
            </div>
            <div>
              <h2 className="text-base font-black text-primary">FUTUREX LEARNING</h2>
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                Official Examination Award Sheet &amp; Marks Gazette
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-zinc-600">
            <p className="font-bold text-zinc-900">{exam.title} ({exam.code})</p>
            <p>Subject: {exam.subject.name} • Batch: {exam.batch.name}</p>
            <p>Max Marks: {exam.maxMarks} • Passing: {exam.passingMarks} • Date: {formatDate(exam.examDate)}</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold ${
            feedback.startsWith("Error")
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <Card className="p-3 text-center">
            <span className="text-muted-foreground block text-[11px]">Enrolled Students</span>
            <span className="text-lg font-bold">{analytics.totalStudents}</span>
          </Card>
          <Card className="p-3 text-center">
            <span className="text-muted-foreground block text-[11px]">Highest Marks</span>
            <span className="text-lg font-bold text-emerald-600">{analytics.highestMarks}</span>
          </Card>
          <Card className="p-3 text-center">
            <span className="text-muted-foreground block text-[11px]">Lowest Marks</span>
            <span className="text-lg font-bold text-red-500">{analytics.lowestMarks}</span>
          </Card>
          <Card className="p-3 text-center">
            <span className="text-muted-foreground block text-[11px]">Batch Average</span>
            <span className="text-lg font-bold text-primary">{analytics.avgMarks}</span>
          </Card>
          <Card className="p-3 text-center">
            <span className="text-muted-foreground block text-[11px]">Pass Rate</span>
            <span className="text-lg font-bold text-emerald-600">{analytics.passPercentage}%</span>
          </Card>
        </div>
      )}

      {/* Spreadsheet Marks Entry Table */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base font-semibold">Marks Roster</CardTitle>
          <CardDescription className="text-xs">
            Enter marks obtained; percentages and grades are calculated automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                  <th className="p-3 pl-4">Roll No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3 w-36">Marks (Max: {exam.maxMarks})</th>
                  <th className="p-3">Percentage</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3 pr-4">Remarks / Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roster.map((s) => (
                  <tr key={s.studentId} className="hover:bg-muted/20">
                    <td className="p-3 pl-4 font-mono font-semibold text-primary">{s.studentCode}</td>
                    <td className="p-3 font-semibold text-foreground">{s.name}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        max={exam.maxMarks}
                        value={s.marksObtained}
                        onChange={(e) => handleMarksChange(s.studentId, Number(e.target.value))}
                        className="w-24 h-8 px-2 rounded border border-input bg-background font-bold text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="p-3 font-semibold text-foreground">{s.percentage}%</td>
                    <td className="p-3">
                      <Badge
                        variant={s.isPassed ? "success" : "destructive"}
                        className="text-[11px] font-bold"
                      >
                        {s.grade}
                      </Badge>
                    </td>
                    <td className="p-3 pr-4">
                      <input
                        type="text"
                        value={s.remarks || ""}
                        onChange={(e) => handleRemarksChange(s.studentId, e.target.value)}
                        placeholder="Optional teacher remarks..."
                        className="w-full h-8 px-2 rounded border border-input bg-background text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

