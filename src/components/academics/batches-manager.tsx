"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  assignTeacherSubjects,
  createSubject,
  deleteSubject,
} from "@/server/actions/academics";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  GraduationCap,
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  Search,
  Grid,
  List,
  ArrowUpDown,
  BookOpen,
  Check,
  FolderOpen,
  ArrowRight,
  Clock,
  FileText,
  Sparkles,
  Filter,
} from "lucide-react";

interface BatchesManagerProps {
  initialBatches: any[];
  courses?: any[];
  teachers?: any[];
  allSubjects?: any[];
  userRole?: string;
}

export function BatchesManager({
  initialBatches,
  courses = [],
  teachers = [],
  allSubjects = [],
  userRole = "ADMIN",
}: BatchesManagerProps) {
  const [batches, setBatches] = useState(initialBatches);
  const [teacherList, setTeacherList] = useState(teachers);
  const [isPending, startTransition] = useTransition();

  // Sync state when initialBatches prop changes
  useEffect(() => {
    setBatches(initialBatches);
  }, [initialBatches]);

  // Reactive auto-refresh when campus or data changes globally
  useEffect(() => {
    const handleReactiveRefresh = async () => {
      try {
        const fresh = await getBatches();
        setBatches(fresh);
      } catch (err) {
        console.error("Failed to auto-refresh batches:", err);
      }
    };
    window.addEventListener("erp-campus-changed", handleReactiveRefresh);
    window.addEventListener("erp-data-refresh", handleReactiveRefresh);
    return () => {
      window.removeEventListener("erp-campus-changed", handleReactiveRefresh);
      window.removeEventListener("erp-data-refresh", handleReactiveRefresh);
    };
  }, []);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Assign Subjects modal state
  const [assigningTeacherModal, setAssigningTeacherModal] = useState<any | null>(null);
  const [tempSubjectIds, setTempSubjectIds] = useState<string[]>([]);
  const [isSavingSubjects, setIsSavingSubjects] = useState(false);

  // Subjects management state
  const [subjectsList, setSubjectsList] = useState(allSubjects);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectDesc, setNewSubjectDesc] = useState("");
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState("");
  const [subjectSuccess, setSubjectSuccess] = useState("");
  const [isQuickAddSubjectOpen, setIsQuickAddSubjectOpen] = useState(false);

  // Modals & Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [selectedBatchForDrawer, setSelectedBatchForDrawer] = useState<any | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<any | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"RECENT" | "NAME" | "CAPACITY" | "STUDENTS">("RECENT");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  // Create Form State (No Target Course / Program)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    capacity: 40,
    room: "Lecture Hall 101",
    selectedTeacherIds: [] as string[],
  });

  // Edit Form State (No Target Course / Program)
  const [editFormData, setEditFormData] = useState({
    name: "",
    code: "",
    startDate: "",
    endDate: "",
    capacity: 40,
    room: "",
    status: "ACTIVE",
    selectedTeacherIds: [] as string[],
  });

  // Filtered and sorted batches computation
  const filteredBatches = useMemo(() => {
    let result = batches.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.name?.toLowerCase().includes(q) ||
        b.code?.toLowerCase().includes(q) ||
        b.room?.toLowerCase().includes(q) ||
        b.teachers?.some((t: any) => t.teacher?.name?.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (sortBy === "NAME") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "CAPACITY") {
      result = [...result].sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
    } else if (sortBy === "STUDENTS") {
      result = [...result].sort((a, b) => (b._count?.enrollments || 0) - (a._count?.enrollments || 0));
    }

    return result;
  }, [batches, searchQuery, statusFilter, sortBy]);

  // Overall KPI Metrics
  const totalBatches = batches.length;
  const activeBatches = batches.filter((b) => b.status === "ACTIVE").length;
  const totalCapacity = batches.reduce((sum, b) => sum + (b.capacity || 0), 0);
  const totalEnrolled = batches.reduce((sum, b) => sum + (b._count?.enrollments || 0), 0);
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  // Auto-code suggestion on name change
  const handleNameChange = (name: string) => {
    const clean = name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const parts = clean.split(/\s+/);
    const code = "BAT-" + parts.map((p) => p.substring(0, 3).toUpperCase()).join("-");
    setFormData((prev) => ({
      ...prev,
      name,
      code: prev.code && !prev.code.startsWith("BAT-") ? prev.code : code,
    }));
  };

  const toggleTeacher = (tId: string, isEdit = false) => {
    if (isEdit) {
      setEditFormData((prev) => {
        const exists = prev.selectedTeacherIds.includes(tId);
        return {
          ...prev,
          selectedTeacherIds: exists
            ? prev.selectedTeacherIds.filter((id) => id !== tId)
            : [...prev.selectedTeacherIds, tId],
        };
      });
    } else {
      setFormData((prev) => {
        const exists = prev.selectedTeacherIds.includes(tId);
        return {
          ...prev,
          selectedTeacherIds: exists
            ? prev.selectedTeacherIds.filter((id) => id !== tId)
            : [...prev.selectedTeacherIds, tId],
        };
      });
    }
  };

  const openAssignSubjects = (teacher: any) => {
    setAssigningTeacherModal(teacher);
    const existing =
      teacher.subjects?.map((ts: any) => ts.subjectId || ts.subject?.id).filter(Boolean) || [];
    setTempSubjectIds(existing);
  };

  const toggleTempSubject = (id: string) => {
    setTempSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSaveTeacherSubjects = async () => {
    if (!assigningTeacherModal) return;
    setIsSavingSubjects(true);
    try {
      const res = await assignTeacherSubjects({
        teacherId: assigningTeacherModal.id,
        subjectIds: tempSubjectIds,
      });

      if (res.success) {
        const assignedObjs = allSubjects.filter((s) => tempSubjectIds.includes(s.id));
        setTeacherList((prev) =>
          prev.map((t) => {
            if (t.id === assigningTeacherModal.id) {
              return {
                ...t,
                specialization: res.specialization,
                subjects: assignedObjs.map((s) => ({
                  id: `ts-${s.id}`,
                  subjectId: s.id,
                  subject: s,
                })),
              };
            }
            return t;
          })
        );
        setSuccessMsg(`Assigned subjects updated for ${assigningTeacherModal.name}.`);
        setAssigningTeacherModal(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to assign subjects.");
    } finally {
      setIsSavingSubjects(false);
    }
  };

  // Create Subject Handler
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectCode.trim()) {
      setSubjectError("Please provide both Subject Name and Subject Code.");
      return;
    }
    setIsCreatingSubject(true);
    setSubjectError("");
    setSubjectSuccess("");
    try {
      const res = await createSubject({
        name: newSubjectName.trim(),
        code: newSubjectCode.trim().toUpperCase(),
        description: newSubjectDesc.trim() || undefined,
      });
      if (res?.success && res.subject) {
        setSubjectsList((prev) => [...prev, res.subject]);
        setNewSubjectName("");
        setNewSubjectCode("");
        setNewSubjectDesc("");
        setSubjectSuccess(`Subject "${res.subject.name}" (${res.subject.code}) created successfully!`);
        setIsQuickAddSubjectOpen(false);
      }
    } catch (err: any) {
      setSubjectError(err.message || "Failed to create subject.");
    } finally {
      setIsCreatingSubject(false);
    }
  };

  // Delete Subject Handler
  const handleDeleteSubject = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete subject "${name}"?`)) return;
    setSubjectError("");
    setSubjectSuccess("");
    try {
      await deleteSubject(id);
      setSubjectsList((prev) => prev.filter((s) => s.id !== id));
      setSubjectSuccess(`Subject "${name}" deleted successfully.`);
    } catch (err: any) {
      setSubjectError(err.message || "Failed to delete subject.");
    }
  };

  // Open Edit Modal with prefilled data
  const handleOpenEdit = (batch: any) => {
    setEditingBatch(batch);
    setEditFormData({
      name: batch.name,
      code: batch.code,
      startDate: batch.startDate ? new Date(batch.startDate).toISOString().split("T")[0] : "",
      endDate: batch.endDate ? new Date(batch.endDate).toISOString().split("T")[0] : "",
      capacity: batch.capacity || 40,
      room: batch.room || "",
      status: batch.status || "ACTIVE",
      selectedTeacherIds: batch.teachers
        ? batch.teachers.map((t: any) => t.teacherId || t.teacher?.id).filter(Boolean)
        : [],
    });
  };

  // Create Batch Submission
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Please provide a Class/Batch name.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createBatch({
          name: formData.name.trim(),
          code: formData.code.trim() || `BAT-${Date.now().toString().slice(-4)}`,
          startDate: formData.startDate,
          endDate: formData.endDate,
          capacity: Number(formData.capacity) || 40,
          room: formData.room || "Room 101",
          teacherIds: formData.selectedTeacherIds,
        });

        if (res?.success && res.batch) {
          setSuccessMsg(`Batch "${formData.name}" created successfully!`);
          setIsCreateModalOpen(false);

          const assignedTeachers = teachers
            .filter((t) => formData.selectedTeacherIds.includes(t.id))
            .map((t) => ({ teacher: t }));

          setBatches((prev) => [
            {
              ...res.batch,
              teachers: assignedTeachers,
              _count: { enrollments: 0 },
            },
            ...prev,
          ]);

          // Reset form
          setFormData({
            name: "",
            code: "",
            startDate: new Date().toISOString().split("T")[0],
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            capacity: 40,
            room: "Lecture Hall 101",
            selectedTeacherIds: [],
          });
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to create class.");
      }
    });
  };

  // Update Batch Submission
  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      try {
        const res = await updateBatch(editingBatch.id, {
          name: editFormData.name,
          code: editFormData.code,
          startDate: editFormData.startDate,
          endDate: editFormData.endDate,
          capacity: editFormData.capacity,
          room: editFormData.room,
          status: editFormData.status,
          teacherIds: editFormData.selectedTeacherIds,
        });

        if (res?.success && res.batch) {
          setSuccessMsg(`Batch "${editFormData.name}" updated successfully!`);
          const assignedTeachers = teachers
            .filter((t) => editFormData.selectedTeacherIds.includes(t.id))
            .map((t) => ({ teacher: t }));

          setBatches((prev) =>
            prev.map((b) =>
              b.id === editingBatch.id
                ? {
                    ...res.batch,
                    teachers: assignedTeachers,
                    _count: b._count,
                  }
                : b
            )
          );

          if (selectedBatchForDrawer?.id === editingBatch.id) {
            setSelectedBatchForDrawer({
              ...res.batch,
              teachers: assignedTeachers,
              _count: selectedBatchForDrawer._count,
            });
          }

          setEditingBatch(null);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to update batch.");
      }
    });
  };

  // Delete Batch Submission
  const handleConfirmDelete = async () => {
    if (!deletingBatch) return;

    startTransition(async () => {
      try {
        await deleteBatch(deletingBatch.id);
        setBatches((prev) => prev.filter((b) => b.id !== deletingBatch.id));
        if (selectedBatchForDrawer?.id === deletingBatch.id) {
          setSelectedBatchForDrawer(null);
        }
        setSuccessMsg(`Batch "${deletingBatch.name}" deleted.`);
        setDeletingBatch(null);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to delete batch.");
        setDeletingBatch(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Executive Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Classrooms & Batches</h1>
            <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 bg-muted/60">
              {totalBatches} {totalBatches === 1 ? "Batch" : "Batches"}
            </Badge>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeBatches} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Enterprise management of classroom cohorts, seat capacity, room allocations, and faculty assignments.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setErrorMsg("");
                setSuccessMsg("");
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold h-9 rounded-xl shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Batch</span>
            </Button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="hover:opacity-75 p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="hover:opacity-75 p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── KPI Metrics Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border shadow-xs hover:border-primary/40 transition-colors p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Batches</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{totalBatches}</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            <strong className="text-emerald-600 font-semibold">{activeBatches} Active</strong> classroom batches
          </p>
        </Card>

        <Card className="rounded-2xl border shadow-xs hover:border-blue-400/40 transition-colors p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Seating Capacity</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{totalCapacity}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Physical desk capacity</p>
        </Card>

        <Card className="rounded-2xl border shadow-xs hover:border-emerald-400/40 transition-colors p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrolled Students</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 flex items-center justify-center">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {totalEnrolled}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Active assigned students</p>
        </Card>

        <Card className="rounded-2xl border shadow-xs hover:border-violet-400/40 transition-colors p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Occupancy</span>
            <div className="h-8 w-8 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 flex items-center justify-center">
              <ArrowUpDown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{avgOccupancy}%</div>
          <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                avgOccupancy >= 90 ? "bg-red-500" : avgOccupancy >= 75 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${avgOccupancy}%` }}
            />
          </div>
        </Card>
      </div>

      {/* ── Status Tabs, Search, Sort & View Bar ── */}
      <div className="space-y-3">
        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          {[
            { label: "All Batches", value: "ALL", count: batches.length },
            { label: "Active", value: "ACTIVE", count: batches.filter((b) => b.status === "ACTIVE").length },
            { label: "Upcoming", value: "UPCOMING", count: batches.filter((b) => b.status === "UPCOMING").length },
            { label: "Completed", value: "COMPLETED", count: batches.filter((b) => b.status === "COMPLETED").length },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.value ? "bg-white/20 text-white" : "bg-background/80 text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Sort, View Controls */}
        <Card className="p-3 rounded-2xl border shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batch by name, code, room, or faculty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 text-xs h-9 rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium shrink-0">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-9 px-3 text-xs rounded-xl border border-input bg-background text-foreground shrink-0 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="RECENT">Recently Added</option>
                  <option value="NAME">Name (A-Z)</option>
                  <option value="CAPACITY">Highest Capacity</option>
                  <option value="STUDENTS">Most Enrolled</option>
                </select>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 border p-1 rounded-xl bg-muted/40 shrink-0">
              <button
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === "GRID"
                    ? "bg-background text-primary shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid View"
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === "TABLE"
                    ? "bg-background text-primary shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Batch Listings ── */}
      {filteredBatches.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 rounded-2xl">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold">No Batches Found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 mb-6">
            {searchQuery || statusFilter !== "ALL"
              ? "No batches match your current search and filter criteria. Try clearing filters or search terms."
              : "No batches have been created yet. Click the button below to set up your first classroom batch for Futurex Learning."}
          </p>
          {isAdmin && (
            <Button
              onClick={() => {
                setErrorMsg("");
                setSuccessMsg("");
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Batch</span>
            </Button>
          )}
        </Card>
      ) : viewMode === "GRID" ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBatches.map((b) => {
            const studentCount = b._count?.enrollments || 0;
            const capacityPercent = Math.min(100, Math.round((studentCount / (b.capacity || 40)) * 100));

            return (
              <Card
                key={b.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card/95 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-200"
              >
                {/* Top Accent Line */}
                <div
                  className={`h-1.5 w-full ${
                    b.status === "ACTIVE"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : b.status === "UPCOMING"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-400"
                      : "bg-muted"
                  }`}
                />

                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-muted text-foreground border">
                        {b.code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          b.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                            : b.status === "UPCOMING"
                            ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                            : "bg-muted text-muted-foreground border"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            b.status === "ACTIVE"
                              ? "bg-emerald-500 animate-pulse"
                              : b.status === "UPCOMING"
                              ? "bg-blue-500"
                              : "bg-muted-foreground"
                          }`}
                        />
                        <span>{b.status}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBatchForDrawer(b)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Quick preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(b)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit batch"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                      <Link href={`/batches/${b.id}`} className="hover:underline">
                        {b.name}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{b.room || "Room Unassigned"}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Starts {formatDate(b.startDate)}</span>
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-2 space-y-4 text-xs">
                  {/* Capacity Meter */}
                  <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-muted-foreground">Desk Occupancy</span>
                      <span className="font-bold text-foreground">
                        {studentCount} / {b.capacity} Seats{" "}
                        <span className="text-[11px] font-normal text-muted-foreground">({capacityPercent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          capacityPercent >= 90
                            ? "bg-red-500"
                            : capacityPercent >= 75
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Curriculum Load Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-muted/20 border">
                      <span className="block font-bold text-foreground text-sm">
                        {b.course?.subjects?.length || 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">Subjects</span>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/20 border">
                      <span className="block font-bold text-foreground text-sm">
                        {b.timetableSlots?.length || b._count?.timetableSlots || 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">Lectures/Wk</span>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/20 border">
                      <span className="block font-bold text-foreground text-sm">
                        {b._count?.studyMaterials || 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">Notes</span>
                    </div>
                  </div>

                  {/* Faculty */}
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">
                      Assigned Faculty:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {b.teachers && b.teachers.length > 0 ? (
                        b.teachers.map((tb: any, idx: number) => {
                          const t = tb.teacher;
                          const subs = t?.subjects?.map((s: any) => s.subject?.name).filter(Boolean);
                          return (
                            <span
                              key={tb.id || idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-medium border border-primary/20"
                            >
                              <GraduationCap className="h-3 w-3 shrink-0" />
                              <span className="font-semibold text-foreground">{t?.name || "Faculty"}</span>
                              {subs && subs.length > 0 ? (
                                <span className="text-[10px] text-primary/80 font-normal">
                                  ({subs.join(", ")})
                                </span>
                              ) : t?.specialization ? (
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  ({t.specialization})
                                </span>
                              ) : null}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground italic text-xs">No faculty assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t flex items-center gap-2">
                    <Link
                      href={`/batches/${b.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm group/btn"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span>Enter Batch Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>

                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingBatch(b)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                        title="Delete batch"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── ENTERPRISE TABLE VIEW ── */
        <Card className="rounded-2xl border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                  <th className="p-3.5 pl-5">Batch & Code</th>
                  <th className="p-3.5">Schedule & Room</th>
                  <th className="p-3.5">Occupancy / Capacity</th>
                  <th className="p-3.5">Assigned Faculty</th>
                  <th className="p-3.5">Curriculum Load</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBatches.map((b) => {
                  const studentCount = b._count?.enrollments || 0;
                  const capacityPercent = Math.min(100, Math.round((studentCount / (b.capacity || 40)) * 100));

                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-3.5 pl-5">
                        <Link
                          href={`/batches/${b.id}`}
                          className="font-bold text-foreground text-sm hover:text-primary transition-colors block"
                        >
                          {b.name}
                        </Link>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {b.code}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{b.room || "Room 101"}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          Starts: {formatDate(b.startDate)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {studentCount} / {b.capacity}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">({capacityPercent}%)</span>
                        </div>
                        <div className="w-24 bg-muted h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              capacityPercent >= 90 ? "bg-red-500" : capacityPercent >= 75 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${capacityPercent}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                          {b.teachers && b.teachers.length > 0 ? (
                            b.teachers.map((tb: any, idx: number) => {
                              const t = tb.teacher;
                              const subs = t?.subjects?.map((s: any) => s.subject?.name).filter(Boolean);
                              return (
                                <span
                                  key={tb.id || idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted font-medium text-[10px] text-foreground border"
                                >
                                  <span>{t?.name}</span>
                                  {subs && subs.length > 0 ? (
                                    <span className="text-primary font-semibold text-[9px]">
                                      ({subs.join(", ")})
                                    </span>
                                  ) : t?.specialization ? (
                                    <span className="text-muted-foreground text-[9px]">
                                      ({t.specialization})
                                    </span>
                                  ) : null}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          <span>{b.course?.subjects?.length || 0} Sub</span>
                          <span>•</span>
                          <span>{b.timetableSlots?.length || b._count?.timetableSlots || 0} Lec/Wk</span>
                          <span>•</span>
                          <span>{b._count?.studyMaterials || 0} Notes</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            b.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                              : b.status === "UPCOMING"
                              ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                              : "bg-muted text-muted-foreground border"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              b.status === "ACTIVE"
                                ? "bg-emerald-500"
                                : b.status === "UPCOMING"
                                ? "bg-blue-500"
                                : "bg-muted-foreground"
                            }`}
                          />
                          <span>{b.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/batches/${b.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                          >
                            <FolderOpen className="h-3 w-3" />
                            <span>Enter</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBatchForDrawer(b)}
                            className="h-8 w-8 p-0"
                            title="Quick Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(b)}
                                className="h-8 w-8 p-0"
                                title="Edit Batch"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingBatch(b)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete Batch"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE BATCH MODAL (NO TARGET COURSE / PROGRAM) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-card border rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-lg font-bold text-foreground">Create New Class / Batch</h3>
                <p className="text-xs text-muted-foreground">
                  Configure classroom section, seat capacity, room, and faculty.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-foreground">
                    Class / Batch Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Class 11 — JEE Super-30 Morning Batch"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Batch Code *
                  </label>
                  <Input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. BAT-11-JEE-A"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Classroom / Room
                  </label>
                  <Input
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g. Lecture Hall 101"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Max Seat Capacity *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-foreground">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Faculty Checklist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-foreground">
                    Assign Faculty Instructors (Optional)
                  </label>
                  <span className="text-[10px] text-muted-foreground">Select instructors teaching this batch</span>
                </div>
                {teacherList.length === 0 ? (
                  <p className="p-3 border rounded-lg bg-muted/20 text-muted-foreground text-center">
                    No faculty accounts exist yet. You can assign faculty after adding teachers in Users module.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto border p-2 rounded-lg bg-muted/20">
                    {teacherList.map((t) => {
                      const isChecked = formData.selectedTeacherIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          className={`flex items-start justify-between gap-2 p-2 rounded-lg border transition-colors ${
                            isChecked
                              ? "bg-primary/10 border-primary/40"
                              : "bg-card border-input hover:bg-muted/40"
                          }`}
                        >
                          <label className="flex items-start gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTeacher(t.id)}
                              className="rounded border-input text-primary mt-0.5 shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="truncate text-xs font-semibold text-foreground">{t.name}</span>
                              <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                {t.subjects && t.subjects.length > 0 ? (
                                  t.subjects.map((ts: any) => (
                                    <span
                                      key={ts.id || ts.subjectId}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-primary/15 text-primary font-medium"
                                    >
                                      <BookOpen className="h-2.5 w-2.5" />
                                      {ts.subject?.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">
                                    No subject assigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              openAssignSubjects(t);
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 mt-0.5 transition-colors"
                            title="Assign or update subjects for this teacher"
                          >
                            + Subject
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Batch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BATCH MODAL (NO TARGET COURSE / PROGRAM) */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-card border rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-lg font-bold text-foreground">Edit Class / Batch</h3>
                <p className="text-xs text-muted-foreground">
                  Update section details, status, room allocation, and faculty.
                </p>
              </div>
              <button
                onClick={() => setEditingBatch(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-foreground">
                    Class / Batch Name *
                  </label>
                  <Input
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Batch Code *
                  </label>
                  <Input
                    required
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Status *
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Classroom / Room
                  </label>
                  <Input
                    value={editFormData.room}
                    onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Max Seat Capacity *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={editFormData.capacity}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, capacity: Number(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, startDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Faculty Checklist */}
              {teacherList.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-foreground">
                      Assign Faculty Instructors
                    </label>
                    <span className="text-[10px] text-muted-foreground">Select instructors teaching this batch</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto border p-2 rounded-lg bg-muted/20">
                    {teacherList.map((t) => {
                      const isChecked = editFormData.selectedTeacherIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          className={`flex items-start justify-between gap-2 p-2 rounded-lg border transition-colors ${
                            isChecked
                              ? "bg-primary/10 border-primary/40"
                              : "bg-card border-input hover:bg-muted/40"
                          }`}
                        >
                          <label className="flex items-start gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTeacher(t.id, true)}
                              className="rounded border-input text-primary mt-0.5 shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="truncate text-xs font-semibold text-foreground">{t.name}</span>
                              <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                {t.subjects && t.subjects.length > 0 ? (
                                  t.subjects.map((ts: any) => (
                                    <span
                                      key={ts.id || ts.subjectId}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-primary/15 text-primary font-medium"
                                    >
                                      <BookOpen className="h-2.5 w-2.5" />
                                      {ts.subject?.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">
                                    No subject assigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              openAssignSubjects(t);
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 mt-0.5 transition-colors"
                            title="Assign or update subjects for this teacher"
                          >
                            + Subject
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingBatch(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH DETAILS DRAWER */}
      {selectedBatchForDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="bg-card w-full max-w-md h-full border-l p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <Badge variant="outline" className="font-mono text-xs mb-1">
                    {selectedBatchForDrawer.code}
                  </Badge>
                  <h3 className="text-xl font-bold text-foreground">
                    {selectedBatchForDrawer.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedBatchForDrawer(null)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Enter Batch Action Banner */}
              <Link
                href={`/batches/${selectedBatchForDrawer.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-primary/90 transition-all"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Enter Full Batch Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              {/* Capacity Status */}
              <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Capacity & Occupancy
                </span>
                <div className="flex justify-between items-baseline">
                  <div className="text-2xl font-bold text-foreground">
                    {selectedBatchForDrawer._count?.enrollments || 0}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {selectedBatchForDrawer.capacity} Seats
                    </span>
                  </div>
                  <Badge
                    variant={selectedBatchForDrawer.status === "ACTIVE" ? "success" : "secondary"}
                    className="text-xs"
                  >
                    {selectedBatchForDrawer.status}
                  </Badge>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((selectedBatchForDrawer._count?.enrollments || 0) /
                            (selectedBatchForDrawer.capacity || 40)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Batch Metadata */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Classroom / Room:</span>
                  <span className="font-semibold">{selectedBatchForDrawer.room || "Not specified"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-semibold">{formatDate(selectedBatchForDrawer.startDate)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">End Date:</span>
                  <span className="font-semibold">{formatDate(selectedBatchForDrawer.endDate)}</span>
                </div>
              </div>

              {/* Assigned Faculty */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Assigned Faculty Instructors
                </h4>
                {selectedBatchForDrawer.teachers && selectedBatchForDrawer.teachers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedBatchForDrawer.teachers.map((tb: any, idx: number) => (
                      <div
                        key={tb.id || idx}
                        className="p-2.5 rounded-lg border bg-background flex items-center gap-3 text-xs"
                      >
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                          {tb.teacher?.name?.charAt(0) || "F"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{tb.teacher?.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {tb.teacher?.specialization || "Faculty"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No faculty assigned to this batch yet.
                  </p>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            {isAdmin && (
              <div className="pt-4 border-t flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => {
                    handleOpenEdit(selectedBatchForDrawer);
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  Edit Batch
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeletingBatch(selectedBatchForDrawer);
                  }}
                  className="text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK ASSIGN TEACHER SUBJECTS MODAL */}
      {assigningTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Assign Subjects: {assigningTeacherModal.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Select the academic subjects this faculty instructor teaches.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningTeacherModal(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Available Academic Subjects ({subjectsList.length})
                </label>
                <span className="text-[10px] text-muted-foreground">Select taught subjects</span>
              </div>

              {subjectsList.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-3 border rounded bg-muted/20 text-center">
                  No subjects configured in the system yet. Subjects are configured under the Courses module.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {subjectsList.map((s: any) => {
                    const isChecked = tempSubjectIds.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleTempSubject(s.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          isChecked
                            ? "border-primary bg-primary/15 text-primary font-semibold shadow-xs"
                            : "border-input bg-card hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-1">
                          <span className="text-xs truncate font-medium text-foreground">{s.name}</span>
                          <span className="text-[10px] opacity-75 font-mono">{s.code}</span>
                        </div>
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? "bg-primary border-primary text-white"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssigningTeacherModal(null)}
                disabled={isSavingSubjects}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveTeacherSubjects}
                disabled={isSavingSubjects}
                className="text-xs"
              >
                {isSavingSubjects ? "Saving..." : "Save Assigned Subjects"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-foreground">Delete Batch?</h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to delete <strong className="text-foreground">{deletingBatch.name}</strong> ({deletingBatch.code})?
                This will remove classroom records, schedules, and faculty links.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingBatch(null)}
                disabled={isPending}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="flex-1 text-xs"
              >
                {isPending ? "Deleting..." : "Yes, Delete Batch"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
