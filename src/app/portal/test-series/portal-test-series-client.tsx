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
} from "lucide-react";
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
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                Offline Test Series &amp; OMR Rankings
              </h1>
              <p className="text-xs text-zinc-400">
                Official offline mock test programs, Hall Ticket Roll Numbers, and national percentile scorecards.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 backdrop-blur-sm flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Verified Student Enrollment</span>
          </div>
        </div>
      </div>

      {/* ── Feedback Message ── */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            msg.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-300 border-rose-500/20"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="ml-auto hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Sub Navigation ── */}
      <div className="flex border-b border-white/10 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("registered")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 ${
            activeTab === "registered"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Enrolled Test Series ({registeredSeries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("results")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 ${
            activeTab === "results"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Scorecards &amp; Rankings ({allResults.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("explore")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 ${
            activeTab === "explore"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Explore Upcoming Test Series ({availableSeries.length})</span>
        </button>
      </div>

      {/* ── TAB 1: Registered Test Series ── */}
      {activeTab === "registered" && (
        <div className="space-y-6">
          {registeredSeries.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/[0.02] text-zinc-400 text-xs space-y-3">
              <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-semibold text-white">You are not enrolled in any offline test series yet.</p>
              <p className="text-zinc-500 max-w-sm mx-auto">
                Explore available offline test series programs for NEET and JEE to practice on official OMR answer sheets.
              </p>
              <Button
                onClick={() => setActiveTab("explore")}
                className="h-9 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Browse Test Series
              </Button>
            </div>
          ) : (
            registeredSeries.map((reg) => (
              <div
                key={reg.id}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6 shadow-sm"
              >
                {/* Series Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {reg.testSeries.targetExam}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">{reg.testSeries.code}</span>
                    </div>
                    <h2 className="text-lg font-black text-white">{reg.testSeries.title}</h2>
                    <p className="text-xs text-zinc-400">{reg.testSeries.description}</p>
                  </div>

                  {/* Hall Ticket Roll Number Card */}
                  <div className="p-4 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center gap-4 shrink-0">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-indigo-300 uppercase block">
                        EXAM HALL ROLL NUMBER
                      </span>
                      <span className="text-xl font-black font-mono text-white tracking-wider">
                        {reg.rollNumber}
                      </span>
                      <span className="text-[10px] text-zinc-400 block">Fill on OMR answer sheet</span>
                    </div>
                    <Button
                      onClick={() => setSelectedAdmitSlip(reg)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-bold border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/20 gap-1 rounded-xl"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Admit Slip</span>
                    </Button>
                  </div>
                </div>

                {/* Exam Hall Venue Info */}
                <div className="flex items-center gap-2 text-xs text-zinc-300 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Official Test Center Venue:</strong>{" "}
                    {reg.testSeries.testCenterVenue || "Main Campus Examination Center"}
                  </span>
                </div>

                {/* Tests Schedule List inside this series */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Offline Tests Schedule &amp; OMR Syllabus ({reg.testSeries.exams.length} Tests)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reg.testSeries.exams.map((exam) => {
                      const hasResult = exam.results && exam.results.length > 0;
                      const result = hasResult ? exam.results![0] : null;

                      return (
                        <div
                          key={exam.id}
                          className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 hover:border-white/15 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-indigo-400">
                                Test #{exam.testNumber} • {exam.code}
                              </span>
                              <h4 className="text-xs font-bold text-white leading-tight mt-0.5">
                                {exam.title}
                              </h4>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                hasResult
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              }`}
                            >
                              {hasResult ? "Scorecard Ready" : "Upcoming"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                            <div>
                              <span className="text-zinc-500 block">Exam Date:</span>
                              <span className="text-zinc-200 font-semibold">
                                {new Date(exam.examDate).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">Duration &amp; Marks:</span>
                              <span className="text-zinc-200 font-semibold">
                                {exam.durationMinutes} mins • {exam.maxMarks} M
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] text-zinc-400 space-y-1 pt-1 border-t border-white/5">
                            <div>
                              <span className="text-zinc-500">Seating:</span>{" "}
                              <span className="text-zinc-300">{exam.venueRoom}</span>
                            </div>
                            {exam.syllabus && (
                              <div>
                                <span className="text-zinc-500">Syllabus:</span>{" "}
                                <span className="text-zinc-300">{exam.syllabus}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Score badge if available */}
                          {hasResult && result && (
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                              <span className="font-semibold text-emerald-300">
                                Score: {result.marksObtained}/{result.maxMarks} ({result.percentage}%)
                              </span>
                              <span className="font-mono font-bold text-white">
                                Rank #{result.rank || "—"} ({result.percentile}%ile)
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB 2: Scorecards & Ranks ── */}
      {activeTab === "results" && (
        <div className="space-y-4">
          {allResults.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/[0.02] text-zinc-400 text-xs space-y-2">
              <Award className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-semibold text-white">No published offline test results yet.</p>
              <p className="text-zinc-500">
                Scorecards and nationwide rank analytics will appear here as soon as offline OMR papers are evaluated.
              </p>
            </div>
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
                  <div
                    key={result.id}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 block">
                          Roll No: {rollNumber} • {exam.code}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5">{exam.title}</h3>
                        <span className="text-xs text-indigo-400">{testSeriesTitle}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400 block text-lg">
                          {result.marksObtained}
                          <span className="text-xs font-normal text-zinc-400">/{result.maxMarks}</span>
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-400">
                          {result.percentage}% Score
                        </span>
                      </div>
                    </div>

                    {/* Rank & Percentile Cards */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                        <span className="text-[10px] font-semibold text-indigo-300 block">OVERALL RANK</span>
                        <span className="text-xl font-black text-white">#{result.rank || "—"}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                        <span className="text-[10px] font-semibold text-purple-300 block">PERCENTILE</span>
                        <span className="text-xl font-black text-white">{result.percentile || "—"}%</span>
                      </div>
                    </div>

                    {/* Subject-Wise Breakdown if available */}
                    {Object.keys(subjectBreakup).length > 0 && (
                      <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Subject-Wise Marks
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(subjectBreakup).map(([subj, marks]) => (
                            <div key={subj} className="p-2 rounded-lg bg-white/5 text-center">
                              <span className="text-[10px] text-zinc-400 block truncate">{subj}</span>
                              <span className="font-bold text-white">{marks} M</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remarks & Solutions */}
                    {result.remarks && (
                      <div className="text-xs text-zinc-300 italic p-2.5 rounded-xl bg-white/[0.02]">
                        "{result.remarks}"
                      </div>
                    )}

                    {exam.answerKeyUrl && (
                      <a
                        href={exam.answerKeyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download Official Answer Key &amp; Solutions PDF</span>
                      </a>
                    )}
                  </div>
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
              <div className="col-span-3 py-12 text-center text-zinc-500 text-xs">
                You are currently enrolled in all active test series programs!
              </div>
            ) : (
              availableSeries.map((series) => (
                <div
                  key={series.id}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                        {series.targetExam}
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-400">{series.code}</span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-tight">{series.title}</h3>
                    <p className="text-xs text-zinc-400">{series.description}</p>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-xs text-zinc-300">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">One-Time Fee:</span>
                        <span className="font-bold text-emerald-400">
                          ₹{series.fee.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Total Mock Tests:</span>
                        <span className="font-semibold text-white">{series.totalTests} Offline Tests</span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{series.testCenterVenue}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSelfEnroll(series.id)}
                    disabled={isPending}
                    className="w-full h-10 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isPending ? "Registering..." : `Register for ₹${series.fee}`}</span>
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Admit Card & Roll Number Slip Modal ── */}
      {selectedAdmitSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  OFFICIAL ADMISSION &amp; ROLL NUMBER SLIP
                </span>
                <h3 className="text-base font-extrabold text-zinc-900">Offline Test Series Verification</h3>
              </div>
              <button
                onClick={() => setSelectedAdmitSlip(null)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">EXAM HALL ROLL NUMBER</span>
              <div className="text-2xl font-black text-indigo-700 tracking-wider">
                {selectedAdmitSlip.rollNumber}
              </div>
              <span className="text-[10px] text-zinc-400">Quote this Roll No on offline OMR Answer Sheets</span>
            </div>

            <div className="space-y-2 text-xs border-y py-3">
              <div className="flex justify-between">
                <span className="text-zinc-500">Candidate Name:</span>
                <span className="font-bold text-zinc-900">{student?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Test Series:</span>
                <span className="font-bold text-zinc-900 text-right max-w-[200px] truncate">
                  {selectedAdmitSlip.testSeries?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Receipt Number:</span>
                <span className="font-mono font-bold text-zinc-800">{selectedAdmitSlip.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">One-Time Fee Paid:</span>
                <span className="font-bold text-emerald-600">
                  ₹{selectedAdmitSlip.feeAmount?.toLocaleString("en-IN")} ({selectedAdmitSlip.paymentMethod})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Center Venue:</span>
                <span className="font-medium text-zinc-800 text-right max-w-[200px]">
                  {selectedAdmitSlip.testSeries?.testCenterVenue}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.print()}
                className="flex-1 h-10 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Slip</span>
              </Button>
              <Button
                onClick={() => setSelectedAdmitSlip(null)}
                variant="outline"
                className="h-10 text-xs rounded-xl"
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

