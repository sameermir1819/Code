"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { assignTeacherSubjects } from "@/server/actions/academics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Mail,
  Phone,
  BookOpen,
  Layers,
  Search,
  Plus,
  Calendar,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  UserCheck,
  Clock,
  Settings2,
  Users,
} from "lucide-react";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

interface TeacherItem {
  id: string;
  teacherId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  qualification?: string | null;
  specialization?: string | null;
  subjects: {
    id: string;
    subjectId: string;
    subject: SubjectItem;
  }[];
  batches: {
    id: string;
    batchId: string;
    batch: {
      id: string;
      name: string;
      code: string;
    };
  }[];
  timetableSlots?: {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
}

interface FacultyManagerProps {
  initialTeachers: TeacherItem[];
  allSubjects: SubjectItem[];
  userRole?: string;
}

export function FacultyManager({
  initialTeachers,
  allSubjects,
  userRole = "ADMIN",
}: FacultyManagerProps) {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherItem[]>(initialTeachers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal: Assign Subjects to Faculty
  const [activeTeacher, setActiveTeacher] = useState<TeacherItem | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const handleOpenAssignModal = (teacher: TeacherItem) => {
    setActiveTeacher(teacher);
    setSelectedSubjectIds(teacher.subjects.map((s) => s.subjectId));
  };

  const handleSaveSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeacher) return;

    startTransition(async () => {
      try {
        const res = await assignTeacherSubjects({
          teacherId: activeTeacher.id,
          subjectIds: selectedSubjectIds,
        });

        if (res.success) {
          setFeedback({
            type: "success",
            message: `Subject specialization updated for ${activeTeacher.name}!`,
          });
          setActiveTeacher(null);
          router.refresh();
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to update subjects.",
        });
      }
    });
  };

  // Filter teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(search.toLowerCase()) ||
      (t.specialization && t.specialization.toLowerCase().includes(search.toLowerCase())) ||
      t.subjects.some((s) => s.subject.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;

    const matchesSubject =
      subjectFilter === "ALL" || t.subjects.some((s) => s.subjectId === subjectFilter);

    return matchesSearch && matchesStatus && matchesSubject;
  });

  // Aggregated Stats
  const totalFaculty = teachers.length;
  const activeFacultyCount = teachers.filter((t) => t.status === "ACTIVE").length;
  const totalBatchesAssigned = new Set(
    teachers.flatMap((t) => t.batches.map((b) => b.batchId))
  ).size;
  const totalSubjectsTaught = new Set(
    teachers.flatMap((t) => t.subjects.map((s) => s.subjectId))
  ).size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Faculty &amp; Instructors
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage teaching staff profiles, academic specializations, and batch assignments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/batches">
            <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold cursor-pointer">
              <Layers className="h-4 w-4 text-purple-500" />
              <span>View Batches</span>
            </Button>
          </Link>

          <Link href="/dashboard/users?role=TEACHER">
            <Button size="sm" className="gap-2 text-xs font-semibold cursor-pointer shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Add New Faculty</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Faculty
              </p>
              <h3 className="text-xl font-bold text-foreground">{totalFaculty}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Active Staff
              </p>
              <h3 className="text-xl font-bold text-foreground">{activeFacultyCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Batches Covered
              </p>
              <h3 className="text-xl font-bold text-foreground">{totalBatchesAssigned}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Subjects Taught
              </p>
              <h3 className="text-xl font-bold text-foreground">{totalSubjectsTaught}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 rounded-2xl shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty by name, ID, subject, or specialization..."
              className="pl-9 text-xs h-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Subjects</option>
              {allSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Faculty Cards Grid */}
      {filteredTeachers.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-2xl">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-bold text-base text-foreground">No faculty members found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "ALL" || subjectFilter !== "ALL"
              ? "Try adjusting your search criteria or filter options."
              : "No teaching faculty members have been registered in the institute yet."}
          </p>
          <Link href="/dashboard/users?role=TEACHER" className="inline-block mt-4">
            <Button size="sm" className="gap-2 text-xs font-semibold cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>Add First Faculty Member</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => {
            const cleanInitials = teacher.name
              .replace("Dr. ", "")
              .replace("Er. ", "")
              .replace("Prof. ", "")
              .trim()
              .charAt(0)
              .toUpperCase();

            const weeklySlotsCount = teacher.timetableSlots?.length || 0;

            return (
              <Card
                key={teacher.id}
                className="rounded-2xl shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center text-base shrink-0 shadow-inner">
                        {cleanInitials || "F"}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-bold text-foreground truncate">
                          {teacher.name}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground font-semibold font-mono mt-0.5">
                          {teacher.teacherId}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={teacher.status === "ACTIVE" ? "default" : "secondary"}
                      className={`text-[10px] font-semibold uppercase ${
                        teacher.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : ""
                      }`}
                    >
                      {teacher.status}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3 text-xs">
                    {/* Qualification & Specialization */}
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Qualification:</span>
                        <strong className="text-foreground">{teacher.qualification || "Faculty Staff"}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Specialization:</span>
                        <strong className="text-primary truncate max-w-[170px]" title={teacher.specialization || "General"}>
                          {teacher.specialization || "General"}
                        </strong>
                      </div>
                    </div>

                    {/* Subjects Taught */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Subjects Taught ({teacher.subjects.length})
                        </span>
                        <button
                          onClick={() => handleOpenAssignModal(teacher)}
                          className="text-[11px] text-primary hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Settings2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.length > 0 ? (
                          teacher.subjects.map((ts) => (
                            <Badge
                              key={ts.id}
                              variant="secondary"
                              className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-medium"
                            >
                              {ts.subject.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            No subjects assigned yet
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Batches Assigned */}
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Assigned Batches ({teacher.batches.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {teacher.batches.length > 0 ? (
                          teacher.batches.map((tb) => (
                            <Link
                              key={tb.id}
                              href={`/dashboard/batches/${tb.batch.id}`}
                              className="inline-block"
                            >
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-semibold hover:underline inline-flex items-center gap-1">
                                <Layers className="h-2.5 w-2.5" />
                                <span>{tb.batch.name}</span>
                              </span>
                            </Link>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Not assigned to any batch
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Workload & Contact */}
                    <div className="pt-2 border-t grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-muted/30 p-2 rounded-lg flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Workload:</span>
                          <strong className="text-foreground">{weeklySlotsCount} Classes/Wk</strong>
                        </div>
                      </div>

                      <div className="bg-muted/30 p-2 rounded-lg flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-muted-foreground block">Phone:</span>
                          <strong className="text-foreground truncate block">{teacher.phone || "N/A"}</strong>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Bottom Action Footer */}
                <CardContent className="p-4 pt-0">
                  <div className="pt-3 border-t flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {teacher.phone && (
                        <a
                          href={`https://wa.me/${teacher.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Hello ${teacher.name}, message from Futurex Learning Administration.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}

                      {teacher.email && (
                        <a
                          href={`mailto:${teacher.email}`}
                          className="p-1.5 rounded-lg border bg-muted/50 text-muted-foreground hover:text-foreground text-[11px] transition-colors"
                          title="Send Email"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAssignModal(teacher)}
                        className="h-7 text-[11px] font-semibold text-primary hover:bg-primary/10 px-2 cursor-pointer gap-1"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>Subjects</span>
                      </Button>

                      <Link href={`/timetable`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                        >
                          <span>Timetable</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── MODAL: ASSIGN SUBJECTS TO FACULTY ── */}
      {activeTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Assign Subjects to {activeTeacher.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select curriculum subjects taught by this faculty member.
                </p>
              </div>
              <button
                onClick={() => setActiveTeacher(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubjects} className="space-y-4 text-xs">
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {allSubjects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No curriculum subjects found.</p>
                ) : (
                  allSubjects.map((sub) => {
                    const isChecked = selectedSubjectIds.includes(sub.id);

                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubjectIds((prev) =>
                            isChecked ? prev.filter((id) => id !== sub.id) : [...prev, sub.id]
                          );
                        }}
                        className={`pt-2 pb-2 px-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <div>
                            <span className="font-semibold text-foreground text-xs block">{sub.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{sub.code}</span>
                          </div>
                        </div>

                        <Badge variant="outline" className="font-mono text-[10px]">
                          {sub.code}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-[11px] text-muted-foreground">
                  {selectedSubjectIds.length} subjects selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTeacher(null)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isPending} className="cursor-pointer">
                    {isPending ? "Saving..." : "Save Subjects"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

