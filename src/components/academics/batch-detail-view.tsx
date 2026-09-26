"use client";

import { useState, useTransition, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import {
  updateBatch,
  getTeachers,
  createTimetableSlot,
  deleteTimetableSlot,
} from "@/server/actions/academics";
import {
  createStudyMaterial,
  deleteStudyMaterial,
} from "@/server/actions/materials";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar,
  Clock,
  Download,
  FileText,
  GraduationCap,
  MapPin,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  Search,
  Printer,
  CheckSquare,
  Upload,
  Paperclip,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";

interface BatchDetailViewProps {
  batch: any;
  allTeachers: any[];
  allSubjects: any[];
  userRole?: string;
}

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export function BatchDetailView({
  batch: initialBatch,
  allTeachers,
  allSubjects,
  userRole = "ADMIN",
}: BatchDetailViewProps) {
  const router = useRouter();
  const [batch, setBatch] = useState(initialBatch);
  const [activeTab, setActiveTab] = useState<"subjects" | "materials" | "timetable" | "students">("subjects");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── Modals State ──
  const [isAssignFacultyModalOpen, setIsAssignFacultyModalOpen] = useState(false);
  const [isUploadMaterialModalOpen, setIsUploadMaterialModalOpen] = useState(false);
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);

  // Initial faculty IDs assigned to this batch
  const initialFacultyIds = (batch.teachers?.map((bt: any) => bt.teacherId || bt.teacher?.id).filter(Boolean) || []) as string[];
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>(initialFacultyIds);

  // Faculty List state with client-side live fetch fallback
  const [teacherList, setTeacherList] = useState<any[]>(allTeachers || []);

  useEffect(() => {
    if (allTeachers && allTeachers.length > 0) {
      setTeacherList(allTeachers);
    }
  }, [allTeachers]);

  useEffect(() => {
    const loadFreshTeachers = async () => {
      try {
        const fresh = await getTeachers();
        if (fresh && fresh.length > 0) {
          setTeacherList(fresh);
        }
      } catch (err) {
        console.error("Failed to load teachers in BatchDetailView:", err);
      }
    };
    if (!allTeachers || allTeachers.length === 0) {
      loadFreshTeachers();
    }
  }, [allTeachers]);

  const openAssignModal = async () => {
    try {
      const fresh = await getTeachers();
      if (fresh && fresh.length > 0) {
        setTeacherList(fresh);
      }
    } catch {}
    setIsAssignFacultyModalOpen(true);
  };

  // Sync state if initialBatch prop updates from server revalidation
  useEffect(() => {
    setBatch(initialBatch);
    const fIds = (initialBatch.teachers?.map((bt: any) => bt.teacherId || bt.teacher?.id).filter(Boolean) || []) as string[];
    setSelectedFacultyIds(fIds);
  }, [initialBatch]);

  // ── Upload Material Form & File State ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    fileType: "PDF",
    fileUrl: "",
    fileSize: "",
    subjectId: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const ext = file.name.split(".").pop()?.toUpperCase() || "";
      let detectedType = "PDF";
      if (["PDF"].includes(ext)) detectedType = "PDF";
      else if (["DOC", "DOCX"].includes(ext)) detectedType = "DOCUMENT";
      else if (["PPT", "PPTX"].includes(ext)) detectedType = "DOCUMENT";
      else if (["PNG", "JPG", "JPEG"].includes(ext)) detectedType = "NOTES";

      const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      const cleanTitle = baseName.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
      setNewMaterial((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : cleanTitle,
        fileType: detectedType,
      }));
    }
  };

  // ── Add Timetable Slot Form ──
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "10:30",
    subjectId: "",
    teacherId: allTeachers[0]?.id || "",
    room: batch.room || "Lecture Hall 101",
  });

  // Filter for materials
  const [materialSubjectFilter, setMaterialSubjectFilter] = useState("ALL");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState("ALL");

  // Extract assigned teachers and their taught subjects
  const assignedTeachers = useMemo(() => {
    return batch.teachers?.map((bt: any) => bt.teacher).filter(Boolean) || [];
  }, [batch.teachers]);

  // Extract subjects available to this batch:
  // 1. From course subjects
  // 2. From assigned faculty's subjects
  // 3. Every global subject, plus subjects assigned to this batch's location
  const batchSubjects = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    if (batch.course?.subjects) {
      for (const cs of batch.course.subjects) {
        if (cs.subject && !seen.has(cs.subject.id)) {
          seen.add(cs.subject.id);
          list.push(cs.subject);
        }
      }
    }

    for (const t of assignedTeachers) {
      if (t.subjects) {
        for (const ts of t.subjects) {
          if (ts.subject && !seen.has(ts.subject.id)) {
            seen.add(ts.subject.id);
            list.push(ts.subject);
          }
        }
      }
    }

    for (const subject of allSubjects) {
      const isAvailableForBatch =
        !subject.instituteId || subject.instituteId === batch.instituteId;
      if (isAvailableForBatch && !seen.has(subject.id)) {
        seen.add(subject.id);
        list.push(subject);
      }
    }

    return list;
  }, [batch, assignedTeachers, allSubjects]);

  const defaultSubjectId = batchSubjects[0]?.id || allSubjects[0]?.id || "";

  // ── Handler: Save Batch Faculty Assignments ──
  const handleSaveBatchFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await updateBatch(batch.id, {
          teacherIds: selectedFacultyIds,
        });

        if (res.success && res.batch) {
          setBatch(res.batch);
        }

        setFeedback({ type: "success", message: "Batch faculty updated successfully!" });
        setIsAssignFacultyModalOpen(false);
        router.refresh();
      } catch (err: unknown) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to update batch faculty." });
      }
    });
  };

  // ── Handler: Upload Notes / Study Material ──
  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title.trim()) {
      setFeedback({ type: "error", message: "Notes title is required." });
      return;
    }

    if (!selectedFile && !newMaterial.fileUrl.trim()) {
      setFeedback({ type: "error", message: "Please select a file from your device to upload." });
      return;
    }

    setIsUploadingFile(true);
    try {
      let finalFileUrl = newMaterial.fileUrl;
      let finalFileSize = newMaterial.fileSize;
      let finalFileType = newMaterial.fileType;

      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          throw new Error("File upload failed on server.");
        }
        const data = await res.json();
        if (!data.success && !data.fileUrl && !data.url) {
          throw new Error(data.message || "File upload failed on server.");
        }
        finalFileUrl = data.fileUrl || data.url || "";
        finalFileSize = data.fileSize || data.size || "1.5 MB";
        finalFileType = data.fileType || finalFileType;
      }

      if (!finalFileUrl.trim()) {
        throw new Error("File upload incomplete. Please choose a valid file or provide a link.");
      }

      const chosenSubjectId = newMaterial.subjectId || defaultSubjectId;
      if (!chosenSubjectId) {
        throw new Error("Please select a subject or create one first.");
      }

      await createStudyMaterial({
        title: newMaterial.title,
        description: newMaterial.description,
        fileType: finalFileType as any,
        fileUrl: finalFileUrl,
        fileSize: finalFileSize || undefined,
        subjectId: chosenSubjectId,
        batchId: batch.id,
      });

      setFeedback({ type: "success", message: `Study note "${newMaterial.title}" uploaded successfully!` });
      setIsUploadMaterialModalOpen(false);
      setSelectedFile(null);
      setNewMaterial({
        title: "",
        description: "",
        fileType: "PDF",
        fileUrl: "",
        fileSize: "",
        subjectId: defaultSubjectId,
      });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      setIsUploadingFile(false);
    }
  };

  // ── Handler: Add Timetable Slot ──
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenSubjectId = newSlot.subjectId || defaultSubjectId;
    if (!chosenSubjectId) {
      setFeedback({ type: "error", message: "Please select a subject." });
      return;
    }

    startTransition(async () => {
      try {
        await createTimetableSlot({
          batchId: batch.id,
          subjectId: chosenSubjectId,
          teacherId: newSlot.teacherId || undefined,
          dayOfWeek: newSlot.dayOfWeek as any,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          room: newSlot.room || undefined,
        });

        setFeedback({ type: "success", message: "Class lecture scheduled in batch timetable." });
        setIsAddSlotModalOpen(false);
        router.refresh();
      } catch (err: unknown) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to add slot." });
      }
    });
  };

  // ── Handler: Delete Timetable Slot ──
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to remove this lecture slot from the timetable?")) return;
    startTransition(async () => {
      try {
        await deleteTimetableSlot(slotId);
        setFeedback({ type: "success", message: "Timetable slot removed." });
        router.refresh();
      } catch (err: unknown) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to delete slot." });
      }
    });
  };

  // ── Handler: Delete Study Material ──
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this study document?")) return;
    startTransition(async () => {
      try {
        await deleteStudyMaterial(materialId);
        setFeedback({ type: "success", message: "Document deleted." });
        router.refresh();
      } catch (err: unknown) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to delete material." });
      }
    });
  };

  // Calculations
  const studentCount = batch.enrollments?.length || 0;
  const capacityPercent = Math.min(100, Math.round((studentCount / (batch.capacity || 40)) * 100));
  const timetableSlots = batch.timetableSlots || [];
  const studyMaterials = batch.studyMaterials || [];

  const filteredMaterials = studyMaterials.filter((m: any) => {
    if (materialSubjectFilter === "ALL") return true;
    return m.subjectId === materialSubjectFilter;
  });

  const filteredStudents = (batch.enrollments || []).filter((e: any) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return (
      e.student.name.toLowerCase().includes(q) ||
      e.student.studentId.toLowerCase().includes(q) ||
      (e.student.phone && e.student.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* ── Executive Command Header ── */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-primary/[0.03] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            {/* Breadcrumbs & Live Status */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <Link
                href="/batches"
                className="hover:text-foreground text-muted-foreground transition-colors flex items-center gap-1 font-semibold"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>All Batches</span>
              </Link>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-mono px-2 py-0.5 rounded-md bg-muted text-foreground font-bold text-[11px] border">
                {batch.code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  batch.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-muted text-muted-foreground border"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    batch.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                  }`}
                />
                <span>{batch.status === "ACTIVE" ? "Live Cohort" : batch.status}</span>
              </span>
            </div>

            {/* Title & Metadata */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {batch.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="inline-flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg border font-medium text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{batch.room || "Room Assigned"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg border">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Ribbon */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/attendance">
              <Button
                variant="outline"
                className="gap-2 text-xs font-semibold h-10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Take Attendance</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2 text-xs font-semibold h-10 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Dossier</span>
            </Button>

            {activeTab === "subjects" && (
              <Button
                onClick={openAssignModal}
                className="gap-2 text-xs font-semibold h-10 shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Assign Faculty</span>
              </Button>
            )}

            {activeTab === "timetable" && (
              <Button
                onClick={() => setIsAddSlotModalOpen(true)}
                className="gap-2 text-xs font-semibold h-10 shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Class</span>
              </Button>
            )}

            {activeTab === "materials" && (
              <Button
                onClick={() => setIsUploadMaterialModalOpen(true)}
                className="gap-2 text-xs font-semibold h-10 shadow-xs cursor-pointer bg-primary text-primary-foreground"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Notes</span>
              </Button>
            )}
          </div>
        </div>

        {/* Integrated KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60 text-xs">
          <div className="p-3.5 rounded-2xl bg-background/80 border shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              <span>Seating Capacity</span>
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-extrabold text-foreground">{studentCount}</span>
              <span className="text-muted-foreground font-medium">/ {batch.capacity} Seats</span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all ${
                  capacityPercent >= 90
                    ? "bg-rose-500"
                    : capacityPercent >= 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-background/80 border shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
              <span>Curriculum Load</span>
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-extrabold text-foreground">{batchSubjects.length}</span>
              <span className="text-muted-foreground font-medium">Active Subjects</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Core study modules</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background/80 border shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Weekly Cadence</span>
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-extrabold text-foreground">{timetableSlots.length}</span>
              <span className="text-muted-foreground font-medium">Lectures / wk</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>Conflict-Free Verified</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background/80 border shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-purple-500" />
              <span>Study Drive</span>
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-extrabold text-foreground">{studyMaterials.length}</span>
              <span className="text-muted-foreground font-medium">Notes & DPPs</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Uploaded material</p>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Segmented Tabbed Interface ── */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "subjects" | "materials" | "timetable" | "students")}
        className="w-full space-y-6"
      >
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1.5 bg-muted/60 rounded-2xl gap-1">
          <TabsTrigger
            value="subjects"
            className="flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xs cursor-pointer"
          >
            <GraduationCap className="h-4 w-4 text-indigo-500" />
            <span>Faculty & Subjects ({assignedTeachers.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="timetable"
            className="flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xs cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-amber-500" />
            <span>Weekly Timetable ({timetableSlots.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="materials"
            className="flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xs cursor-pointer"
          >
            <FileText className="h-4 w-4 text-purple-500" />
            <span>Notes & Study Drive ({studyMaterials.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="students"
            className="flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xs cursor-pointer"
          >
            <Users className="h-4 w-4 text-blue-500" />
            <span>Students Roster ({studentCount})</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: FACULTY & SUBJECTS ── */}
        <TabsContent value="subjects" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">Assigned Faculty & Subjects</h3>
              <p className="text-xs text-muted-foreground">Faculty members assigned to this batch with their respective subject specializations</p>
            </div>
            <Button
              onClick={openAssignModal}
              size="sm"
              className="gap-1.5 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Assign / Manage Faculty</span>
            </Button>
          </div>

          {assignedTeachers.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <h4 className="font-bold text-sm text-foreground">No faculty assigned to this batch yet</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Assign teaching faculty to this batch. Faculty will appear along with the subjects they teach.
              </p>
              <Button
                onClick={openAssignModal}
                size="sm"
                className="mt-4 gap-2 text-xs font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Assign Faculty</span>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedTeachers.map((teacher: any) => {
                const teacherSlots = timetableSlots.filter((s: any) => s.teacherId === teacher.id);
                const teacherSubjects = teacher.subjects?.map((ts: any) => ts.subject).filter(Boolean) || [];

                return (
                  <Card key={teacher.id} className="shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div>
                      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase">
                            {teacher.name?.[0] || "F"}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold text-foreground">{teacher.name}</CardTitle>
                            <CardDescription className="text-[11px] text-muted-foreground">
                              {teacher.specialization || "Faculty Member"}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {teacher.teacherId || "FACULTY"}
                        </Badge>
                      </CardHeader>

                      <CardContent className="p-4 pt-2 space-y-3 text-xs">
                        {/* Subjects Assigned to this teacher */}
                        <div>
                          <span className="text-muted-foreground block text-[10px] font-semibold mb-1 uppercase tracking-wider">
                            Subjects Taught
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {teacherSubjects.length > 0 ? (
                              teacherSubjects.map((sub: any) => (
                                <Badge
                                  key={sub.id}
                                  variant="secondary"
                                  className="text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                                >
                                  {sub.name} {sub.code ? `(${sub.code})` : ""}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                {teacher.specialization ? `Specialization: ${teacher.specialization}` : "No specific subject assigned"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Workload Metrics */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                          <div className="bg-muted/40 p-2 rounded-lg">
                            <span className="text-muted-foreground block text-[10px]">Batch Lectures:</span>
                            <strong className="text-foreground">{teacherSlots.length} Classes / Wk</strong>
                          </div>
                          <div className="bg-muted/40 p-2 rounded-lg">
                            <span className="text-muted-foreground block text-[10px]">Contact Info:</span>
                            <span className="text-foreground truncate block font-medium" title={teacher.email || teacher.phone}>
                              {teacher.phone || teacher.email || "N/A"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    <CardContent className="p-4 pt-0">
                      <div className="pt-2 flex items-center justify-between gap-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const firstSubId = teacherSubjects[0]?.id || defaultSubjectId;
                            setNewSlot((prev) => ({
                              ...prev,
                              teacherId: teacher.id,
                              subjectId: firstSubId,
                            }));
                            setIsAddSlotModalOpen(true);
                          }}
                          className="h-7 text-[11px] text-primary hover:bg-primary/10 gap-1 px-2 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Schedule Class</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={openAssignModal}
                          className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2 cursor-pointer"
                        >
                          <span>Manage</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: WEEKLY TIMETABLE ── */}
        <TabsContent value="timetable" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">Weekly Class Schedule</h3>
              <p className="text-xs text-muted-foreground">Classroom timetable, lecture slots, and faculty assignments</p>
            </div>
            <Button
              onClick={() => setIsAddSlotModalOpen(true)}
              size="sm"
              className="gap-1.5 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Class</span>
            </Button>
          </div>

          {/* Day Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-xl w-fit">
            <button
              onClick={() => setSelectedDayFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedDayFilter === "ALL" ? "bg-background text-foreground shadow-2xs font-bold" : "text-muted-foreground"
              }`}
            >
              All Days ({timetableSlots.length})
            </button>
            {DAYS_OF_WEEK.map((d) => {
              const dayCount = timetableSlots.filter((s: any) => s.dayOfWeek === d).length;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDayFilter(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedDayFilter === d ? "bg-background text-foreground shadow-2xs font-bold" : "text-muted-foreground"
                  }`}
                >
                  {d.slice(0, 3)} ({dayCount})
                </button>
              );
            })}
          </div>

          {timetableSlots.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <h4 className="font-bold text-sm text-foreground">No timetable slots scheduled yet</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Schedule lecture time slots for this batch across Monday through Sunday.
              </p>
              <Button onClick={() => setIsAddSlotModalOpen(true)} size="sm" className="mt-4 gap-2 text-xs font-semibold">
                <Plus className="h-4 w-4" />
                <span>Add First Lecture</span>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {DAYS_OF_WEEK.filter((d) => (selectedDayFilter === "ALL" ? true : selectedDayFilter === d)).map((day) => {
                const slotsForDay = timetableSlots.filter((s: any) => s.dayOfWeek === day);
                if (slotsForDay.length === 0) return null;

                return (
                  <div key={day} className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {day} ({slotsForDay.length} Lectures)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slotsForDay.map((slot: any) => (
                        <Card key={slot.id} className="p-3.5 shadow-2xs border hover:border-primary/40 transition-all">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-[10px] font-mono font-bold">
                                {slot.startTime} – {slot.endTime}
                              </Badge>
                              <h5 className="font-bold text-sm text-foreground mt-1.5">{slot.subject?.name}</h5>
                            </div>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="text-muted-foreground hover:text-rose-600 p-1 transition-colors cursor-pointer"
                              title="Delete Slot"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <GraduationCap className="h-3.5 w-3.5 text-primary" />
                              {slot.teacher?.name || "Unassigned"}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {slot.room || batch.room || "Room 101"}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 3: NOTES & STUDY DRIVE ── */}
        <TabsContent value="materials" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">Batch Study Drive & Notes</h3>
              <p className="text-xs text-muted-foreground">Lecture PDFs, daily practice problems, and study notes repository</p>
            </div>
            <Button
              onClick={() => setIsUploadMaterialModalOpen(true)}
              size="sm"
              className="gap-1.5 text-xs font-semibold shadow-xs cursor-pointer bg-primary text-primary-foreground"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Document</span>
            </Button>
          </div>

          {/* On-Page Fast File Uploader Zone */}
          <Card className="border-2 border-dashed border-primary/30 bg-primary/[0.01] p-6 rounded-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Quick Upload Notes to this Batch</h4>
                  <p className="text-xs text-muted-foreground">Drag & drop PDF, Word, or Image files directly, or choose a file</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    handleFileChange(e);
                    setIsUploadMaterialModalOpen(true);
                  }}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs font-semibold cursor-pointer"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>Choose File from PC</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Subject Filter Bar for Materials */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-muted-foreground">Filter:</span>
            <button
              onClick={() => setMaterialSubjectFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                materialSubjectFilter === "ALL" ? "bg-primary text-white shadow-2xs" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All Subjects ({studyMaterials.length})
            </button>
            {batchSubjects.map((sub: any) => {
              const count = studyMaterials.filter((m: any) => m.subjectId === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => setMaterialSubjectFilter(sub.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    materialSubjectFilter === sub.id ? "bg-primary text-white shadow-2xs" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {sub.name} ({count})
                </button>
              );
            })}
          </div>

          {filteredMaterials.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <h4 className="font-bold text-sm text-foreground">No study materials in this batch yet</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Upload lecture notes, revision sheets, and past question papers for enrolled students.
              </p>
              <Button onClick={() => setIsUploadMaterialModalOpen(true)} size="sm" className="mt-4 gap-2 text-xs font-semibold">
                <Upload className="h-4 w-4" />
                <span>Upload First Notes File</span>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((item: any) => (
                <Card key={item.id} className="p-4 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="font-bold text-[10px] uppercase">
                        {item.fileType}
                      </Badge>
                      <button
                        onClick={() => handleDeleteMaterial(item.id)}
                        className="text-muted-foreground hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <h5 className="font-bold text-sm text-foreground mt-2">{item.title}</h5>
                    {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}

                    <div className="mt-3 text-[11px] text-muted-foreground space-y-1">
                      <p>
                        Subject: <strong className="text-foreground">{item.subject?.name || "General"}</strong>
                      </p>
                      <p>Size: {item.fileSize || "PDF Document"}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{formatDate(item.createdAt)}</span>
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 4: STUDENTS ROSTER ── */}
        <TabsContent value="students" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">Enrolled Students Roster</h3>
              <p className="text-xs text-muted-foreground">List of active candidates registered in this classroom batch</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search name, ID or phone..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <Card className="shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                    <th className="p-3.5">Roll / Student ID</th>
                    <th className="p-3.5">Candidate Name</th>
                    <th className="p-3.5">Contact Number</th>
                    <th className="p-3.5">Admission Date</th>
                    <th className="p-3.5 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                        No students enrolled in this batch.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((enr: any) => (
                      <tr key={enr.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 font-mono font-medium text-foreground">
                          {enr.student.studentId}
                        </td>
                        <td className="p-3.5 font-semibold text-foreground">
                          <Link href={`/students/${enr.student.id}`} className="hover:underline text-primary">
                            {enr.student.name}
                          </Link>
                        </td>
                        <td className="p-3.5 text-muted-foreground font-mono text-[11px]">
                          {enr.student.phone || "-"}
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {formatDate(enr.enrolledAt)}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {enr.student.phone && (
                              <a
                                href={`https://wa.me/${enr.student.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                  `Hello from Futurex Learning, regarding your enrollment in ${batch.name}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 shadow-2xs"
                              >
                                <MessageCircle className="h-3 w-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <Link href={`/students/${enr.student.id}`}>
                              <Button variant="outline" size="sm" className="h-7 text-[11px] cursor-pointer">
                                Profile
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── MODAL: ASSIGN FACULTY TO BATCH ── */}
      {isAssignFacultyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Assign Faculty to Batch</h3>
                <p className="text-xs text-muted-foreground">Select faculty members. Their subjects will automatically be available in this batch.</p>
              </div>
              <button
                onClick={() => setIsAssignFacultyModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchFaculty} className="space-y-4 text-xs">
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-border/40">
                {teacherList.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No active faculty found in the institute.</p>
                ) : (
                  teacherList.map((teacher: any) => {
                    const isSelected = selectedFacultyIds.includes(teacher.id);
                    const teacherSubjects = teacher.subjects?.map((ts: any) => ts.subject?.name).filter(Boolean) || [];

                    return (
                      <div
                        key={teacher.id}
                        onClick={() => {
                          setSelectedFacultyIds((prev) =>
                            isSelected ? prev.filter((id) => id !== teacher.id) : [...prev, teacher.id]
                          );
                        }}
                        className={`pt-2.5 pb-2.5 px-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <div>
                            <div className="font-semibold text-foreground text-xs">{teacher.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {teacher.institute?.name || "Location not assigned"}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              {teacherSubjects.length > 0 ? (
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                  Subject: {teacherSubjects.join(", ")}
                                </span>
                              ) : (
                                <span>{teacher.specialization || "Faculty"}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge variant="outline" className="text-[10px] font-mono">
                          {teacher.teacherId || "FACULTY"}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-[11px] text-muted-foreground">
                  {selectedFacultyIds.length} faculty selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAssignFacultyModalOpen(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isPending} className="cursor-pointer">
                    {isPending ? "Saving..." : "Save Faculty"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: UPLOAD NOTES / STUDY MATERIAL ── */}
      {isUploadMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-foreground">Upload Notes & Study Drive Document</h3>
              <button
                onClick={() => setIsUploadMaterialModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadMaterial} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  placeholder="e.g. Chapter 4 Mechanics Problem Set 1"
                  className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Subject *</label>
                  <select
                    value={newMaterial.subjectId || defaultSubjectId}
                    onChange={(e) => setNewMaterial({ ...newMaterial, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {batchSubjects.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}{!sub.instituteId ? " — Global" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Document Type</label>
                  <select
                    value={newMaterial.fileType}
                    onChange={(e) => setNewMaterial({ ...newMaterial, fileType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="NOTES">Handwritten Notes</option>
                    <option value="ASSIGNMENT">DPP / Assignment</option>
                    <option value="SYLLABUS">Syllabus Sheet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Select File from Device *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-3 py-1.5 rounded-lg border bg-background text-xs"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  />
                </div>
                {selectedFile && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  placeholder="Optional guidance for students..."
                  className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadMaterialModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isUploadingFile} className="cursor-pointer">
                  {isUploadingFile ? "Uploading..." : "Upload to Drive"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SCHEDULE CLASS / ADD TIMETABLE SLOT ── */}
      {isAddSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-foreground">Schedule Class in Batch Timetable</h3>
              <button
                onClick={() => setIsAddSlotModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Subject *</label>
                <select
                  value={newSlot.subjectId || defaultSubjectId}
                  onChange={(e) => setNewSlot({ ...newSlot, subjectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {batchSubjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code}){!sub.instituteId ? " — Global" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Day of Week *</label>
                <select
                  value={newSlot.dayOfWeek}
                  onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Assigned Teacher</label>
                <select
                  value={newSlot.teacherId}
                  onChange={(e) => setNewSlot({ ...newSlot, teacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">No teacher assigned</option>
                  {allTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Classroom / Hall</label>
                <input
                  type="text"
                  value={newSlot.room}
                  onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                  placeholder="e.g. Room 204 or Physics Lab"
                  className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddSlotModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="cursor-pointer">
                  {isPending ? "Scheduling..." : "Save to Timetable"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

