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
  Download,
  Filter,
  ArrowRight,
  HelpCircle,
  FileQuestion,
  KeyRound,
} from "lucide-react";

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

export function PortalTestSeriesClient({
  registeredSeries,
  availableSeries,
  student,
}: Props) {
  // Navigation tabs: "all" (Enrolled series), "results" (Scorecards), "available" (New series)
  const [activeTab, setActiveTab] = useState<"enrolled" | "results" | "explore">("enrolled");

  // Selected single test series filter (either "ALL" or specific series ID)
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("ALL");

  // Modals
  const [selectedAdmitSlip, setSelectedAdmitSlip] = useState<RegisteredSeriesItem | null>(null);
  const [selectedExamDetails, setSelectedExamDetails] = useState<TestExamWithResults | null>(null);

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
        targetExam: reg.testSeries.targetExam,
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
        setActiveTab("enrolled");
        setSelectedSeriesId(seriesId);
      } else {
        setMsg({
          type: "error",
          text: res.error || "Failed to enroll in test series.",
        });
      }
    });
  };

  // Filter registered series if a specific series button is selected
  const displayedRegistered =
    selectedSeriesId === "ALL"
      ? registeredSeries
      : registeredSeries.filter((r) => r.testSeries.id === selectedSeriesId);

  // Filter available series if a specific series button is selected
  const displayedAvailable =
    selectedSeriesId === "ALL"
      ? availableSeries
      : availableSeries.filter((s) => s.id === selectedSeriesId);

  return (
    <div className="space-y-6">
      {/* ── Top Header Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-[#0d1322] to-purple-950/40 border border-white/10 p-6 sm:p-7 backdrop-blur-2xl shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Official Examination Center
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>OMR Pen-Paper Offline</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Offline Test Series &amp; OMR Rankings
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
              Official mock test schedules, Hall Ticket Roll Numbers for OMR answer sheets,
              and subject-wise performance scorecards.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
              <span className="text-[10px] text-zinc-400 block font-medium">STUDENT ID</span>
              <span className="font-mono font-bold text-white text-xs">{student?.studentId || "STU-001"}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
              <span className="text-[10px] text-zinc-400 block font-medium">NAME</span>
              <span className="font-bold text-white text-xs truncate max-w-[120px] block">
                {student?.name?.split(" ")[0] || "Student"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Message Alert ── */}
      {msg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 shadow-lg animate-in fade-in ${
            msg.type === "success"
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              : "bg-rose-500/15 text-rose-300 border-rose-500/30"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{msg.text}</span>
          <button
            onClick={() => setMsg(null)}
            className="text-zinc-400 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── DEDICATED TEST SERIES BUTTONS / SELECTOR STRIP ── */}
      {/* (User requirement: "aghr koi test series add hoti hai to uskay b button rakho alag se") */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select Test Series Program:</span>
          </span>
          <span className="text-[10px] text-zinc-500">
            {registeredSeries.length} Enrolled • {availableSeries.length} Open
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Button: All Programs */}
          <button
            onClick={() => {
              setSelectedSeriesId("ALL");
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
              selectedSeriesId === "ALL"
                ? "bg-white text-zinc-950 border-white shadow-md shadow-white/10"
                : "bg-white/[0.03] text-zinc-300 border-white/10 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Programs</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedSeriesId === "ALL"
                  ? "bg-zinc-900 text-white"
                  : "bg-white/10 text-zinc-400"
              }`}
            >
              {registeredSeries.length + availableSeries.length}
            </span>
          </button>

          {/* Dedicated Button for each Enrolled Test Series */}
          {registeredSeries.map((reg) => {
            const isSelected = selectedSeriesId === reg.testSeries.id;
            return (
              <button
                key={reg.id}
                onClick={() => {
                  setSelectedSeriesId(reg.testSeries.id);
                  setActiveTab("enrolled");
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30"
                    : "bg-indigo-500/10 text-indigo-300 border-indigo-500/25 hover:bg-indigo-500/20 hover:text-white"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                <span>{reg.testSeries.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/15 text-white font-bold">
                  {reg.rollNumber.split("-").pop()}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Enrolled & Active" />
              </button>
            );
          })}

          {/* Dedicated Button for each Newly Added / Available Test Series */}
          {availableSeries.map((series) => {
            const isSelected = selectedSeriesId === series.id;
            return (
              <button
                key={series.id}
                onClick={() => {
                  setSelectedSeriesId(series.id);
                  setActiveTab("explore");
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? "bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/25 hover:bg-amber-500/20 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{series.title}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  ₹{series.fee.toLocaleString("en-IN")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── View Filter Tabs (Enrolled vs Scorecards vs Explore) ── */}
      <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 gap-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("enrolled")}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "enrolled"
              ? "bg-white text-zinc-950 font-bold shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>My Enrolled Tests ({registeredSeries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("results")}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "results"
              ? "bg-white text-zinc-950 font-bold shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Scorecards &amp; Rankings ({allResults.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("explore")}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "explore"
              ? "bg-white text-zinc-950 font-bold shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Explore Open Series ({availableSeries.length})</span>
        </button>
      </div>

      {/* ── TAB 1: ENROLLED TEST SERIES ── */}
      {activeTab === "enrolled" && (
        <div className="space-y-6">
          {displayedRegistered.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white/[0.03] border border-white/10 text-center text-xs space-y-3 shadow-xl">
              <Layers className="w-10 h-10 text-zinc-500 mx-auto" />
              <p className="font-bold text-white text-sm">
                {selectedSeriesId !== "ALL"
                  ? "You are not enrolled in this specific test series."
                  : "You are not enrolled in any offline test series yet."}
              </p>
              <p className="text-zinc-400 max-w-sm mx-auto">
                Explore available offline test series programs for NEET and JEE to practice on official OMR answer sheets.
              </p>
              <button
                onClick={() => {
                  setSelectedSeriesId("ALL");
                  setActiveTab("explore");
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Browse Available Series →
              </button>
            </div>
          ) : (
            displayedRegistered.map((reg) => (
              <div
                key={reg.id}
                className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 shadow-xl space-y-5"
              >
                {/* Series Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {reg.testSeries.targetExam}
                      </span>
                      <span className="text-xs font-mono font-semibold text-zinc-400">
                        {reg.testSeries.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        ENROLLED
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      {reg.testSeries.title}
                    </h2>
                    {reg.testSeries.description && (
                      <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                        {reg.testSeries.description}
                      </p>
                    )}
                  </div>

                  {/* Hall Ticket Roll Number Box & Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                    <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-0.5">
                      <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider block">
                        EXAM HALL ROLL NUMBER
                      </span>
                      <span className="text-lg sm:text-xl font-black font-mono text-white tracking-wider block">
                        {reg.rollNumber}
                      </span>
                      <span className="text-[9px] text-zinc-400 block">Use on OMR sheet</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedAdmitSlip(reg)}
                        className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5 text-zinc-900" />
                        <span>Admit Slip</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("results")}
                        className="py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Results</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Exam Hall Venue Info */}
                <div className="flex items-center gap-2.5 text-xs text-zinc-300 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-white">Assigned Examination Center:</strong>{" "}
                    {reg.testSeries.testCenterVenue || "Main Campus Examination Center, Hall A & B"}
                  </span>
                </div>

                {/* Tests Schedule List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span>
                        Offline Tests Schedule &amp; Question Papers ({reg.testSeries.exams.length} Tests)
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reg.testSeries.exams.map((exam) => {
                      const hasResult = exam.results && exam.results.length > 0;
                      const result = hasResult ? exam.results![0] : null;

                      return (
                        <div
                          key={exam.id}
                          className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/40 transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-indigo-400">
                                Test #{exam.testNumber} • {exam.code}
                              </span>
                              <h4 className="font-bold text-white text-xs leading-snug mt-0.5">
                                {exam.title}
                              </h4>
                            </div>

                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                hasResult
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                              }`}
                            >
                              {hasResult ? "Scorecard Ready" : "Scheduled"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                            <div>
                              <span className="text-[9px] text-zinc-500 block">Exam Date:</span>
                              <span className="text-white font-semibold">
                                {new Date(exam.examDate).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 block">Duration &amp; Marks:</span>
                              <span className="text-white font-semibold">
                                {exam.durationMinutes} mins • {exam.maxMarks} M
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] text-zinc-400 space-y-1 pt-2 border-t border-white/5">
                            <div>
                              <span className="text-zinc-500">Seating:</span>{" "}
                              <span className="text-zinc-200 font-medium">
                                {exam.venueRoom || "Desk Allocation at Center"}
                              </span>
                            </div>
                            {exam.syllabus && (
                              <div className="truncate">
                                <span className="text-zinc-500">Syllabus:</span>{" "}
                                <span className="text-zinc-300 font-medium">{exam.syllabus}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Scorecard Preview */}
                          {hasResult && result && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                              <span className="font-semibold text-emerald-400">
                                Score: {result.marksObtained}/{result.maxMarks} ({result.percentage}%)
                              </span>
                              <span className="font-mono font-bold text-white text-[11px]">
                                Rank #{result.rank || "—"} ({result.percentile}%ile)
                              </span>
                            </div>
                          )}

                          {/* Dedicated Action Buttons for this Test */}
                          <div className="pt-2 border-t border-white/5 flex items-center gap-2 flex-wrap">
                            {exam.questionPaperUrl && (
                              <a
                                href={exam.questionPaperUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 text-[10px] font-semibold flex items-center gap-1 transition-all"
                              >
                                <FileQuestion className="w-3 h-3 text-indigo-400" />
                                <span>Question Paper</span>
                              </a>
                            )}

                            {exam.answerKeyUrl && (
                              <a
                                href={exam.answerKeyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[10px] font-semibold flex items-center gap-1 transition-all"
                              >
                                <KeyRound className="w-3 h-3 text-purple-400" />
                                <span>Answer Key</span>
                              </a>
                            )}

                            {hasResult && (
                              <button
                                onClick={() => setActiveTab("results")}
                                className="py-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 transition-all ml-auto"
                              >
                                <Award className="w-3 h-3 text-emerald-400" />
                                <span>View Full Scorecard</span>
                              </button>
                            )}
                          </div>
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

      {/* ── TAB 2: SCORECARDS & RANKINGS ── */}
      {activeTab === "results" && (
        <div className="space-y-4">
          {allResults.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white/[0.03] border border-white/10 text-center text-xs space-y-2 shadow-xl">
              <Award className="w-10 h-10 text-zinc-500 mx-auto" />
              <p className="font-bold text-white text-sm">No published offline test results yet.</p>
              <p className="text-zinc-400 max-w-sm mx-auto">
                Scorecards, subject breakups, and nationwide ranks will appear here as soon as offline OMR papers are scanned.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allResults.map(({ exam, result, testSeriesTitle, rollNumber, targetExam }) => {
                let subjectBreakup: Record<string, number> = {};
                if (result.subjectBreakup) {
                  try {
                    subjectBreakup = JSON.parse(result.subjectBreakup);
                  } catch (e) {}
                }

                return (
                  <div
                    key={result.id}
                    className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-indigo-400">
                          {targetExam} • Roll No: {rollNumber}
                        </span>
                        <h3 className="font-bold text-white text-base leading-snug">
                          {exam.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400">{testSeriesTitle}</p>
                      </div>

                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                          result.percentage >= 60
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {result.percentage}%
                      </span>
                    </div>

                    {/* Key Score Metrics Bar */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-zinc-400 block font-medium">Marks</span>
                        <span className="text-base font-black text-white">
                          {result.marksObtained}
                          <span className="text-zinc-500 text-xs">/{result.maxMarks}</span>
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-zinc-400 block font-medium">Rank</span>
                        <span className="text-base font-black text-amber-400 font-mono">
                          #{result.rank || "—"}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-zinc-400 block font-medium">Percentile</span>
                        <span className="text-base font-black text-indigo-400 font-mono">
                          {result.percentile || "—"}%
                        </span>
                      </div>
                    </div>

                    {/* Subject-Wise Score Breakdown */}
                    {Object.keys(subjectBreakup).length > 0 && (
                      <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Subject-Wise Score Breakdown
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(subjectBreakup).map(([subj, marks]) => (
                            <div
                              key={subj}
                              className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center"
                            >
                              <span className="text-[10px] text-zinc-400 block truncate">{subj}</span>
                              <span className="font-bold text-white text-xs">{marks} M</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Faculty Remarks */}
                    {result.remarks && (
                      <div className="text-xs text-zinc-300 italic p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        &ldquo;{result.remarks}&rdquo;
                      </div>
                    )}

                    {/* Official Answer Key / Solutions Link */}
                    {exam.answerKeyUrl && (
                      <a
                        href={exam.answerKeyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-white transition-colors pt-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download Official Answer Key &amp; Solutions PDF →</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: EXPLORE NEWLY ADDED TEST SERIES ── */}
      {activeTab === "explore" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedAvailable.length === 0 ? (
              <div className="col-span-3 p-12 rounded-3xl bg-white/[0.03] border border-white/10 text-center text-zinc-400 text-xs shadow-xl">
                You are currently enrolled in all active test series programs!
              </div>
            ) : (
              displayedAvailable.map((series) => (
                <div
                  key={series.id}
                  className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 shadow-xl hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {series.targetExam}
                      </span>
                      <span className="text-xs font-mono font-semibold text-zinc-400">
                        {series.code}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white leading-snug">{series.title}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {series.description || "Comprehensive offline OMR test series with detailed performance reports."}
                    </p>

                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">One-Time Fee:</span>
                        <span className="font-black text-emerald-400 text-sm">
                          ₹{series.fee.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Total Mock Tests:</span>
                        <span className="font-bold text-white">{series.totalTests} Offline Tests</span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 text-[11px] text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{series.testCenterVenue || "Main Campus Hall"}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelfEnroll(series.id)}
                    disabled={isPending}
                    className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isPending ? "Registering Candidate..." : `Enroll & Register for ₹${series.fee}`}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Admit Card & Roll Number Slip Modal ── */}
      {selectedAdmitSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0e1424] text-white border border-white/10 rounded-3xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  OFFICIAL ADMISSION &amp; ROLL NUMBER SLIP
                </span>
                <h3 className="text-base font-extrabold text-white">Offline Test Series Verification</h3>
              </div>
              <button
                onClick={() => setSelectedAdmitSlip(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-1">
              <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider block">
                EXAM HALL ROLL NUMBER
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-widest font-mono">
                {selectedAdmitSlip.rollNumber}
              </div>
              <span className="text-[10px] text-zinc-400 block">
                Quote this Roll No on offline OMR Answer Sheets
              </span>
            </div>

            <div className="space-y-2.5 text-xs border-y border-white/10 py-3.5">
              <div className="flex justify-between">
                <span className="text-zinc-400">Candidate Name:</span>
                <span className="font-bold text-white">{student?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Student ID:</span>
                <span className="font-mono text-zinc-200">{student?.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Test Series:</span>
                <span className="font-bold text-white text-right max-w-[200px] truncate">
                  {selectedAdmitSlip.testSeries?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Receipt Number:</span>
                <span className="font-mono font-bold text-indigo-300">{selectedAdmitSlip.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Fee Status:</span>
                <span className="font-bold text-emerald-400">
                  ₹{selectedAdmitSlip.feeAmount?.toLocaleString("en-IN")} ({selectedAdmitSlip.paymentStatus === "PAID" ? "PAID VIA " + selectedAdmitSlip.paymentMethod : selectedAdmitSlip.paymentStatus})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Exam Hall Venue:</span>
                <span className="font-medium text-white text-right max-w-[200px]">
                  {selectedAdmitSlip.testSeries?.testCenterVenue || "Main Campus Hall"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Slip</span>
              </button>
              <button
                onClick={() => setSelectedAdmitSlip(null)}
                className="py-2.5 px-4 text-xs font-semibold rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
