"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  BookOpen,
  Download,
  GraduationCap,
  MapPin,
  User,
  Search,
  ArrowLeft,
  CalendarDays,
  FileText,
  FileSpreadsheet,
  Video,
  File,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";

interface TimetableSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string | null;
    specialization: string | null;
    photoUrl?: string | null;
  };
}

interface StudyMaterial {
  id: string;
  title: string;
  description: string | null;
  fileType: string;
  fileUrl: string;
  fileSize: string | null;
  createdAt: Date | string;
  subject: {
    id: string;
    name: string;
    code: string;
  } | null;
  uploadedBy: {
    id: string;
    name: string;
  } | null;
}

interface TeacherBatch {
  teacher: {
    id: string;
    name: string;
    email: string | null;
    specialization: string | null;
    phone?: string | null;
    subjects?: {
      subject: {
        id: string;
        name: string;
        code: string;
      };
    }[];
  };
}

interface BatchData {
  id: string;
  name: string;
  code: string;
  room: string | null;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  course: {
    id: string;
    name: string;
    code: string;
  };
  timetableSlots: TimetableSlot[];
  allMaterials: StudyMaterial[];
  teachers: TeacherBatch[];
  _count?: {
    enrollments?: number;
    timetableSlots?: number;
    studyMaterials?: number;
  };
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

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const DAY_ORDER: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
};

