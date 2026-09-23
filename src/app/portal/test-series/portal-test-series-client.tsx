"use client";

import React, { useState, useTransition } from "react";
import { enrollStudentSelf } from "@/server/actions/test-series";
import {
  Layers,
  Calendar,
  Award,
  Clock,
  MapPin,
  FileText,
  Printer,
  ChevronRight,
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  QrCode,
  ShieldCheck,
  X,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TestExamWithResults {
  id: string;
  testNumber: number;
  title: string;
  code: string;
  examDate: string | Date;
  durationMinutes: number;
  maxMarks: number;
  passingMarks: number;
  syllabus?: string | null;
  venueRoom?: string | null;
  paperType?: string | null;
  questionPaperUrl?: string | null;
  answerKeyUrl?: string | null;
  status: string;
  results?: Array<{
    id: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    rank?: number | null;
    percentile?: number | null;
    attendance: string;
    subjectBreakup?: string | null;
    negativeMarks?: number | null;
    correctCount?: number | null;
    incorrectCount?: number | null;
    unattemptedCount?: number | null;
    remarks?: string | null;
  }>;
}

interface RegisteredSeriesItem {
  id: string;
  rollNumber: string;
  feeAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  receiptNo: string;
  paidAt?: string | Date | null;
  testSeries: {
    id: string;
    title: string;
    code: string;
    targetExam: string;
    description?: string | null;
    totalTests: number;
    testCenterVenue?: string | null;
    exams: TestExamWithResults[];
  };
}

interface AvailableSeriesItem {
  id: string;
  title: string;
  code: string;
  targetExam: string;
  description?: string | null;
  fee: number;
  totalTests: number;
  startDate: string | Date;
  endDate: string | Date;
  testCenterVenue?: string | null;
  exams: any[];
}

interface Props {
  registeredSeries: RegisteredSeriesItem[];
  availableSeries: AvailableSeriesItem[];
  student: any;
}

export function PortalTestSeriesClient({ registeredSeries, availableSeries, student }: Props) {
  const [activeTab, setActiveTab] = useState<"registered" | "results" | "explore">("registered");
  const [selectedAdmitSlip, setSelectedAdmitSlip] = useState<RegisteredSeriesItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Collect all published exam results across registered series
  const allResults = registeredSeries.flatMap((reg) =>
    reg.testSeries.exams
      .filter((exam) => exam.results && exam.results.length > 0)
      .map((exam) => ({
        exam,
        result: exam.results![0],
        testSeriesTitle: reg.testSeries.title,
        rollNumber: reg.rollNumber,
      }))
  );

  const handleSelfEnroll = (seriesId: string) => {
    setMsg(null);
    startTransition(async () => {
      const res = await enrollStudentSelf(seriesId, "UPI");
      if (res.success) {
        setMsg({
          type: "success",
          text: `Enrolled successfully! Assigned Roll No: ${res.registration?.rollNumber}. You can now view your test schedule.`,
        });
        setActiveTab("registered");
      } else {
        setMsg({
          type: "error",
          text: res.error || "Failed to enroll in test series.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header Banner ── */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-background p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="default" className="text-[10px] uppercase font-mono tracking-wider">
              Student Testing Portal
            </Badge>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>OMR Assessments</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Offline Test Series &amp; OMR Rankings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Access official offline mock tests, Hall Ticket Roll Numbers, and national percentile scorecards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-card border text-xs text-foreground flex items-center gap-2 shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-semibold">{student?.name || "Student"} ({student?.studentId})</span>
          </div>
        </div>
      </div>

      {/* ── Status Feedback Message ── */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            msg.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              : "bg-destructive/10 text-destructive border-destructive/30"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Clean Segmented Pill Navigation ── */}
      <div className="flex bg-muted/50 p-1.5 rounded-2xl border gap-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("registered")}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "registered"
              ? "bg-background text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>My Enrolled Series ({registeredSeries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("results")}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "results"
              ? "bg-background text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>Scorecards &amp; Rankings ({allResults.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("explore")}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "explore"
              ? "bg-background text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Explore Upcoming Series ({availableSeries.length})</span>
        </button>
      </div>

      {/* ── TAB 1: Registered Test Series ── */}
      {activeTab === "registered" && (
        <div className="space-y-6">
          {registeredSeries.length === 0 ? (
            <Card className="rounded-2xl border bg-card/60 p-12 text-center text-xs space-y-3">
              <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-foreground text-sm">You are not enrolled in any offline test series yet.</p>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Explore available offline test series programs for NEET and JEE to practice on official OMR answer sheets.
              </p>
              <Button
                onClick={() => setActiveTab("explore")}
                className="h-8 text-xs font-semibold rounded-lg bg-primary text-primary-foreground"
              >
                Browse Test Series
              </Button>
            </Card>
          ) : (
            registeredSeries.map((reg) => (
              <Card
                key={reg.id}
                className="rounded-2xl border bg-card/60 shadow-2xs space-y-5 p-6"
              >
                {/* Series Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase font-semibold">
                        {reg.testSeries.targetExam}
                      </Badge>
                      <span className="text-xs font-mono font-semibold text-muted-foreground">{reg.testSeries.code}</span>
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{reg.testSeries.title}</h2>
                    <p className="text-xs text-muted-foreground">{reg.testSeries.description}</p>
                  </div>

                  {/* Hall Ticket Roll Number Box */}
                  <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-4 shrink-0">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
                        EXAM HALL ROLL NUMBER
                      </span>
                      <span className="text-xl font-black font-mono text-primary tracking-widest">
                        {reg.rollNumber}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">Quote on OMR Answer Sheet</span>
                    </div>
                    <Button
                      onClick={() => setSelectedAdmitSlip(reg)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1 rounded-lg hover:bg-muted"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Admit Slip</span>
                    </Button>
                  </div>
                </div>

                {/* Exam Hall Venue Info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-muted/40 border">
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>
                    <strong className="text-foreground">Official Examination Center:</strong>{" "}
                    {reg.testSeries.testCenterVenue || "Main Campus Examination Center"}
                  </span>
                </div>

                {/* Tests Schedule List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Offline Tests Schedule &amp; OMR Syllabus ({reg.testSeries.exams.length} Tests)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reg.testSeries.exams.map((exam) => {
                      const hasResult = exam.results && exam.results.length > 0;
                      const result = hasResult ? exam.results![0] : null;

                      return (
                        <div
                          key={exam.id}
                          className="p-4 rounded-xl bg-muted/20 border space-y-2.5 hover:border-primary/40 transition-all text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-primary">
                                Test #{exam.testNumber} • {exam.code}
                              </span>
                              <h4 className="text-sm font-bold text-foreground leading-tight mt-0.5">
                                {exam.title}
                              </h4>
                            </div>

                            <Badge
                              variant={hasResult ? "success" : "outline"}
                              className="text-[10px]"
                            >
                              {hasResult ? "Scorecard Ready" : "Upcoming"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                            <div>
                              <span className="text-[10px] block">Exam Date:</span>
                              <span className="text-foreground font-semibold">
                                {new Date(exam.examDate).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] block">Duration &amp; Marks:</span>
                              <span className="text-foreground font-semibold">
                                {exam.durationMinutes} mins • {exam.maxMarks} M
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1.5 border-t">
                            <div>
                              <span>Seating:</span>{" "}
                              <span className="text-foreground font-medium">{exam.venueRoom}</span>
                            </div>
                            {exam.syllabus && (
                              <div className="truncate">
                                <span>Syllabus:</span>{" "}
                                <span className="text-foreground font-medium">{exam.syllabus}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Score summary badge */}
                          {hasResult && result && (
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs mt-1">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                Score: {result.marksObtained}/{result.maxMarks} ({result.percentage}%)
                              </span>
                              <span className="font-mono font-bold text-foreground">
                                Rank #{result.rank || "—"} ({result.percentile}%ile)
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── TAB 2: Scorecards & Ranks ── */}
      {activeTab === "results" && (
        <div className="space-y-4">
          {allResults.length === 0 ? (
            <Card className="rounded-2xl border bg-card/60 p-12 text-center text-xs space-y-2">
              <Award className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-foreground text-sm">No published offline test results yet.</p>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Scorecards and nationwide rank analytics will appear here as soon as offline OMR papers are evaluated.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allResults.map(({ exam, result, testSeriesTitle, rollNumber }) => {
                let subjectBreakup: Record<string, number> = {};
                try {
                  if (result.subjectBreakup) {
                    subjectBreakup = JSON.parse(result.subjectBreakup);
                  }
                } catch {
                  // ignore
                }

                return (
                  <Card
                    key={result.id}
                    className="rounded-2xl border bg-card/60 shadow-2xs space-y-4 p-5 hover:border-primary/50 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-muted-foreground block">
                          Roll No: {rollNumber} • {exam.code}
                        </span>
                        <h3 className="text-base font-bold text-foreground mt-0.5">{exam.title}</h3>
                        <span className="text-xs text-primary font-medium">{testSeriesTitle}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block leading-tight">
                          {result.marksObtained}
                          <span className="text-xs font-normal text-muted-foreground">/{result.maxMarks}</span>
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {result.percentage}% Score
                        </span>
                      </div>
                    </div>

                    {/* Rank & Percentile Metric Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
                        <span className="text-[10px] font-semibold text-primary block uppercase tracking-wider">OVERALL RANK</span>
                        <span className="text-2xl font-black text-foreground">#{result.rank || "—"}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 block uppercase tracking-wider">PERCENTILE</span>
                        <span className="text-2xl font-black text-foreground">{result.percentile || "—"}%</span>
                      </div>
                    </div>

                    {/* Subject-Wise Breakdown */}
                    {Object.keys(subjectBreakup).length > 0 && (
                      <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Subject-Wise Score Breakdown
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(subjectBreakup).map(([subj, marks]) => (
                            <div key={subj} className="p-2 rounded-lg bg-card border text-center">
                              <span className="text-[10px] text-muted-foreground block truncate">{subj}</span>
                              <span className="font-bold text-foreground">{marks} M</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Faculty Remarks */}
                    {result.remarks && (
                      <div className="text-xs text-muted-foreground italic p-2.5 rounded-xl bg-muted/30 border">
                        &ldquo;{result.remarks}&rdquo;
                      </div>
                    )}

                    {/* Answer Key / Solutions Link */}
                    {exam.answerKeyUrl && (
                      <a
                        href={exam.answerKeyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-1"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Download Official Answer Key &amp; Solutions PDF</span>
                      </a>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Explore Upcoming Series ── */}
      {activeTab === "explore" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSeries.length === 0 ? (
              <div className="col-span-3 py-16 text-center text-muted-foreground text-xs">
                You are currently enrolled in all active test series programs!
              </div>
            ) : (
              availableSeries.map((series) => (
                <Card
                  key={series.id}
                  className="rounded-2xl border bg-card/60 shadow-2xs hover:border-primary/50 transition-all flex flex-col justify-between p-5 space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase font-semibold">
                        {series.targetExam}
                      </Badge>
                      <span className="text-xs font-mono font-semibold text-muted-foreground">{series.code}</span>
                    </div>

                    <h3 className="text-base font-bold text-foreground leading-snug">{series.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{series.description}</p>

                    <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">One-Time Fee:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{series.fee.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Mock Tests:</span>
                        <span className="font-semibold text-foreground">{series.totalTests} Offline Tests</span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1 border-t text-[11px] text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{series.testCenterVenue}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSelfEnroll(series.id)}
                    disabled={isPending}
                    className="w-full h-9 text-xs font-semibold rounded-xl bg-primary text-primary-foreground gap-2 shadow-xs hover:bg-primary/90"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>{isPending ? "Registering..." : `Register for ₹${series.fee}`}</span>
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Admit Card & Roll Number Slip Modal ── */}
      {selectedAdmitSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  OFFICIAL ADMISSION &amp; ROLL NUMBER SLIP
                </span>
                <h3 className="text-base font-extrabold text-foreground">Offline Test Series Verification</h3>
              </div>
              <button
                onClick={() => setSelectedAdmitSlip(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">EXAM HALL ROLL NUMBER</span>
              <div className="text-2xl font-black text-primary tracking-widest font-mono">
                {selectedAdmitSlip.rollNumber}
              </div>
              <span className="text-[10px] text-muted-foreground">Quote this Roll No on offline OMR Answer Sheets</span>
            </div>

            <div className="space-y-2.5 text-xs border-y py-3.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Candidate Name:</span>
                <span className="font-bold text-foreground">{student?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Test Series:</span>
                <span className="font-bold text-foreground text-right max-w-[200px] truncate">
                  {selectedAdmitSlip.testSeries?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt Number:</span>
                <span className="font-mono font-bold text-foreground">{selectedAdmitSlip.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">One-Time Fee Paid:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{selectedAdmitSlip.feeAmount?.toLocaleString("en-IN")} ({selectedAdmitSlip.paymentMethod})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Center Venue:</span>
                <span className="font-medium text-foreground text-right max-w-[200px]">
                  {selectedAdmitSlip.testSeries?.testCenterVenue}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.print()}
                className="flex-1 h-9 text-xs font-semibold rounded-xl bg-primary text-primary-foreground gap-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Slip</span>
              </Button>
              <Button
                onClick={() => setSelectedAdmitSlip(null)}
                variant="outline"
                className="h-9 text-xs rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
