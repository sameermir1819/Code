"use client";

import { useState, useEffect, useTransition } from "react";
import { getExams, createExam, publishExam } from "@/server/actions/exams";
import { getBatches, getSubjects } from "@/server/actions/academics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import {
  ClipboardList,
  Calendar,
  Clock,
  Award,
  Plus,
  X,
  Users,
  BarChart2,
  Loader2,
  BookOpen,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

// ─── Inferred types from server action return shapes ────────────────────────
type Exam = Awaited<ReturnType<typeof getExams>>[number];
type Batch = Awaited<ReturnType<typeof getBatches>>[number];
type Subject = Awaited<ReturnType<typeof getSubjects>>[number];

// ─── Helpers ────────────────────────────────────────────────────────────────
function generateExamCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EXAM-${year}-${rand}`;
}

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  UPCOMING: {
    label: "Upcoming",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  ONGOING: {
    label: "Ongoing",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-secondary text-secondary-foreground",
  },
  PUBLISHED: {
    label: "Published",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

const TYPE_BADGE: Record<string, string> = {
  TEST: "bg-violet-100 text-violet-700",
  EXAM: "bg-blue-100 text-blue-700",
  MOCK_TEST: "bg-rose-100 text-rose-700",
};

// ─── Modal ───────────────────────────────────────────────────────────────────
interface CreateExamModalProps {
  batches: Batch[];
  subjects: Subject[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateExamModal({
  batches,
  subjects,
  onClose,
  onSuccess,
}: CreateExamModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [autoCode] = useState(generateExamCode);

  const [form, setForm] = useState({
    title: "",
    type: "TEST",
    batchId: "",
    subjectId: "",
    examDate: "",
    maxMarks: 100,
    passingMarks: 40,
    durationMinutes: 180,
    instructions: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.batchId || !form.subjectId) {
      setError("Please select a batch and subject.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createExam({ ...form, code: autoCode });
        onSuccess();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create exam.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-background z-10">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Schedule New Exam</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill details below to create an assessment record
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Auto-generated code */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Exam Code (Auto-generated)
            </label>
            <Input
              value={autoCode}
              readOnly
              className="font-mono bg-muted/40 text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Exam Title <span className="text-destructive">*</span>
            </label>
            <Input
              required
              placeholder="e.g. Phase 1 Assessment – Physics Mechanics"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* Type + Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Exam Type
              </label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="TEST">Test</option>
                <option value="EXAM">Exam</option>
                <option value="MOCK_TEST">Mock Test</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Batch <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={form.batchId}
                onChange={(e) => set("batchId", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select batch...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Subject <span className="text-destructive">*</span>
            </label>
            <select
              required
              value={form.subjectId}
              onChange={(e) => set("subjectId", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Exam Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                required
                value={form.examDate}
                onChange={(e) => set("examDate", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Duration (minutes)
              </label>
              <Input
                type="number"
                min={15}
                max={480}
                value={form.durationMinutes}
                onChange={(e) =>
                  set("durationMinutes", parseInt(e.target.value) || 180)
                }
              />
            </div>
          </div>

          {/* Max + Passing Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Maximum Marks
              </label>
              <Input
                type="number"
                min={1}
                value={form.maxMarks}
                onChange={(e) =>
                  set("maxMarks", parseInt(e.target.value) || 100)
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Passing Marks
              </label>
              <Input
                type="number"
                min={0}
                value={form.passingMarks}
                onChange={(e) =>
                  set("passingMarks", parseInt(e.target.value) || 40)
                }
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Special Instructions (optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. No calculators allowed. Attempt all sections."
              value={form.instructions}
              onChange={(e) => set("instructions", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Exam
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Exam Card ───────────────────────────────────────────────────────────────
interface ExamCardProps {
  exam: Exam;
  onPublished: () => void;
}

function ExamCard({ exam, onPublished }: ExamCardProps) {
  const [publishing, startPublish] = useTransition();
  const statusInfo =
    STATUS_BADGE[exam.status] ?? STATUS_BADGE["UPCOMING"];
  const typeClass = TYPE_BADGE[exam.type] ?? "bg-gray-100 text-gray-700";

  function handlePublish() {
    startPublish(async () => {
      await publishExam(exam.id);
      onPublished();
    });
  }

  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                {exam.code}
              </Badge>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeClass}`}
              >
                {exam.type.replace("_", " ")}
              </span>
            </div>
            <CardTitle className="text-base font-bold leading-snug">
              {exam.title}
            </CardTitle>
            <p className="text-xs text-primary font-semibold mt-0.5">
              {exam.subject.name}
              <span className="text-muted-foreground font-normal"> · </span>
              {exam.batch.name}
            </p>
          </div>
          <span
            className={`inline-flex items-center shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/40 border">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Date
            </span>
            <span className="font-semibold text-foreground">
              {formatDate(exam.examDate)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Duration
            </span>
            <span className="font-semibold text-foreground">
              {exam.durationMinutes} min
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Award className="h-3 w-3" /> Marks
            </span>
            <span className="font-semibold text-foreground">
              {exam.maxMarks}{" "}
              <span className="text-muted-foreground font-normal">
                (Pass: {exam.passingMarks})
              </span>
            </span>
          </div>
        </div>

        {/* Students graded indicator */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            <span className="font-semibold text-foreground">
              {exam._count.marks}
            </span>{" "}
            student{exam._count.marks !== 1 ? "s" : ""} graded
          </span>
        </div>

        {exam.instructions && (
          <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2 rounded border border-dashed">
            📋 {exam.instructions}
          </p>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Link
            href={`/exams/${exam.id}/marks`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Enter Marks
          </Link>
          <button
            onClick={handlePublish}
            disabled={exam.status === "PUBLISHED" || publishing}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
          >
            {publishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {exam.status === "PUBLISHED" ? "Published" : "Publish"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [filterBatch, setFilterBatch] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  async function loadData() {
    setLoading(true);
    try {
      const [examData, batchData, subjectData] = await Promise.all([
        getExams(),
        getBatches({ status: "ACTIVE" }),
        getSubjects(),
      ]);
      setExams(examData);
      setBatches(batchData);
      setSubjects(subjectData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // Derived / filtered
  const filtered = exams.filter((e) => {
    if (filterBatch !== "ALL" && e.batchId !== filterBatch) return false;
    if (filterStatus !== "ALL" && e.status !== filterStatus) return false;
    if (filterType !== "ALL" && e.type !== filterType) return false;
    return true;
  });

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const stats = {
    total: exams.length,
    upcoming: exams.filter((e) => e.status === "UPCOMING").length,
    published: exams.filter((e) => e.status === "PUBLISHED").length,
    thisMonth: exams.filter(
      (e) => new Date(e.examDate) >= thisMonthStart
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Examinations &amp; Assessments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Schedule tests, record marks, and publish results for all batches.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Exam
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Exams",
            value: stats.total,
            icon: ClipboardList,
            color: "text-primary",
          },
          {
            label: "Upcoming",
            value: stats.upcoming,
            icon: Calendar,
            color: "text-blue-600",
          },
          {
            label: "Published",
            value: stats.published,
            icon: CheckCircle2,
            color: "text-emerald-600",
          },
          {
            label: "This Month",
            value: stats.thisMonth,
            icon: TrendingUp,
            color: "text-amber-600",
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

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Statuses</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="PUBLISHED">Published</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Types</option>
          <option value="TEST">Test</option>
          <option value="EXAM">Exam</option>
          <option value="MOCK_TEST">Mock Test</option>
        </select>

        {(filterBatch !== "ALL" ||
          filterStatus !== "ALL" ||
          filterType !== "ALL") && (
          <button
            onClick={() => {
              setFilterBatch("ALL");
              setFilterStatus("ALL");
              setFilterType("ALL");
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {exams.length} exam
          {exams.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="rounded-full bg-muted p-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No exams found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {exams.length === 0
                  ? "Schedule your first exam to get started."
                  : "No exams match the selected filters."}
              </p>
            </div>
            {exams.length === 0 && (
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Schedule Exam
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exams grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onPublished={loadData}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CreateExamModal
          batches={batches}
          subjects={subjects}
          onClose={() => setShowModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