export function PortalBatchDetail({ batch }: { batch: BatchData }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requestedTab = searchParams.get("tab");
  const activeTab: "timetable" | "materials" | "faculty" =
    requestedTab === "materials" ? "materials" : requestedTab === "faculty" ? "faculty" : "timetable";
  const setActiveTab = (tab: "timetable" | "materials" | "faculty") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Timetable Day Filter
  const todayDayName = useMemo(() => {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    return days[new Date().getDay()];
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>("ALL");

  // Study Materials Search & Filter
  const [materialSearch, setMaterialSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");

  // Extract unique subjects in materials
  const materialSubjects = useMemo(() => {
    const subjectsMap = new Map<string, string>();
    batch.allMaterials.forEach((m) => {
      if (m.subject) {
        subjectsMap.set(m.subject.id, m.subject.name);
      }
    });
    return Array.from(subjectsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [batch.allMaterials]);

  // Filtered Timetable Slots
  const sortedAndFilteredSlots = useMemo(() => {
    const slots = [...batch.timetableSlots];
    slots.sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.dayOfWeek] || 99) - (DAY_ORDER[b.dayOfWeek] || 99);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    if (selectedDay === "ALL") return slots;
    if (selectedDay === "TODAY") return slots.filter((s) => s.dayOfWeek === todayDayName);
    return slots.filter((s) => s.dayOfWeek === selectedDay);
  }, [batch.timetableSlots, selectedDay, todayDayName]);

  // Group slots by Day for the "ALL" view
  const slotsGroupedByDay = useMemo(() => {
    const grouped: Record<string, TimetableSlot[]> = {};
    DAYS_OF_WEEK.forEach((day) => {
      const daySlots = batch.timetableSlots
        .filter((s) => s.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (daySlots.length > 0) {
        grouped[day] = daySlots;
      }
    });
    return grouped;
  }, [batch.timetableSlots]);

  // Filtered Study Materials
  const filteredMaterials = useMemo(() => {
    return batch.allMaterials.filter((m) => {
      const matchesSearch =
        materialSearch.trim() === "" ||
        m.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(materialSearch.toLowerCase())) ||
        (m.subject && m.subject.name.toLowerCase().includes(materialSearch.toLowerCase()));

      const matchesSubject =
        selectedSubject === "ALL" || (m.subject && m.subject.id === selectedSubject);

      return matchesSearch && matchesSubject;
    });
  }, [batch.allMaterials, materialSearch, selectedSubject]);

  const activeDaysWithClasses = useMemo(() => {
    return new Set(batch.timetableSlots.map((s) => s.dayOfWeek));
  }, [batch.timetableSlots]);

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb / Back Bar ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/batches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Batches</span>
        </Link>

        <span className="text-[11px] font-mono text-zinc-500 uppercase">
          Batch Portal • {batch.code}
        </span>
      </div>

      {/* ── Batch Header Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-[#07090e] border border-white/10 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {batch.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/10 text-zinc-300 border border-white/15">
                {batch.code}
              </span>
              {batch.room && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {batch.room}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {batch.name}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Your active academic batch and learning workspace</span>
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center shrink-0">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 min-w-[90px]">
              <span className="text-lg sm:text-xl font-black text-indigo-400 block">
                {batch.timetableSlots.length}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                Lectures / Wk
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 min-w-[90px]">
              <span className="text-lg sm:text-xl font-black text-purple-400 block">
                {batch.allMaterials.length}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                Study Notes
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 min-w-[90px]">
              <span className="text-lg sm:text-xl font-black text-emerald-400 block">
                {batch.teachers.length}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                Faculty
              </span>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("timetable")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "timetable"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Weekly Timetable</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "timetable" ? "bg-white/20 text-white" : "bg-white/10 text-zinc-400"
              }`}
            >
              {batch.timetableSlots.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("materials")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "materials"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Study Material &amp; Notes</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "materials" ? "bg-white/20 text-white" : "bg-white/10 text-zinc-400"
              }`}
            >
              {batch.allMaterials.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("faculty")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "faculty"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Assigned Faculty</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "faculty" ? "bg-white/20 text-white" : "bg-white/10 text-zinc-400"
              }`}
            >
              {batch.teachers.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: WEEKLY TIMETABLE ── */}
      {activeTab === "timetable" && (
        <div className="space-y-6">
          {/* Day Selector Chips */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedDay("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  selectedDay === "ALL"
                    ? "bg-white text-zinc-900 font-bold"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                All Days
              </button>

              <button
                onClick={() => setSelectedDay("TODAY")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
                  selectedDay === "TODAY"
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Today ({DAY_LABELS[todayDayName]?.slice(0, 3)})</span>
              </button>

              {DAYS_OF_WEEK.map((day) => {
                const hasClasses = activeDaysWithClasses.has(day);
                const isSelected = selectedDay === day;
                const isToday = day === todayDayName;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5"
                    }`}
                  >
                    <span>{DAY_LABELS[day]}</span>
                    {hasClasses && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-white" : isToday ? "bg-amber-400" : "bg-indigo-400"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-zinc-400 font-mono">
              {sortedAndFilteredSlots.length}{" "}
              {sortedAndFilteredSlots.length === 1 ? "Class" : "Classes"} Scheduled
            </span>
          </div>

          {/* Slots List or Empty State */}
          {sortedAndFilteredSlots.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/5 text-center space-y-3">
              <CalendarDays className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Classes Scheduled</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                {selectedDay === "TODAY"
                  ? `You have no lectures scheduled for today (${DAY_LABELS[todayDayName]}). Take some time to review your notes!`
                  : selectedDay !== "ALL"
                  ? `No lectures scheduled for ${DAY_LABELS[selectedDay]}.`
                  : "The administration has not yet published timetable slots for this batch."}
              </p>
            </div>
          ) : selectedDay === "ALL" ? (
            /* Day-by-Day Grouped Layout for All Days */
            <div className="space-y-6">
              {Object.entries(slotsGroupedByDay).map(([day, daySlots]) => {
                const isToday = day === todayDayName;

                return (
                  <div
                    key={day}
                    className={`rounded-2xl border p-5 space-y-4 ${
                      isToday
                        ? "bg-indigo-950/20 border-indigo-500/30"
                        : "bg-white/[0.02] border-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {DAY_LABELS[day]}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            TODAY
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-zinc-400">
                        {daySlots.length} {daySlots.length === 1 ? "Lecture" : "Lectures"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {daySlots.map((slot) => (
                        <SlotCard key={slot.id} slot={slot} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat grid for single day filter */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedAndFilteredSlots.map((slot) => (
                <SlotCard key={slot.id} slot={slot} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: STUDY MATERIALS & NOTES ── */}
      {activeTab === "materials" && (
        <div className="space-y-6">
          {/* Controls: Search & Subject Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search notes, chapters, topics..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {materialSubjects.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="ALL" className="bg-[#0e121a]">
                    All Subjects ({batch.allMaterials.length})
                  </option>
                  {materialSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id} className="bg-[#0e121a]">
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Materials Grid or Empty State */}
          {filteredMaterials.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/5 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Study Materials Found</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                {materialSearch || selectedSubject !== "ALL"
                  ? "No materials match your search or filter criteria. Try clearing the filters."
                  : "No study notes, assignments, or PDFs have been uploaded to this batch yet. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((mat) => {
                const dateStr = new Date(mat.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={mat.id}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {mat.fileType || "PDF"}
                        </span>
                        {mat.fileSize && (
                          <span className="text-[10px] text-zinc-500 font-mono">{mat.fileSize}</span>
                        )}
                      </div>

                      <h3 className="font-bold text-white text-sm leading-snug group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {mat.title}
                      </h3>

                      {mat.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {mat.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] text-zinc-400">
                        {mat.subject && (
                          <div className="flex items-center justify-between">
                            <span>Subject:</span>
                            <span className="text-zinc-200 font-semibold">{mat.subject.name}</span>
                          </div>
                        )}
                        {mat.uploadedBy && (
                          <div className="flex items-center justify-between">
                            <span>Uploaded By:</span>
                            <span className="text-zinc-300 font-medium">{mat.uploadedBy.name}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-zinc-500">
                          <span>Added On:</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-indigo-600 text-zinc-200 hover:text-white border border-white/10 hover:border-indigo-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download / Open File</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: FACULTY & INSTRUCTORS ── */}
      {activeTab === "faculty" && (
        <div className="space-y-4">
          {batch.teachers.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/5 text-center space-y-3">
              <User className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Faculty Assigned</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                No faculty members are currently linked to this batch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batch.teachers.map(({ teacher }) => (
                <div
                  key={teacher.id}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-base shrink-0">
                      {teacher.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{teacher.name}</h4>
                      <p className="text-xs text-zinc-400">
                        {teacher.specialization || "Faculty Member"}
                      </p>
                    </div>
                  </div>

                  {teacher.subjects && teacher.subjects.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block">
                        Teaching Subjects:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.subjects.map(({ subject }) => (
                          <span
                            key={subject.id}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10"
                          >
                            {subject.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {teacher.email && (
                    <div className="text-[11px] text-zinc-400 pt-1">
                      <span className="text-zinc-500">Email: </span>
                      <span className="text-zinc-300 font-mono">{teacher.email}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Reusable Class / Lecture Slot Card
 */
function SlotCard({ slot }: { slot: TimetableSlot }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3 group">
      <div className="space-y-2">
        {/* Top: Time badge and Room */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              {slot.startTime} – {slot.endTime}
            </span>
          </div>

          <span className="text-[10px] font-medium text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1 shrink-0">
            <MapPin className="w-2.5 h-2.5 text-zinc-400" />
            {slot.room || "Lecture Hall"}
          </span>
        </div>

        {/* Subject Name and Code */}
        <div>
          <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
            {slot.subject.name}
          </h4>
          <span className="text-[11px] font-mono text-zinc-500">
            {slot.subject.code}
          </span>
        </div>
      </div>

      {/* Teacher / Instructor Info */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-200 shrink-0">
            {slot.teacher.name[0]}
          </div>
          <div>
            <span className="text-zinc-300 font-medium block leading-tight text-[11px]">
              {slot.teacher.name}
            </span>
            <span className="text-[10px] text-zinc-500 block">
              {slot.teacher.specialization || "Instructor"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

