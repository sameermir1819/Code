"use client";

import React, { useState, useTransition } from "react";
import {
  createTestSeries,
  createTestSeriesExam,
  registerStudentForTestSeries,
  submitTestResults,
} from "@/server/actions/test-series";
import {
  Layers,
  Users,
  Award,
  Calendar,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  Printer,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileCheck2,
  AlertCircle,
  X,
  QrCode,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EnrolledStudent {
  id: string;
  name: string;
  studentId: string;
  admissionNo: string;
  gradeClass?: string | null;
  phone?: string | null;
}

interface TestSeriesExamItem {
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
  results?: any[];
}

interface TestSeriesItem {
  id: string;
  title: string;
  code: string;
  description?: string | null;
  targetExam: string;
  fee: number;
  totalTests: number;
  startDate: string | Date;
  endDate: string | Date;
  testCenterVenue?: string | null;
  status: string;
  exams: TestSeriesExamItem[];
  registrations: any[];
}

interface Props {
  seriesList: TestSeriesItem[];
  stats: {
    totalPrograms: number;
    totalRegistrations: number;
    totalRevenueCollected: number;
    totalExamsScheduled: number;
  };
  enrolledStudents: EnrolledStudent[];
}

export function TestSeriesClient({ seriesList, stats, enrolledStudents }: Props) {
  const [activeTab, setActiveTab] = useState<"programs" | "registrations" | "schedule" | "results">("programs");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(seriesList[0]?.id || "");
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [showCreateSeriesModal, setShowCreateSeriesModal] = useState(false);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [admitSlipModalData, setAdmitSlipModalData] = useState<any | null>(null);

  // Marks entry state for Tab 4
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [marksEntries, setMarksEntries] = useState<
    Record<string, { marks: number; attendance: "PRESENT" | "ABSENT"; remarks: string }>
  >({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [actionErrorMsg, setActionErrorMsg] = useState("");

  // Create Series Form
  const [newSeriesData, setNewSeriesData] = useState({
    title: "",
    code: "",
    description: "",
    targetExam: "NEET",
    fee: 2500,
    totalTests: 8,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
    testCenterVenue: "Main Campus Exam Center, Hall A & B",
  });

  // Schedule Exam Form
  const [newExamData, setNewExamData] = useState({
    testSeriesId: seriesList[0]?.id || "",
    testNumber: 1,
    title: "",
    code: "",
    examDate: new Date().toISOString().split("T")[0],
    durationMinutes: 180,
    maxMarks: 720,
    passingMarks: 250,
    syllabus: "",
    venueRoom: "Hall A, Bench 1-40 (OMR Paper)",
    paperType: "OMR Pen-Paper Offline",
    answerKeyUrl: "",
  });

  // Register Candidate Form
  const [regData, setRegData] = useState({
    testSeriesId: seriesList[0]?.id || "",
    candidateType: "enrolled" as "enrolled" | "external",
    studentId: enrolledStudents[0]?.id || "",
    externalStudentName: "",
    externalStudentPhone: "",
    externalStudentEmail: "",
    feeAmount: seriesList[0]?.fee || 2500,
    paymentMethod: "UPI",
    paymentStatus: "PAID",
    remarks: "Offline test series registration",
  });

  const selectedSeries = seriesList.find((s) => s.id === selectedSeriesId) || seriesList[0];

  // All registrations flattened for Tab 2
  const allRegistrations = seriesList.flatMap((s) =>
    s.registrations.map((r) => ({ ...r, testSeriesTitle: s.title, testSeriesCode: s.code }))
  );

  // All exams flattened for Tab 3
  const allExams = seriesList.flatMap((s) =>
    s.exams.map((e) => ({ ...e, testSeriesTitle: s.title, testSeriesCode: s.code, testSeriesId: s.id }))
  );

  // Filter registrations by search
  const filteredRegistrations = allRegistrations.filter((r) => {
    const name = r.student?.name || r.externalStudentName || "";
    const roll = r.rollNumber || "";
    const receipt = r.receiptNo || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roll.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle Create Test Series
  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMsg("");
    setActionSuccessMsg("");

    startTransition(async () => {
      const res = await createTestSeries(newSeriesData);
      if (res.success) {
        setShowCreateSeriesModal(false);
        setActionSuccessMsg(`Test Series "${newSeriesData.title}" created successfully!`);
      } else {
        setActionErrorMsg(res.error || "Failed to create test series.");
      }
    });
  };

  // Handle Add Offline Test Exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMsg("");
    setActionSuccessMsg("");

    startTransition(async () => {
      const res = await createTestSeriesExam(newExamData);
      if (res.success) {
        setShowAddExamModal(false);
        setActionSuccessMsg(`Offline test "${newExamData.title}" scheduled successfully!`);
      } else {
        setActionErrorMsg(res.error || "Failed to schedule test.");
      }
    });
  };

  // Handle Register Candidate
  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMsg("");
    setActionSuccessMsg("");

    startTransition(async () => {
      const res = await registerStudentForTestSeries({
        testSeriesId: regData.testSeriesId,
        studentId: regData.candidateType === "enrolled" ? regData.studentId : null,
        externalStudentName: regData.candidateType === "external" ? regData.externalStudentName : null,
        externalStudentPhone: regData.candidateType === "external" ? regData.externalStudentPhone : null,
        externalStudentEmail: regData.candidateType === "external" ? regData.externalStudentEmail : null,
        feeAmount: Number(regData.feeAmount),
        paymentMethod: regData.paymentMethod,
        paymentStatus: regData.paymentStatus,
        remarks: regData.remarks,
      });

      if (res.success && res.registration) {
        setShowRegisterModal(false);
        setAdmitSlipModalData(res.registration);
        setActionSuccessMsg(
          `Registered successfully! Roll No: ${res.registration.rollNumber}, Receipt No: ${res.registration.receiptNo}`
        );
      } else {
        setActionErrorMsg(res.error || "Failed to register candidate.");
      }
    });
  };

  // Switch to marks entry for a selected exam
  const handleOpenMarksEntry = (exam: any) => {
    setSelectedSeriesId(exam.testSeriesId);
    setSelectedExamId(exam.id);
    setActiveTab("results");

    // Initialize marks entries from existing results or blank
    const entries: Record<string, { marks: number; attendance: "PRESENT" | "ABSENT"; remarks: string }> = {};
    const series = seriesList.find((s) => s.id === exam.testSeriesId);
    if (series) {
      series.registrations.forEach((reg) => {
        const existingResult = exam.results?.find((r: any) => r.registrationId === reg.id);
        entries[reg.id] = {
          marks: existingResult ? existingResult.marksObtained : 0,
          attendance: existingResult ? existingResult.attendance : "PRESENT",
          remarks: existingResult?.remarks || "",
        };
      });
    }
    setMarksEntries(entries);
  };

  // Submit Bulk Marks for Offline Test
  const handleSubmitMarks = async () => {
    if (!selectedExamId) return;
    const exam = allExams.find((e) => e.id === selectedExamId);
    if (!exam) return;

    setActionErrorMsg("");
    setActionSuccessMsg("");

    const payload = Object.entries(marksEntries).map(([registrationId, data]) => ({
      registrationId,
      marksObtained: Number(data.marks),
      maxMarks: exam.maxMarks,
      attendance: data.attendance,
      remarks: data.remarks,
    }));

    startTransition(async () => {
      const res = await submitTestResults(selectedExamId, payload);
      if (res.success) {
        setActionSuccessMsg(`Results successfully calculated and published for ${res.count} students!`);
      } else {
        setActionErrorMsg(res.error || "Failed to submit marks.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header & Quick Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Offline Test Series Management
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  OMR &amp; Pen-Paper
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Create offline mock series, register candidates, collect one-time fees, and publish diagnostic rankings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setShowRegisterModal(true)}
            className="h-10 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Register Candidate &amp; Collect Fee</span>
          </Button>

          <Button
            onClick={() => setShowCreateSeriesModal(true)}
            className="h-10 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Test Series</span>
          </Button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg("")} className="ml-auto text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionErrorMsg}</span>
          <button onClick={() => setActionErrorMsg("")} className="ml-auto text-rose-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── High-Level KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Test Programs</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalPrograms}</div>
          <span className="text-[11px] text-zinc-400">NEET, JEE &amp; Board Series</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Enrolled</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalRegistrations}</div>
          <span className="text-[11px] text-zinc-400">Regular &amp; Guest Candidates</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>One-Time Fee Revenue</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ₹{stats.totalRevenueCollected.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-zinc-400">Directly collected from series</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Offline Tests</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalExamsScheduled}</div>
          <span className="text-[11px] text-zinc-400">Scheduled OMR Tests</span>
        </div>
      </div>

      {/* ── Main Tab Navigation (Modern Segmented Pills) ── */}
      <div className="flex bg-white/[0.03] p-1 rounded-2xl border border-white/[0.08] gap-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("programs")}
          className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "programs"
              ? "bg-white text-zinc-950 font-semibold shadow-md shadow-white/5"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Programs ({seriesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("registrations")}
          className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "registrations"
              ? "bg-white text-zinc-950 font-semibold shadow-md shadow-white/5"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Registrations &amp; Fee ({allRegistrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "schedule"
              ? "bg-white text-zinc-950 font-semibold shadow-md shadow-white/5"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Offline Tests ({allExams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("results")}
          className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "results"
              ? "bg-white text-zinc-950 font-semibold shadow-md shadow-white/5"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Results Entry</span>
        </button>
      </div>

      {/* ── TAB 1: Programs ── */}
      {activeTab === "programs" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seriesList.map((series) => (
              <div
                key={series.id}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                      {series.targetExam}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-400">{series.code}</span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-tight">{series.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{series.description}</p>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-xs text-zinc-300">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">One-Time Fee:</span>
                      <span className="font-bold text-emerald-400">₹{series.fee.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Total Tests:</span>
                      <span className="font-semibold text-white">{series.totalTests} Tests</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Registered:</span>
                      <span className="font-semibold text-indigo-300">{series.registrations.length} Candidates</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{series.testCenterVenue}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <Button
                    onClick={() => {
                      setNewExamData((prev) => ({ ...prev, testSeriesId: series.id }));
                      setShowAddExamModal(true);
                    }}
                    variant="outline"
                    className="flex-1 h-9 text-xs font-bold rounded-xl border-white/10 hover:bg-white/10 text-white gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Test</span>
                  </Button>

                  <Button
                    onClick={() => {
                      setRegData((prev) => ({ ...prev, testSeriesId: series.id, feeAmount: series.fee }));
                      setShowRegisterModal(true);
                    }}
                    className="flex-1 h-9 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white gap-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: Registrations & One-Time Fee ── */}
      {activeTab === "registrations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by student name, roll number, or receipt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl bg-white/[0.03] border-white/10 text-white"
              />
            </div>

            <Button
              onClick={() => setShowRegisterModal(true)}
              className="h-10 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll New Candidate</span>
            </Button>
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.04] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Candidate / Student</th>
                  <th className="py-3 px-4">Test Series</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">One-Time Fee</th>
                  <th className="py-3 px-4">Payment Info</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No candidate registrations found.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">
                          {reg.student ? reg.student.name : reg.externalStudentName}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {reg.student ? (
                            <span className="text-indigo-400">Enrolled ({reg.student.studentId})</span>
                          ) : (
                            <span className="text-amber-400">External ({reg.externalStudentPhone || "Guest"})</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block truncate max-w-[200px]">
                          {reg.testSeriesTitle}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">{reg.testSeriesCode}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                        {reg.rollNumber}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">
                          ₹{reg.feeAmount.toLocaleString("en-IN")}
                        </span>
                        <span
                          className={`inline-block text-[10px] px-2 py-0.2 rounded font-semibold ${
                            reg.paymentStatus === "PAID"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {reg.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px]">
                        <span className="block font-semibold text-zinc-200">
                          {reg.paymentMethod} • {reg.receiptNo}
                        </span>
                        <span className="text-zinc-500">
                          {reg.paidAt ? new Date(reg.paidAt).toLocaleDateString() : "Pending"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          onClick={() => setAdmitSlipModalData(reg)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[11px] font-bold rounded-lg border-white/10 hover:bg-white/10 text-white gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Admit Slip &amp; Receipt</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Offline Schedule & Tests ── */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Scheduled Offline Pen-Paper Tests</h2>
            <Button
              onClick={() => setShowAddExamModal(true)}
              className="h-9 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Test</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allExams.map((exam) => (
              <div
                key={exam.id}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                      Test #{exam.testNumber} • {exam.code}
                    </span>
                    <h3 className="text-sm font-black text-white mt-1">{exam.title}</h3>
                    <span className="text-xs text-indigo-400 font-semibold">{exam.testSeriesTitle}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      exam.status === "RESULTS_PUBLISHED"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {exam.status === "RESULTS_PUBLISHED" ? "Results Out" : "Scheduled"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-zinc-500 block">Exam Date &amp; Time</span>
                    <span className="font-semibold text-white">
                      {new Date(exam.examDate).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-zinc-500 block">Duration &amp; Max Marks</span>
                    <span className="font-semibold text-white">
                      {exam.durationMinutes} mins • {exam.maxMarks} Marks
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Venue: {exam.venueRoom}</span>
                  </div>
                  {exam.syllabus && (
                    <div className="text-[11px] text-zinc-400 pl-5">
                      <strong>Syllabus:</strong> {exam.syllabus}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">{exam.paperType}</span>
                  <Button
                    onClick={() => handleOpenMarksEntry(exam)}
                    className="h-8 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white gap-1"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{exam.status === "RESULTS_PUBLISHED" ? "Edit Results" : "Enter Offline Marks"}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: Offline Results & Ranking Entry ── */}
      {activeTab === "results" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Offline OMR Marks &amp; Ranking Engine</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Enter offline marks obtained by candidates. The system automatically computes ranks, percentages, and national percentile.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedExamId}
                onChange={(e) => {
                  const exam = allExams.find((ex) => ex.id === e.target.value);
                  if (exam) handleOpenMarksEntry(exam);
                }}
                className="h-10 text-xs px-3 rounded-xl bg-white/10 border border-white/15 text-white focus:outline-none"
              >
                <option value="" disabled className="bg-zinc-900 text-white">
                  -- Select Offline Test to Enter Marks --
                </option>
                {allExams.map((ex) => (
                  <option key={ex.id} value={ex.id} className="bg-zinc-900 text-white">
                    {ex.testSeriesCode}: {ex.title} ({ex.maxMarks} Marks)
                  </option>
                ))}
              </select>

              {selectedExamId && (
                <Button
                  onClick={handleSubmitMarks}
                  disabled={isPending}
                  className="h-10 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>{isPending ? "Calculating & Publishing..." : "Publish Results"}</span>
                </Button>
              )}
            </div>
          </div>

          {!selectedExamId ? (
            <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/[0.02] text-zinc-400 text-xs space-y-2">
              <Award className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-semibold text-white">Select an offline test above to start entering marks</p>
              <p className="text-zinc-500">You can record attendance, score out of max marks, and faculty remarks.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/[0.04] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Faculty Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {selectedSeries?.registrations.map((reg) => {
                    const currentEntry = marksEntries[reg.id] || {
                      marks: 0,
                      attendance: "PRESENT",
                      remarks: "",
                    };
                    const exam = allExams.find((e) => e.id === selectedExamId);
                    const maxMarks = exam?.maxMarks || 720;
                    const pct = maxMarks > 0 ? ((currentEntry.marks / maxMarks) * 100).toFixed(1) : "0";

                    return (
                      <tr key={reg.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                          {reg.rollNumber}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">
                            {reg.student ? reg.student.name : reg.externalStudentName}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {reg.student ? "Enrolled Student" : "External Candidate"}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={currentEntry.attendance}
                            onChange={(e) =>
                              setMarksEntries((prev) => ({
                                ...prev,
                                [reg.id]: {
                                  ...currentEntry,
                                  attendance: e.target.value as "PRESENT" | "ABSENT",
                                },
                              }))
                            }
                            className={`px-2 py-1 rounded-lg text-xs font-semibold focus:outline-none ${
                              currentEntry.attendance === "PRESENT"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            <option value="PRESENT" className="bg-zinc-900 text-white">
                              PRESENT
                            </option>
                            <option value="ABSENT" className="bg-zinc-900 text-white">
                              ABSENT
                            </option>
                          </select>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              disabled={currentEntry.attendance === "ABSENT"}
                              value={currentEntry.marks}
                              onChange={(e) =>
                                setMarksEntries((prev) => ({
                                  ...prev,
                                  [reg.id]: {
                                    ...currentEntry,
                                    marks: Number(e.target.value),
                                  },
                                }))
                              }
                              className="w-24 h-9 text-xs rounded-xl bg-white/[0.05] border-white/15 text-white"
                            />
                            <span className="text-zinc-500">/ {maxMarks}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold text-white">
                          {currentEntry.attendance === "PRESENT" ? `${pct}%` : "—"}
                        </td>

                        <td className="py-3 px-4">
                          <Input
                            placeholder="Optional feedback..."
                            value={currentEntry.remarks}
                            onChange={(e) =>
                              setMarksEntries((prev) => ({
                                ...prev,
                                [reg.id]: {
                                  ...currentEntry,
                                  remarks: e.target.value,
                                },
                              }))
                            }
                            className="h-9 text-xs rounded-xl bg-white/[0.05] border-white/15 text-white max-w-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: Create Test Series ── */}
      {showCreateSeriesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b121e] border border-white/15 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Create New Offline Test Series</span>
              </h2>
              <button
                onClick={() => setShowCreateSeriesModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSeries} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Series Title</label>
                <Input
                  required
                  placeholder="e.g. NEET 2026 All India Major Mock Series"
                  value={newSeriesData.title}
                  onChange={(e) => setNewSeriesData({ ...newSeriesData, title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Program Code</label>
                  <Input
                    required
                    placeholder="e.g. TS-2026-NEET"
                    value={newSeriesData.code}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, code: e.target.value })}
                    className="bg-white/5 border-white/10 text-white uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Target Exam</label>
                  <select
                    value={newSeriesData.targetExam}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, targetExam: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  >
                    <option value="NEET" className="bg-zinc-900">NEET (UG)</option>
                    <option value="JEE_MAIN" className="bg-zinc-900">JEE Main</option>
                    <option value="JEE_ADVANCED" className="bg-zinc-900">JEE Advanced</option>
                    <option value="FOUNDATION" className="bg-zinc-900">Foundation (Class 9-10)</option>
                    <option value="BOARDS" className="bg-zinc-900">Board Exam Booster</option>
                    <option value="UPSC" className="bg-zinc-900">UPSC / Civil Services</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">One-Time Fee (₹)</label>
                  <Input
                    type="number"
                    required
                    value={newSeriesData.fee}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, fee: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Total Mock Tests</label>
                  <Input
                    type="number"
                    required
                    value={newSeriesData.totalTests}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, totalTests: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Start Date</label>
                  <Input
                    type="date"
                    required
                    value={newSeriesData.startDate}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, startDate: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">End Date</label>
                  <Input
                    type="date"
                    required
                    value={newSeriesData.endDate}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, endDate: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Offline Test Center Venue</label>
                <Input
                  value={newSeriesData.testCenterVenue}
                  onChange={(e) => setNewSeriesData({ ...newSeriesData, testCenterVenue: e.target.value })}
                  placeholder="e.g. Main Campus Exam Center, Hall A & B"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Description / Syllabus Overview</label>
                <textarea
                  rows={2}
                  value={newSeriesData.description}
                  onChange={(e) => setNewSeriesData({ ...newSeriesData, description: e.target.value })}
                  placeholder="Key highlights, test pattern, OMR marking rules..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateSeriesModal(false)}
                  className="h-10 text-xs border-white/10 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {isPending ? "Creating..." : "Save Test Series"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Schedule Offline Test ── */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b121e] border border-white/15 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Schedule Offline Mock Test</span>
              </h2>
              <button onClick={() => setShowAddExamModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Assign to Test Series</label>
                <select
                  value={newExamData.testSeriesId}
                  onChange={(e) => setNewExamData({ ...newExamData, testSeriesId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                >
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">
                      {s.title} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Test Title</label>
                <Input
                  required
                  placeholder="e.g. Major Test 02 - Full Class 12 Syllabus"
                  value={newExamData.title}
                  onChange={(e) => setNewExamData({ ...newExamData, title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Test Code</label>
                  <Input
                    required
                    placeholder="e.g. TS-MOCK-02"
                    value={newExamData.code}
                    onChange={(e) => setNewExamData({ ...newExamData, code: e.target.value })}
                    className="bg-white/5 border-white/10 text-white uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Test # Sequence</label>
                  <Input
                    type="number"
                    required
                    value={newExamData.testNumber}
                    onChange={(e) => setNewExamData({ ...newExamData, testNumber: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Date &amp; Time</label>
                  <Input
                    type="datetime-local"
                    required
                    value={newExamData.examDate}
                    onChange={(e) => setNewExamData({ ...newExamData, examDate: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Duration (mins)</label>
                  <Input
                    type="number"
                    value={newExamData.durationMinutes}
                    onChange={(e) => setNewExamData({ ...newExamData, durationMinutes: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Max Marks</label>
                  <Input
                    type="number"
                    value={newExamData.maxMarks}
                    onChange={(e) => setNewExamData({ ...newExamData, maxMarks: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Hall Room &amp; Seating</label>
                <Input
                  value={newExamData.venueRoom}
                  onChange={(e) => setNewExamData({ ...newExamData, venueRoom: e.target.value })}
                  placeholder="e.g. Hall A, Row 1-20 (OMR Sheet Based)"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Syllabus Breakdown</label>
                <textarea
                  rows={2}
                  value={newExamData.syllabus}
                  onChange={(e) => setNewExamData({ ...newExamData, syllabus: e.target.value })}
                  placeholder="Chapters and topics included in this test..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddExamModal(false)}
                  className="h-10 text-xs border-white/10 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {isPending ? "Scheduling..." : "Schedule Test"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Register Candidate & Collect One-Time Fee ── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b121e] border border-white/15 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Register Candidate &amp; Collect One-Time Fee</span>
              </h2>
              <button onClick={() => setShowRegisterModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterCandidate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Select Test Series</label>
                <select
                  value={regData.testSeriesId}
                  onChange={(e) => {
                    const sel = seriesList.find((s) => s.id === e.target.value);
                    setRegData({
                      ...regData,
                      testSeriesId: e.target.value,
                      feeAmount: sel ? sel.fee : regData.feeAmount,
                    });
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                >
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">
                      {s.title} (Fee: ₹{s.fee.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 block">Candidate Type</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="candidateType"
                      checked={regData.candidateType === "enrolled"}
                      onChange={() => setRegData({ ...regData, candidateType: "enrolled" })}
                      className="text-emerald-500"
                    />
                    <span>Enrolled Institute Student</span>
                  </label>
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="candidateType"
                      checked={regData.candidateType === "external"}
                      onChange={() => setRegData({ ...regData, candidateType: "external" })}
                      className="text-emerald-500"
                    />
                    <span>External / Guest Candidate</span>
                  </label>
                </div>
              </div>

              {regData.candidateType === "enrolled" ? (
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Select Enrolled Student</label>
                  <select
                    value={regData.studentId}
                    onChange={(e) => setRegData({ ...regData, studentId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  >
                    {enrolledStudents.map((stu) => (
                      <option key={stu.id} value={stu.id} className="bg-zinc-900">
                        {stu.name} ({stu.studentId} • {stu.gradeClass || "Active"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-300">Full Name</label>
                    <Input
                      required
                      placeholder="e.g. Rohan V. Kulkarni"
                      value={regData.externalStudentName}
                      onChange={(e) => setRegData({ ...regData, externalStudentName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-zinc-300">Phone</label>
                      <Input
                        required
                        placeholder="+91 98765 43210"
                        value={regData.externalStudentPhone}
                        onChange={(e) => setRegData({ ...regData, externalStudentPhone: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-zinc-300">Email (Optional)</label>
                      <Input
                        placeholder="candidate@gmail.com"
                        value={regData.externalStudentEmail}
                        onChange={(e) => setRegData({ ...regData, externalStudentEmail: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">One-Time Fee (₹)</label>
                  <Input
                    type="number"
                    required
                    value={regData.feeAmount}
                    onChange={(e) => setRegData({ ...regData, feeAmount: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Payment Mode</label>
                  <select
                    value={regData.paymentMethod}
                    onChange={(e) => setRegData({ ...regData, paymentMethod: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  >
                    <option value="UPI" className="bg-zinc-900">UPI / QR</option>
                    <option value="CASH" className="bg-zinc-900">Cash</option>
                    <option value="CARD" className="bg-zinc-900">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER" className="bg-zinc-900">Net Banking</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Fee Status</label>
                  <select
                    value={regData.paymentStatus}
                    onChange={(e) => setRegData({ ...regData, paymentStatus: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  >
                    <option value="PAID" className="bg-zinc-900">PAID</option>
                    <option value="PENDING" className="bg-zinc-900">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
                A permanent Roll Number and official Fee Receipt number will be automatically generated upon submission.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRegisterModal(false)}
                  className="h-10 text-xs border-white/10 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                >
                  {isPending ? "Generating..." : "Register & Issue Admit Slip"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Admit Card & Receipt Slip Preview ── */}
      {admitSlipModalData && (
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
                onClick={() => setAdmitSlipModalData(null)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">EXAM HALL ROLL NUMBER</span>
              <div className="text-2xl font-black text-indigo-700 tracking-wider">
                {admitSlipModalData.rollNumber}
              </div>
              <span className="text-[10px] text-zinc-400">Quote this Roll No on offline OMR Answer Sheets</span>
            </div>

            <div className="space-y-2 text-xs border-y py-3">
              <div className="flex justify-between">
                <span className="text-zinc-500">Candidate Name:</span>
                <span className="font-bold text-zinc-900">
                  {admitSlipModalData.student?.name || admitSlipModalData.externalStudentName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Test Series:</span>
                <span className="font-bold text-zinc-900 text-right max-w-[200px] truncate">
                  {admitSlipModalData.testSeriesTitle || admitSlipModalData.testSeries?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Receipt Number:</span>
                <span className="font-mono font-bold text-zinc-800">{admitSlipModalData.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">One-Time Fee Paid:</span>
                <span className="font-bold text-emerald-600">
                  ₹{admitSlipModalData.feeAmount?.toLocaleString("en-IN")} ({admitSlipModalData.paymentMethod})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Issued On:</span>
                <span className="text-zinc-700">
                  {admitSlipModalData.paidAt
                    ? new Date(admitSlipModalData.paidAt).toLocaleDateString()
                    : new Date().toLocaleDateString()}
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
                onClick={() => setAdmitSlipModalData(null)}
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

