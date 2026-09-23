"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createTestSeries,
  createTestSeriesExam,
  deleteTestSeries,
  registerStudentForTestSeries,
  submitTestResults,
  updateTestSeries,
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
  ClipboardList,
  GraduationCap,
  Building,
  Check,
  Eye,
  ExternalLink,
  ArrowLeft,
  Filter,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const toDateInputValue = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().split("T")[0];
  }
  return date.toISOString().split("T")[0];
};

const getDefaultSeriesData = () => ({
  title: "",
  code: "",
  description: "",
  targetExam: "NEET",
  fee: 2500,
  totalTests: 8,
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
  testCenterVenue: "Main Campus Exam Center, Hall A & B",
  status: "ACTIVE",
});

export function TestSeriesClient({ seriesList, stats, enrolledStudents }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"programs" | "registrations" | "schedule" | "results">("programs");
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("ALL");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(seriesList[0]?.id || "");
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [showCreateSeriesModal, setShowCreateSeriesModal] = useState(false);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [admitSlipModalData, setAdmitSlipModalData] = useState<any | null>(null);
  const [editingSeries, setEditingSeries] = useState<TestSeriesItem | null>(null);
  const [seriesToDelete, setSeriesToDelete] = useState<TestSeriesItem | null>(null);

  // Dedicated View Enrolled Students Modal ("Bache dekhne ke liye")
  const [viewStudentsModalSeries, setViewStudentsModalSeries] = useState<TestSeriesItem | null>(null);
  const [seriesStudentSearch, setSeriesStudentSearch] = useState("");

  // Marks entry state for Tab 4
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [marksEntries, setMarksEntries] = useState<
    Record<string, { marks: number; attendance: "PRESENT" | "ABSENT"; remarks: string }>
  >({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [actionErrorMsg, setActionErrorMsg] = useState("");

  // Create Series Form
  const [newSeriesData, setNewSeriesData] = useState(getDefaultSeriesData);

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

  // Flattened registrations
  const allRegistrations = seriesList.flatMap((s) =>
    s.registrations.map((r) => ({ ...r, testSeriesId: s.id, testSeriesTitle: s.title, testSeriesCode: s.code }))
  );

  // Flattened exams
  const allExams = seriesList.flatMap((s) =>
    s.exams.map((e) => ({ ...e, testSeriesTitle: s.title, testSeriesCode: s.code, testSeriesId: s.id }))
  );

  // Active exam for results entry
  const activeExam = allExams.find((e) => e.id === selectedExamId);
  const activeExamSeries = seriesList.find((s) => s.id === activeExam?.testSeriesId) || seriesList[0];

  // Filter registrations by search and program
  const filteredRegistrations = allRegistrations.filter((r) => {
    const matchesProgram = programFilter === "ALL" || r.testSeriesId === programFilter;
    const name = r.student?.name || r.externalStudentName || "";
    const roll = r.rollNumber || "";
    const receipt = r.receiptNo || "";
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      name.toLowerCase().includes(query) ||
      roll.toLowerCase().includes(query) ||
      receipt.toLowerCase().includes(query);
    return matchesProgram && matchesSearch;
  });

  const openCreateSeriesModal = () => {
    setEditingSeries(null);
    setNewSeriesData(getDefaultSeriesData());
    setActionErrorMsg("");
    setShowCreateSeriesModal(true);
  };

  const closeSeriesModal = () => {
    setShowCreateSeriesModal(false);
    setEditingSeries(null);
  };

  const handleOpenEditSeries = (series: TestSeriesItem) => {
    setEditingSeries(series);
    setNewSeriesData({
      title: series.title,
      code: series.code,
      description: series.description || "",
      targetExam: series.targetExam || "NEET",
      fee: Number(series.fee) || 0,
      totalTests: Number(series.totalTests) || 1,
      startDate: toDateInputValue(series.startDate),
      endDate: toDateInputValue(series.endDate),
      testCenterVenue: series.testCenterVenue || "",
      status: series.status || "ACTIVE",
    });
    setActionErrorMsg("");
    setShowCreateSeriesModal(true);
  };

  // Handle Create Test Series
  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMsg("");
    setActionSuccessMsg("");

    startTransition(async () => {
      const res = editingSeries
        ? await updateTestSeries(editingSeries.id, newSeriesData)
        : await createTestSeries(newSeriesData);
      if (res.success) {
        setShowCreateSeriesModal(false);
        setEditingSeries(null);
        setActionSuccessMsg(
          `Test Series "${newSeriesData.title}" ${editingSeries ? "updated" : "created"} successfully!`
        );
        router.refresh();
      } else {
        setActionErrorMsg(res.error || "Failed to create test series.");
      }
    });
  };

  const handleDeleteSeries = async () => {
    if (!seriesToDelete) return;

    const deletedSeries = seriesToDelete;
    setActionErrorMsg("");
    setActionSuccessMsg("");

    startTransition(async () => {
      const res = await deleteTestSeries(deletedSeries.id);
      if (res.success) {
        setSeriesToDelete(null);
        if (selectedSeriesId === deletedSeries.id) {
          setSelectedSeriesId(seriesList.find((s) => s.id !== deletedSeries.id)?.id || "");
        }
        setActionSuccessMsg(`Test Series "${deletedSeries.title}" deleted successfully.`);
        router.refresh();
      } else {
        setActionErrorMsg(res.error || "Failed to delete test series.");
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
        router.refresh();
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
        setActionSuccessMsg(
          `Registered successfully! Hall Roll No: ${res.registration.rollNumber}, Receipt No: ${res.registration.receiptNo}`
        );
        const series = seriesList.find((s) => s.id === regData.testSeriesId);
        setAdmitSlipModalData({
          ...res.registration,
          testSeriesTitle: series?.title,
          testSeriesVenue: series?.testCenterVenue,
        });
        router.refresh();
      } else {
        setActionErrorMsg(res.error || "Failed to register candidate.");
      }
    });
  };

  // Open Marks Entry for an exam
  const handleOpenMarksEntry = (exam: TestSeriesExamItem) => {
    setSelectedExamId(exam.id);
    setActiveTab("results");

    const series = seriesList.find((s) => s.id === (exam as any).testSeriesId) || seriesList[0];
    const initialMap: Record<string, { marks: number; attendance: "PRESENT" | "ABSENT"; remarks: string }> = {};

    series?.registrations.forEach((reg) => {
      const existingResult = exam.results?.find((r) => r.registrationId === reg.id);
      if (existingResult) {
        initialMap[reg.id] = {
          marks: existingResult.marksObtained,
          attendance: existingResult.attendance || "PRESENT",
          remarks: existingResult.remarks || "",
        };
      } else {
        initialMap[reg.id] = {
          marks: 0,
          attendance: "PRESENT",
          remarks: "",
        };
      }
    });

    setMarksEntries(initialMap);
  };

  // Submit Marks
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
        router.refresh();
      } else {
        setActionErrorMsg(res.error || "Failed to submit marks.");
      }
    });
  };

  // Open dedicated students list for a series
  const handleOpenSeriesStudents = (series: TestSeriesItem) => {
    setViewStudentsModalSeries(series);
    setSeriesStudentSearch("");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Page Header Banner & Quick Navigation ── */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-background p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="default" className="text-[10px] uppercase font-mono tracking-wider">
              Offline Testing Suite
            </Badge>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>OMR Pen-Paper Active</span>
            </div>

            {/* Quick jump to Batches & Students */}
            <Link
              href="/batches"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border bg-card text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Building className="h-3 w-3 text-purple-500" />
              <span>Go to Batches</span>
            </Link>
            <Link
              href="/students"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border bg-card text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <GraduationCap className="h-3 w-3 text-blue-500" />
              <span>Students Directory</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Offline Test Series Hub
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage mock test series, candidate hall tickets, one-time fees, and diagnostic ranking percentiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <Button
            onClick={() => setShowRegisterModal(true)}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 gap-1.5"
          >
            <Users className="h-3.5 w-3.5" />
            <span>+ Enroll Candidate</span>
          </Button>

          <Button
            onClick={openCreateSeriesModal}
            className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all active:scale-95 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Test Series</span>
          </Button>
        </div>
      </div>

      {/* ── Status Alerts ── */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg("")} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span>{actionErrorMsg}</span>
          <button onClick={() => setActionErrorMsg("")} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── High-Level KPI Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border bg-card/60 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Test Programs
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-foreground">{stats.totalPrograms}</div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                NEET &amp; JEE
              </span>
              <span>• Active Series</span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/60 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Candidates
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-foreground">{stats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                Admit Slips Issued
              </span>
              <span>• Click to inspect</span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/60 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Fee Collections
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              ₹{stats.totalRevenueCollected.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                100% Realized
              </span>
              <span>• One-time payments</span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/60 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Scheduled Tests
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight text-foreground">{stats.totalExamsScheduled}</div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                OMR Assessments
              </span>
              <span>• Offline seating</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Clean Segmented Pill Navigation ── */}
      <div className="flex bg-muted/50 p-1.5 rounded-2xl border gap-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("programs")}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "programs"
              ? "bg-background text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Programs ({seriesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("registrations")}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "registrations"
              ? "bg-background text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Candidate Directory &amp; Fees ({allRegistrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "schedule"
              ? "bg-background text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Offline Tests ({allExams.length})</span>
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
          <span>Results Entry &amp; Ranking</span>
        </button>
      </div>

      {/* ── TAB 1: Programs ── */}
      {activeTab === "programs" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seriesList.map((series) => (
              <Card
                key={series.id}
                className="rounded-2xl border bg-card/60 transition-all duration-200 hover:border-primary/50 hover:shadow-md flex flex-col justify-between shadow-2xs"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                      {series.targetExam}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-semibold text-muted-foreground">{series.code}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditSeries(series)}
                        title="Edit test series"
                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeriesToDelete(series)}
                        title="Delete test series"
                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg border bg-background text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground leading-snug">{series.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">{series.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="p-3 rounded-xl bg-muted/40 border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">One-Time Fee:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{series.fee.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Mock Tests:</span>
                      <span className="font-semibold text-foreground">{series.totalTests} Tests</span>
                    </div>
                    
                    {/* Clickable student count button */}
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-muted-foreground">Enrolled Candidates:</span>
                      <button
                        type="button"
                        onClick={() => handleOpenSeriesStudents(series)}
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline group"
                        title="Click to view students in this test series"
                      >
                        <Users className="h-3 w-3" />
                        <span>{series.registrations.length} Students</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{series.testCenterVenue}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t">
                    <Button
                      onClick={() => handleOpenSeriesStudents(series)}
                      variant="outline"
                      className="h-8 text-[11px] font-semibold rounded-xl gap-1 hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-500" />
                      <span>Students ({series.registrations.length})</span>
                    </Button>

                    <Button
                      onClick={() => {
                        setNewExamData((prev) => ({ ...prev, testSeriesId: series.id }));
                        setShowAddExamModal(true);
                      }}
                      variant="outline"
                      className="h-8 text-[11px] font-semibold rounded-xl gap-1 hover:bg-muted"
                    >
                      <Plus className="h-3.5 w-3.5 text-purple-500" />
                      <span>+ Test</span>
                    </Button>

                    <Button
                      onClick={() => {
                        setRegData((prev) => ({ ...prev, testSeriesId: series.id, feeAmount: series.fee }));
                        setShowRegisterModal(true);
                      }}
                      className="h-8 text-[11px] font-semibold rounded-xl bg-primary text-primary-foreground gap-1 hover:bg-primary/90"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Enroll</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: Registrations & One-Time Fee ── */}
      {activeTab === "registrations" && (
        <Card className="rounded-2xl border bg-card/60 shadow-2xs">
          <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Candidate Directory &amp; Hall Slips</CardTitle>
              <CardDescription className="text-xs">
                Official roll numbers, fee vouchers, and admit slips issued for offline testing.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Program Selector Filter */}
              <div className="relative">
                <select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-lg border bg-background text-foreground"
                >
                  <option value="ALL">All Programs ({allRegistrations.length})</option>
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.title} ({s.registrations.length})
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search candidate, roll, receipt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-lg bg-background"
                />
              </div>

              <Button
                onClick={() => setShowRegisterModal(true)}
                className="h-8 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Enroll</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-medium text-[11px] border-b">
                  <tr>
                    <th className="py-3 px-4">Candidate / Student</th>
                    <th className="py-3 px-4">Test Series</th>
                    <th className="py-3 px-4">Hall Roll Number</th>
                    <th className="py-3 px-4">One-Time Fee</th>
                    <th className="py-3 px-4">Payment Info</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                        No candidate registrations match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                              {(reg.student?.name || reg.externalStudentName || "S").charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {reg.student ? reg.student.name : reg.externalStudentName}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {reg.student ? (
                                  <span className="text-primary font-medium">Enrolled ({reg.student.studentId})</span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">External ({reg.externalStudentPhone || "Guest"})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-foreground block truncate max-w-[200px]">
                            {reg.testSeriesTitle}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">{reg.testSeriesCode}</span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-primary">
                          {reg.rollNumber}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground block">
                            ₹{reg.feeAmount.toLocaleString("en-IN")}
                          </span>
                          <Badge
                            variant={reg.paymentStatus === "PAID" ? "success" : "warning"}
                            className="text-[10px] px-1.5 py-0 mt-0.5"
                          >
                            {reg.paymentStatus}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-[11px]">
                          <span className="block font-medium text-foreground">
                            {reg.paymentMethod} • {reg.receiptNo}
                          </span>
                          <span className="text-muted-foreground">
                            {reg.paidAt ? new Date(reg.paidAt).toLocaleDateString() : "Pending"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {reg.student?.id && (
                              <Link
                                href={`/students/${reg.student.id}`}
                                className="h-7 px-2 text-xs font-semibold rounded-lg border inline-flex items-center gap-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                                title="Open full student profile"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Profile</span>
                              </Link>
                            )}

                            <Button
                              onClick={() => setAdmitSlipModalData(reg)}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs font-semibold rounded-lg gap-1 hover:bg-muted"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Admit Slip</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 3: Offline Schedule & Tests ── */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Scheduled Pen-Paper Mock Tests</h2>
              <p className="text-xs text-muted-foreground">Classroom venues, test timings, and syllabus breakdown.</p>
            </div>
            <Button
              onClick={() => setShowAddExamModal(true)}
              className="h-8 text-xs font-semibold rounded-lg bg-primary text-primary-foreground gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule Test</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allExams.map((exam) => (
              <Card
                key={exam.id}
                className="rounded-2xl border bg-card/60 shadow-2xs hover:border-primary/50 transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        Test #{exam.testNumber} • {exam.code}
                      </span>
                      <h3 className="text-base font-bold text-foreground mt-1">{exam.title}</h3>
                      <span className="text-xs text-primary font-medium">{exam.testSeriesTitle}</span>
                    </div>

                    <Badge
                      variant={exam.status === "RESULTS_PUBLISHED" ? "success" : "outline"}
                      className="text-[10px]"
                    >
                      {exam.status === "RESULTS_PUBLISHED" ? "Results Out" : "Scheduled"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-muted/40 border">
                      <span className="text-[10px] text-muted-foreground block">Exam Date &amp; Time</span>
                      <span className="font-semibold text-foreground">
                        {new Date(exam.examDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/40 border">
                      <span className="text-[10px] text-muted-foreground block">Duration &amp; Marks</span>
                      <span className="font-semibold text-foreground">
                        {exam.durationMinutes} mins • {exam.maxMarks} Marks
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Venue: {exam.venueRoom}</span>
                    </div>
                    {exam.syllabus && (
                      <div className="text-[11px] text-muted-foreground pl-5">
                        <strong className="text-foreground">Syllabus:</strong> {exam.syllabus}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{exam.paperType}</span>
                    <Button
                      onClick={() => handleOpenMarksEntry(exam)}
                      className="h-8 text-xs font-semibold rounded-lg bg-primary text-primary-foreground gap-1"
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>{exam.status === "RESULTS_PUBLISHED" ? "Edit Results" : "Enter Offline Marks"}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: Offline Results & Ranking Entry ── */}
      {activeTab === "results" && (
        <Card className="rounded-2xl border bg-card/60 shadow-2xs">
          <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                <span>Offline OMR Marks &amp; Ranking Engine</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Enter offline scores. The engine automatically calculates candidate ranks, percentages, and national percentiles.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={selectedExamId}
                onChange={(e) => {
                  const exam = allExams.find((ex) => ex.id === e.target.value);
                  if (exam) handleOpenMarksEntry(exam);
                }}
                className="h-9 text-xs px-3 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="" disabled>
                  -- Select Offline Test to Enter Marks --
                </option>
                {allExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.testSeriesCode}: {ex.title} ({ex.maxMarks} Marks)
                  </option>
                ))}
              </select>

              {selectedExamId && (
                <Button
                  onClick={handleSubmitMarks}
                  disabled={isPending}
                  className="h-9 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-xs"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>{isPending ? "Publishing..." : "Publish Results"}</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!selectedExamId ? (
              <div className="p-16 text-center text-muted-foreground text-xs space-y-2">
                <Award className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground text-sm">Select an offline test above to start entering marks</p>
                <p className="text-xs max-w-sm mx-auto">
                  Choose a scheduled mock test from the dropdown to record student marks, attendance, and feedback remarks.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground font-medium text-[11px] border-b">
                    <tr>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Candidate Name</th>
                      <th className="py-3 px-4">Attendance</th>
                      <th className="py-3 px-4">Marks Obtained</th>
                      <th className="py-3 px-4">Percentage</th>
                      <th className="py-3 px-4">Faculty Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeExamSeries?.registrations.map((reg) => {
                      const currentEntry = marksEntries[reg.id] || {
                        marks: 0,
                        attendance: "PRESENT",
                        remarks: "",
                      };
                      const maxMarks = activeExam?.maxMarks || 720;
                      const pct = maxMarks > 0 ? ((currentEntry.marks / maxMarks) * 100).toFixed(1) : "0";

                      return (
                        <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-primary">
                            {reg.rollNumber}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-foreground block">
                              {reg.student ? reg.student.name : reg.externalStudentName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
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
                              className={`px-2 py-1 rounded-md text-xs font-semibold focus:outline-none border ${
                                currentEntry.attendance === "PRESENT"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              }`}
                            >
                              <option value="PRESENT">PRESENT</option>
                              <option value="ABSENT">ABSENT</option>
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
                                className="w-24 h-8 text-xs font-bold rounded-lg"
                              />
                              <span className="text-muted-foreground text-[11px]">/ {maxMarks}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <Badge
                              variant={Number(pct) >= 40 ? "success" : "destructive"}
                              className="font-mono text-xs"
                            >
                              {pct}%
                            </Badge>
                          </td>

                          <td className="py-3 px-4">
                            <Input
                              placeholder="e.g. Weak in Organic Chemistry"
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
                              className="h-8 text-xs rounded-lg max-w-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── MODAL: Dedicated Enrolled Students List ("Test Series ke bache") ── */}
      {viewStudentsModalSeries && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 text-xs animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-[10px]">{viewStudentsModalSeries.code}</Badge>
                  <span className="font-semibold text-primary">{viewStudentsModalSeries.targetExam}</span>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Enrolled Students in {viewStudentsModalSeries.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Total {viewStudentsModalSeries.registrations.length} candidates registered for this offline test series.
                </p>
              </div>
              <button
                onClick={() => setViewStudentsModalSeries(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick stats and search inside modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter student name, roll number, phone..."
                  value={seriesStudentSearch}
                  onChange={(e) => setSeriesStudentSearch(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {viewStudentsModalSeries.registrations.filter((r) => r.paymentStatus === "PAID").length} Paid
                </Badge>
                <Button
                  onClick={() => {
                    setViewStudentsModalSeries(null);
                    setRegData((prev) => ({
                      ...prev,
                      testSeriesId: viewStudentsModalSeries.id,
                      feeAmount: viewStudentsModalSeries.fee,
                    }));
                    setShowRegisterModal(true);
                  }}
                  size="sm"
                  className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Enroll More</span>
                </Button>
              </div>
            </div>

            {/* Students Table */}
            <div className="flex-1 overflow-y-auto border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 sticky top-0 text-muted-foreground font-medium text-[11px] border-b">
                  <tr>
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Fee Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {viewStudentsModalSeries.registrations
                    .filter((reg) => {
                      const name = reg.student?.name || reg.externalStudentName || "";
                      const roll = reg.rollNumber || "";
                      const phone = reg.student?.phone || reg.externalStudentPhone || "";
                      const q = seriesStudentSearch.toLowerCase();
                      return (
                        name.toLowerCase().includes(q) ||
                        roll.toLowerCase().includes(q) ||
                        phone.toLowerCase().includes(q)
                      );
                    })
                    .map((reg) => (
                      <tr key={reg.id} className="hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-primary">
                          {reg.rollNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-foreground">
                            {reg.student ? reg.student.name : reg.externalStudentName}
                          </div>
                          {reg.student?.studentId && (
                            <div className="text-[10px] text-muted-foreground font-mono">
                              ID: {reg.student.studentId}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {reg.student?.phone || reg.externalStudentPhone || "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {reg.student ? "Enrolled Student" : "External Candidate"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={reg.paymentStatus === "PAID" ? "success" : "warning"}
                            className="text-[10px]"
                          >
                            {reg.paymentStatus} (₹{reg.feeAmount})
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {reg.student?.id && (
                              <Link
                                href={`/students/${reg.student.id}`}
                                className="h-6 px-2 text-[11px] font-medium rounded border inline-flex items-center gap-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Profile</span>
                              </Link>
                            )}
                            <Button
                              onClick={() => {
                                setAdmitSlipModalData({
                                  ...reg,
                                  testSeriesTitle: viewStudentsModalSeries.title,
                                  testSeriesVenue: viewStudentsModalSeries.testCenterVenue,
                                });
                              }}
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px] font-medium rounded gap-1"
                            >
                              <Printer className="h-3 w-3" />
                              <span>Slip</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setViewStudentsModalSeries(null)}
                className="h-8 text-xs rounded-lg"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: Create Test Series ── */}
      {showCreateSeriesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {editingSeries ? "Edit Offline Test Series" : "Create New Offline Test Series"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {editingSeries
                    ? "Update program details, pricing, dates, and status."
                    : "Setup mock test program, pricing, and testing venue."}
                </p>
              </div>
              <button onClick={closeSeriesModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSeries} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Program Title <span className="text-destructive">*</span></label>
                <Input
                  required
                  placeholder="e.g. NEET 2026 All-India Offline Mock Series"
                  value={newSeriesData.title}
                  onChange={(e) => setNewSeriesData({ ...newSeriesData, title: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Series Code <span className="text-destructive">*</span></label>
                  <Input
                    required
                    placeholder="e.g. NEET-AI-2026"
                    value={newSeriesData.code}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, code: e.target.value })}
                    className="h-9 text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Target Competitive Exam</label>
                  <select
                    value={newSeriesData.targetExam}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, targetExam: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                  >
                    <option value="NEET">NEET (Medical)</option>
                    <option value="JEE_MAINS">JEE Main</option>
                    <option value="JEE_ADVANCED">JEE Advanced</option>
                    <option value="BOARD_12">Class 12 Boards</option>
                    <option value="FOUNDATION">Foundation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">One-Time Registration Fee (₹) <span className="text-destructive">*</span></label>
                  <Input
                    type="number"
                    required
                    value={newSeriesData.fee}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, fee: Number(e.target.value) })}
                    className="h-9 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Total Mock Tests</label>
                  <Input
                    type="number"
                    required
                    value={newSeriesData.totalTests}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, totalTests: Number(e.target.value) })}
                    className="h-9 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Start Date</label>
                  <Input
                    type="date"
                    required
                    value={newSeriesData.startDate}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, startDate: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">End Date</label>
                  <Input
                    type="date"
                    required
                    value={newSeriesData.endDate}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, endDate: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Status</label>
                  <select
                    value={newSeriesData.status}
                    onChange={(e) => setNewSeriesData({ ...newSeriesData, status: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Offline Test Center Venue</label>
                <Input
                  placeholder="e.g. Knowledge Park Campus, Hall A & B"
                  value={newSeriesData.testCenterVenue}
                  onChange={(e) => setNewSeriesData({ ...newSeriesData, testCenterVenue: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Program Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed breakdown of syllabus, OMR evaluation pattern..."
                  value={newSeriesData.description}
                  onChange={(e) => setNewSeriesData({ ...newSeriesData, description: e.target.value })}
                  className="w-full p-2.5 rounded-md border border-input bg-background text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={closeSeriesModal} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="h-9 text-xs font-semibold bg-primary">
                  {isPending
                    ? editingSeries
                      ? "Updating..."
                      : "Creating..."
                    : editingSeries
                      ? "Update Test Series"
                      : "Create Test Series"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Test Series Confirmation */}
      {seriesToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground">Delete Test Series</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  This will permanently delete the program and linked test data.
                </p>
              </div>
              <button
                onClick={() => setSeriesToDelete(null)}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border bg-muted/40 p-3 space-y-2">
              <div className="font-semibold text-foreground">{seriesToDelete.title}</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <span>Code: {seriesToDelete.code}</span>
                <span>{seriesToDelete.exams.length} tests</span>
                <span>{seriesToDelete.registrations.length} candidates</span>
                <span>Status: {seriesToDelete.status}</span>
              </div>
            </div>

            <p className="text-xs text-destructive">
              Delete karne par is series ke scheduled tests, registrations, aur results bhi remove ho jayenge.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSeriesToDelete(null)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleDeleteSeries}
                className="h-9 text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? "Deleting..." : "Delete Test Series"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Schedule New Test ── */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-bold text-foreground">Schedule Offline Pen-Paper Test</h3>
                <p className="text-xs text-muted-foreground">Setup exam date, OMR type, and hall allocation.</p>
              </div>
              <button onClick={() => setShowAddExamModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Select Test Series Program <span className="text-destructive">*</span></label>
                <select
                  value={newExamData.testSeriesId}
                  onChange={(e) => setNewExamData({ ...newExamData, testSeriesId: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                >
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Test #</label>
                  <Input
                    type="number"
                    required
                    value={newExamData.testNumber}
                    onChange={(e) => setNewExamData({ ...newExamData, testNumber: Number(e.target.value) })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-foreground">Test Code <span className="text-destructive">*</span></label>
                  <Input
                    required
                    placeholder="e.g. NEET-MOCK-01"
                    value={newExamData.code}
                    onChange={(e) => setNewExamData({ ...newExamData, code: e.target.value })}
                    className="h-9 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Test Name / Title <span className="text-destructive">*</span></label>
                <Input
                  required
                  placeholder="e.g. Full Syllabus Diagnostic Mock 1"
                  value={newExamData.title}
                  onChange={(e) => setNewExamData({ ...newExamData, title: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Exam Date</label>
                  <Input
                    type="date"
                    required
                    value={newExamData.examDate}
                    onChange={(e) => setNewExamData({ ...newExamData, examDate: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Duration (Mins)</label>
                  <Input
                    type="number"
                    required
                    value={newExamData.durationMinutes}
                    onChange={(e) => setNewExamData({ ...newExamData, durationMinutes: Number(e.target.value) })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Max Marks</label>
                  <Input
                    type="number"
                    required
                    value={newExamData.maxMarks}
                    onChange={(e) => setNewExamData({ ...newExamData, maxMarks: Number(e.target.value) })}
                    className="h-9 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Room / Bench Allocation</label>
                <Input
                  placeholder="e.g. Hall A, Bench 1-40"
                  value={newExamData.venueRoom}
                  onChange={(e) => setNewExamData({ ...newExamData, venueRoom: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Syllabus Topics Covered</label>
                <Input
                  placeholder="e.g. Mechanics, Optics, Electrostatics..."
                  value={newExamData.syllabus}
                  onChange={(e) => setNewExamData({ ...newExamData, syllabus: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setShowAddExamModal(false)} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="h-9 text-xs font-semibold bg-primary">
                  {isPending ? "Scheduling..." : "Schedule Test"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Candidate Registration & Fee Collection ── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-bold text-foreground">Enroll Candidate &amp; Collect Fee</h3>
                <p className="text-xs text-muted-foreground">Generates a permanent Hall Roll Number and official Fee Receipt.</p>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterCandidate} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Select Test Series Program <span className="text-destructive">*</span></label>
                <select
                  value={regData.testSeriesId}
                  onChange={(e) => {
                    const s = seriesList.find((item) => item.id === e.target.value);
                    setRegData({ ...regData, testSeriesId: e.target.value, feeAmount: s?.fee || 2500 });
                  }}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                >
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.title} (Fee: ₹{s.fee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Candidate Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegData({ ...regData, candidateType: "enrolled" })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      regData.candidateType === "enrolled"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    Regular Enrolled Student
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegData({ ...regData, candidateType: "external" })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      regData.candidateType === "external"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    External / Guest Candidate
                  </button>
                </div>
              </div>

              {regData.candidateType === "enrolled" ? (
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Select Student <span className="text-destructive">*</span></label>
                  <select
                    value={regData.studentId}
                    onChange={(e) => setRegData({ ...regData, studentId: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                  >
                    {enrolledStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.studentId} • {s.gradeClass || "Active"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 p-3 rounded-xl bg-muted/40 border">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Full Legal Name <span className="text-destructive">*</span></label>
                    <Input
                      required
                      placeholder="e.g. Rohan V. Kulkarni"
                      value={regData.externalStudentName}
                      onChange={(e) => setRegData({ ...regData, externalStudentName: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Phone <span className="text-destructive">*</span></label>
                      <Input
                        required
                        placeholder="+91 98765 43210"
                        value={regData.externalStudentPhone}
                        onChange={(e) => setRegData({ ...regData, externalStudentPhone: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Email (Optional)</label>
                      <Input
                        placeholder="candidate@gmail.com"
                        value={regData.externalStudentEmail}
                        onChange={(e) => setRegData({ ...regData, externalStudentEmail: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Fee Amount (₹)</label>
                  <Input
                    type="number"
                    required
                    value={regData.feeAmount}
                    onChange={(e) => setRegData({ ...regData, feeAmount: Number(e.target.value) })}
                    className="h-9 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Payment Mode</label>
                  <select
                    value={regData.paymentMethod}
                    onChange={(e) => setRegData({ ...regData, paymentMethod: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                  >
                    <option value="UPI">UPI / QR</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Status</label>
                  <select
                    value={regData.paymentStatus}
                    onChange={(e) => setRegData({ ...regData, paymentStatus: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setShowRegisterModal(false)} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white">
                  {isPending ? "Generating..." : "Register & Issue Slip"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Official Admit Card & Fee Receipt Slip Preview ── */}
      {admitSlipModalData && (
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
                onClick={() => setAdmitSlipModalData(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">EXAM HALL ROLL NUMBER</span>
              <div className="text-2xl font-black text-primary tracking-widest font-mono">
                {admitSlipModalData.rollNumber}
              </div>
              <span className="text-[10px] text-muted-foreground">Quote this Roll No on offline OMR Answer Sheets</span>
            </div>

            <div className="space-y-2.5 text-xs border-y py-3.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Candidate Name:</span>
                <span className="font-bold text-foreground">
                  {admitSlipModalData.student?.name || admitSlipModalData.externalStudentName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Test Series:</span>
                <span className="font-bold text-foreground text-right max-w-[200px] truncate">
                  {admitSlipModalData.testSeriesTitle || admitSlipModalData.testSeries?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt Number:</span>
                <span className="font-mono font-bold text-foreground">{admitSlipModalData.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">One-Time Fee Paid:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{admitSlipModalData.feeAmount?.toLocaleString("en-IN")} ({admitSlipModalData.paymentMethod})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issued On:</span>
                <span className="text-foreground">
                  {admitSlipModalData.paidAt
                    ? new Date(admitSlipModalData.paidAt).toLocaleDateString()
                    : new Date().toLocaleDateString()}
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
                onClick={() => setAdmitSlipModalData(null)}
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
