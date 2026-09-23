"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  getStudents,
  getStudentStats,
  updateStudent,
  updateStudentParent,
  enrollStudentInBatch,
} from "@/server/actions/students";
import { getBatches } from "@/server/actions/academics";
import { formatDate } from "@/lib/utils";
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
import {
  Users,
  UserPlus,
  Search,
  Eye,
  GraduationCap,
  Phone,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Edit3,
  CheckCircle2,
  Check,
} from "lucide-react";

// ─── Types inferred from server action return ──────────────────────────────
type Student = Awaited<ReturnType<typeof getStudents>>["students"][number];

type StatusFilter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "COMPLETED"
  | "DROPPED";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
];

const PAGE_SIZE = 10;

// ─── KPI Card ─────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string; // tailwind bg + text classes e.g. "bg-blue-50 text-blue-600"
}
function KpiCard({ label, value, sub, icon: Icon, color }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground leading-none mt-0.5">
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "ACTIVE"
      ? "success"
      : status === "INACTIVE"
      ? "warning"
      : status === "COMPLETED"
      ? "secondary"
      : "destructive";
  return (
    <Badge variant={variant} className="text-[10px]">
      {status}
    </Badge>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-8 w-8 opacity-40" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {hasFilters ? "No students match your filters" : "No students yet"}
            </p>
            <p className="text-xs mt-1">
              {hasFilters
                ? "Try adjusting your search term or status filter."
                : "Add your first student using the New Admission button above."}
            </p>
          </div>
          {!hasFilters && (
            <Link
              href="/admissions/new"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Add First Student
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function StudentsPage() {
  // ── Fast KPI Statistics ──
  const [kpiStats, setKpiStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    newThisMonth: 0,
    needsAttention: 0,
  });
  const [kpiLoading, setKpiLoading] = useState(true);

  // ── Paginated table data ──
  const [tableStudents, setTableStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(true);

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // ── Fetch KPI counts directly via lightweight query ──
  const fetchKpis = useCallback(async () => {
    setKpiLoading(true);
    try {
      const stats = await getStudentStats();
      setKpiStats(stats);
    } catch {
      // Keep existing stats on transient error
    } finally {
      setKpiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  // ── Fetch paginated table data ──
  const fetchTable = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await getStudents({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit: PAGE_SIZE,
      });
      setTableStudents(res.students);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      // error handled silently; table shows empty state
    } finally {
      setTableLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  // ── Reactive Auto-Refetch (Campus change or data mutation) ──
  useEffect(() => {
    const handleReactiveRefresh = () => {
      fetchTable();
      fetchKpis();
    };

    window.addEventListener("erp-campus-changed", handleReactiveRefresh);
    window.addEventListener("erp-data-refresh", handleReactiveRefresh);
    return () => {
      window.removeEventListener("erp-campus-changed", handleReactiveRefresh);
      window.removeEventListener("erp-data-refresh", handleReactiveRefresh);
    };
  }, [fetchTable, fetchKpis]);

  const hasFilters = debouncedSearch !== "" || statusFilter !== "ALL";

  // ── Batches list for editing batch allotment ──
  const [batches, setBatches] = useState<any[]>([]);
  useEffect(() => {
    getBatches({ status: "ACTIVE" }).then((bList) => setBatches(bList)).catch(() => {});
  }, []);

  // ── Edit Student State ──
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editTab, setEditTab] = useState<"personal" | "parent" | "academic">("personal");

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "MALE",
    dob: "",
    address: "",
    city: "New Delhi",
    state: "Delhi",
    schoolCollege: "",
    gradeClass: "Class 11",
    status: "ACTIVE",
    emergencyContact: "",
    batchId: "",
    parentName: "",
    parentPhone: "",
    parentRelation: "Father",
    parentOccupation: "",
  });

  const handleOpenEdit = (stu: Student) => {
    setEditingStudent(stu);
    setEditError("");
    setEditSuccess("");
    setEditTab("personal");
    const activeBatchId = stu.enrollments[0]?.batch?.id || "";
    setEditForm({
      name: stu.name || "",
      phone: stu.phone || "",
      email: stu.email || "",
      gender: stu.gender || "MALE",
      dob: stu.dob ? new Date(stu.dob).toISOString().split("T")[0] : "",
      address: stu.address || "",
      city: stu.city || "New Delhi",
      state: stu.state || "Delhi",
      schoolCollege: stu.schoolCollege || "",
      gradeClass: stu.gradeClass || "Class 11",
      status: stu.status || "ACTIVE",
      emergencyContact: stu.emergencyContact || "",
      batchId: activeBatchId,
      parentName: stu.parent?.name || "",
      parentPhone: stu.parent?.phone || "",
      parentRelation: stu.parent?.relation || "Father",
      parentOccupation: stu.parent?.occupation || "",
    });
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editForm.name.trim()) {
      setEditError("Student name is required.");
      return;
    }

    setIsSavingStudent(true);
    setEditError("");
    setEditSuccess("");

    try {
      await updateStudent(editingStudent.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
        gender: editForm.gender,
        dob: editForm.dob || undefined,
        address: editForm.address.trim() || undefined,
        city: editForm.city.trim() || undefined,
        state: editForm.state.trim() || undefined,
        schoolCollege: editForm.schoolCollege.trim() || undefined,
        gradeClass: editForm.gradeClass.trim() || undefined,
        status: editForm.status,
        emergencyContact: editForm.emergencyContact.trim() || undefined,
      });

      if (editForm.parentName.trim() && editForm.parentPhone.trim()) {
        await updateStudentParent(editingStudent.id, {
          name: editForm.parentName.trim(),
          phone: editForm.parentPhone.trim(),
          relation: editForm.parentRelation,
          occupation: editForm.parentOccupation.trim() || undefined,
        });
      }

      const currentBatchId = editingStudent.enrollments[0]?.batch?.id || "";
      if (editForm.batchId && editForm.batchId !== currentBatchId) {
        const selectedBatch = batches.find((b) => b.id === editForm.batchId);
        if (selectedBatch) {
          await enrollStudentInBatch(editingStudent.id, selectedBatch.id, selectedBatch.courseId);
        }
      }

      setEditSuccess("Student profile updated successfully!");
      fetchTable();
      fetchKpis();

      setTimeout(() => {
        setEditingStudent(null);
      }, 700);
    } catch (err: any) {
      setEditError(err.message || "Failed to update student.");
    } finally {
      setIsSavingStudent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Students Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage admissions, batch enrollments, contact particulars, and
            performance records.
          </p>
        </div>
        <Link
          href="/admissions/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow hover:bg-primary/90 transition-colors shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          New Admission
        </Link>
      </div>

      {/* ── KPI Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Students"
          value={kpiLoading ? "—" : kpiStats.totalStudents}
          sub="All time enrollments"
          icon={Users}
          color="bg-blue-50 text-blue-600 dark:bg-blue-950/40"
        />
        <KpiCard
          label="Active Students"
          value={kpiLoading ? "—" : kpiStats.activeStudents}
          sub="Currently enrolled"
          icon={UserCheck}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
        />
        <KpiCard
          label="New This Month"
          value={kpiLoading ? "—" : kpiStats.newThisMonth}
          sub="Fresh admissions"
          icon={TrendingUp}
          color="bg-violet-50 text-violet-600 dark:bg-violet-950/40"
        />
        <KpiCard
          label="Needs Attention"
          value={kpiLoading ? "—" : kpiStats.needsAttention}
          sub="Inactive or suspended"
          icon={AlertTriangle}
          color="bg-amber-50 text-amber-600 dark:bg-amber-950/40"
        />
      </div>

      {/* ── Filters ───────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, phone, email…"
                className="w-full h-9 pl-9 pr-8 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className="h-9 px-3 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Reset */}
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                }}
                className="h-9 px-3 rounded-md border text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Students Table ────────────────────────────── */}
      <Card>
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Enrolled Students{" "}
              {!tableLoading && (
                <span className="text-muted-foreground font-normal">
                  ({total})
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              {tableLoading
                ? "Loading…"
                : `Page ${page} of ${totalPages || 1}`}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                  <th className="p-3 pl-4">Student ID</th>
                  <th className="p-3">Name &amp; School</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Phone &amp; Parent</th>
                  <th className="p-3">Admission Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tableLoading ? (
                  // Skeleton rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="p-3">
                          <div className="h-4 bg-muted rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : tableStudents.length === 0 ? (
                  <EmptyState hasFilters={hasFilters} />
                ) : (
                  tableStudents.map((stu) => {
                    const activeEnrollment = stu.enrollments[0];
                    return (
                      <tr
                        key={stu.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Student ID */}
                        <td className="p-3 pl-4 font-semibold text-primary">
                          {stu.studentId}
                          <div className="text-[10px] text-muted-foreground font-normal">
                            Adm: {stu.admissionNo}
                          </div>
                        </td>

                        {/* Name & School */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                              {stu.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground text-sm block truncate">
                                {stu.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground truncate">
                                {stu.gender} • {stu.schoolCollege ?? "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Batch */}
                        <td className="p-3">
                          <div className="font-medium text-foreground">
                            {stu.gradeClass ?? "—"}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            <span>
                              {activeEnrollment?.batch?.name ?? "Unassigned"}
                            </span>
                          </div>
                        </td>

                        {/* Phone & Parent */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{stu.phone ?? "—"}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Parent:{" "}
                            {stu.parent
                              ? `${stu.parent.name} (${stu.parent.phone ?? "—"})`
                              : "—"}
                          </div>
                        </td>

                        {/* Admission Date */}
                        <td className="p-3 text-muted-foreground">
                          {formatDate(stu.admissionDate)}
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          <StatusBadge status={stu.status} />
                        </td>

                        {/* Actions */}
                        <td className="p-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(stu)}
                              className="h-7 px-2 text-xs font-semibold inline-flex items-center gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Edit</span>
                            </Button>
                            <Link
                              href={`/students/${stu.id}`}
                              className="inline-flex items-center gap-1 h-7 px-2 rounded-md border text-xs font-semibold hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Profile</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ────────────────────────────── */}
          {!tableLoading && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t text-xs">
              <span className="text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, total)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">{total}</span>{" "}
                students
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>

                {/* Page number pills */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) {
                    p = i + 1;
                  } else if (page <= 3) {
                    p = i + 1;
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  } else {
                    p = page - 2 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-7 rounded border text-xs font-semibold transition-colors ${
                        p === page
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* ── EDIT STUDENT MODAL ── */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Edit Student Record: {editingStudent.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Roll No: {editingStudent.studentId} • Admission No: {editingStudent.admissionNo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications */}
            {editSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}
            {editError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Segmented Tabs */}
            <div className="flex border-b">
              <button
                type="button"
                onClick={() => setEditTab("personal")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  editTab === "personal"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Personal & Academic
              </button>
              <button
                type="button"
                onClick={() => setEditTab("parent")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  editTab === "parent"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Parent / Guardian
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 pt-1">
              {editTab === "personal" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Full Legal Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Account Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="DROPPED">DROPPED</option>
                      </select>
                    </div>
                  </div>

                  {/* Batch Allotment Dropdown */}
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <label className="font-semibold text-foreground block mb-1 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span>Classroom Batch Allotment:</span>
                    </label>
                    <select
                      value={editForm.batchId}
                      onChange={(e) => setEditForm({ ...editForm, batchId: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-medium"
                    >
                      <option value="">-- No Batch (Unassigned) --</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code}) • Cap: {b.capacity} seats
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Phone Number
                      </label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="student@example.com"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Gender
                      </label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                      >
                        <option value="MALE">MALE</option>
                        <option value="FEMALE">FEMALE</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Grade / Class
                      </label>
                      <Input
                        value={editForm.gradeClass}
                        onChange={(e) => setEditForm({ ...editForm, gradeClass: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="e.g. Class 11"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        School / Board
                      </label>
                      <Input
                        value={editForm.schoolCollege}
                        onChange={(e) => setEditForm({ ...editForm, schoolCollege: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="e.g. CBSE Board"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Residential Address
                      </label>
                      <Input
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="Address"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Emergency Contact
                      </label>
                      <Input
                        value={editForm.emergencyContact}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="Phone"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Guardian Name
                      </label>
                      <Input
                        value={editForm.parentName}
                        onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Relationship
                      </label>
                      <select
                        value={editForm.parentRelation}
                        onChange={(e) => setEditForm({ ...editForm, parentRelation: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Guardian Phone Number
                      </label>
                      <Input
                        value={editForm.parentPhone}
                        onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Guardian Profession / Occupation
                      </label>
                      <Input
                        value={editForm.parentOccupation}
                        onChange={(e) => setEditForm({ ...editForm, parentOccupation: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="e.g. Business, Doctor"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStudent(null)}
                  disabled={isSavingStudent}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingStudent}
                  className="text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{isSavingStudent ? "Saving Changes..." : "Save Changes"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
