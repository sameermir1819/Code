"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  Building2,
  ChevronRight,
  User,
  Sparkles,
  MapPin,
  CalendarDays,
  Layers,
  ArrowRight,
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
    specialization: string | null;
  };
}

interface TeacherBatch {
  teacher: {
    id: string;
    name: string;
    specialization: string | null;
    subjects?: {
      subject: {
        id: string;
        name: string;
        code: string;
      };
    }[];
  };
}

interface EnrollmentData {
  id: string;
  course: {
    id: string;
    name: string;
    code: string;
  };
  batch: {
    id: string;
    name: string;
    code: string;
    room: string | null;
    status: string;
    startDate: Date | string;
    endDate: Date | string;
    teachers: TeacherBatch[];
    timetableSlots: TimetableSlot[];
    _count?: {
      timetableSlots?: number;
      studyMaterials?: number;
    };
  };
}

interface PortalBatchesViewProps {
  enrollments: EnrollmentData[];
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

export function PortalBatchesView({ enrollments }: PortalBatchesViewProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = searchParams.get("tab") === "timetable" ? "timetable" : "batches";
  const setActiveTab = (tab: "batches" | "timetable") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Today's day name
  const todayDayName = useMemo(() => {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    return days[new Date().getDay()];
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>("ALL");

  // Flatten all timetable slots across all enrolled batches
  const allSlots = useMemo(() => {
    return enrollments.flatMap((enr) =>
      enr.batch.timetableSlots.map((slot) => ({
        ...slot,
        batchName: enr.batch.name,
        batchId: enr.batch.id,
        courseName: enr.course.name,
      }))
    );
  }, [enrollments]);

  // Filtered & sorted slots for unified timetable
  const sortedAndFilteredSlots = useMemo(() => {
    const slots = [...allSlots];
    slots.sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.dayOfWeek] || 99) - (DAY_ORDER[b.dayOfWeek] || 99);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    if (selectedDay === "ALL") return slots;
    if (selectedDay === "TODAY") return slots.filter((s) => s.dayOfWeek === todayDayName);
    return slots.filter((s) => s.dayOfWeek === selectedDay);
  }, [allSlots, selectedDay, todayDayName]);

  // Group slots by Day
  const slotsGroupedByDay = useMemo(() => {
    const grouped: Record<string, typeof allSlots> = {};
    DAYS_OF_WEEK.forEach((day) => {
      const daySlots = allSlots
        .filter((s) => s.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (daySlots.length > 0) {
        grouped[day] = daySlots;
      }
    });
    return grouped;
  }, [allSlots]);

  const activeDaysWithClasses = useMemo(() => {
    return new Set(allSlots.map((s) => s.dayOfWeek));
  }, [allSlots]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Programs &amp; Lectures</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Batches &amp; Timetable
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Access your enrolled classes, weekly lecture schedules, and study resources.
          </p>
        </div>

        {/* Quick Counts Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-300 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
            {enrollments.length} Active {enrollments.length === 1 ? "Batch" : "Batches"}
          </span>
          <span className="text-xs font-mono text-indigo-300 px-3.5 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 shrink-0">
            {allSlots.length} Weekly Lectures
          </span>
        </div>
      </div>

      {/* ── Top Level View Switcher (Batches vs Complete Timetable) ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 max-w-md">
        <button
          onClick={() => setActiveTab("batches")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "batches"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Enrolled Batches ({enrollments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("timetable")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "timetable"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Weekly Timetable ({allSlots.length})</span>
        </button>
      </div>

      {/* ── TAB 1: ENROLLED BATCHES LIST ── */}
      {activeTab === "batches" && (
        <div className="space-y-4">
          {enrollments.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/5 text-center space-y-3">
              <GraduationCap className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Active Batches</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                You are not currently enrolled in any academic batch. Contact campus administration to enroll.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {enrollments.map((enr) => {
                const timetableCount =
                  enr.batch._count?.timetableSlots ?? enr.batch.timetableSlots.length;
                const materialsCount = enr.batch._count?.studyMaterials ?? 0;

                return (
                  <div
                    key={enr.id}
                    className="p-6 rounded-3xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-5 shadow-xl group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-white/10 text-zinc-300 border border-white/10">
                              {enr.batch.code}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {enr.batch.status}
                            </span>
                          </div>

                          <Link
                            href={`/portal/batches/${enr.batch.id}`}
                            className="text-lg font-black text-white hover:text-indigo-400 transition-colors block"
                          >
                            {enr.batch.name}
                          </Link>
                          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                            Your active classroom, timetable and study resources
                          </p>
                        </div>

                        <span className="text-[11px] px-3 py-1 rounded-xl font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{enr.batch.room || "Room 101"}</span>
                        </span>
                      </div>

                      {/* Faculty Information */}
                      {enr.batch.teachers.length > 0 && (
                        <div className="pt-3 border-t border-white/5 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                            Assigned Faculty:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {enr.batch.teachers.map(({ teacher }) => (
                              <div
                                key={teacher.id}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300"
                              >
                                <User className="w-3 h-3 text-indigo-400" />
                                <span className="font-medium text-white">{teacher.name}</span>
                                {teacher.specialization && (
                                  <span className="text-[10px] text-zinc-500">
                                    ({teacher.specialization})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metric Chips */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-center">
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                          <span className="text-base font-black text-indigo-400 block">
                            {timetableCount}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            Weekly Lectures
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                          <span className="text-base font-black text-purple-400 block">
                            {materialsCount}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            Study Notes &amp; PDFs
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/portal/batches/${enr.batch.id}?tab=timetable`}
                          className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-indigo-600/30 text-zinc-200 hover:text-white border border-white/10 hover:border-indigo-500/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>View Timetable</span>
                        </Link>
                        <Link
                          href={`/portal/batches/${enr.batch.id}?tab=materials`}
                          className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-indigo-600/30 text-zinc-200 hover:text-white border border-white/10 hover:border-indigo-500/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                          <span>Study Notes</span>
                        </Link>
                      </div>

                      <Link
                        href={`/portal/batches/${enr.batch.id}`}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all"
                      >
                        <span>Open Batch Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: UNIFIED WEEKLY TIMETABLE ── */}
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
                  ? `You have no lectures scheduled for today (${DAY_LABELS[todayDayName]}). Take some time for self-study and revision!`
                  : selectedDay !== "ALL"
                  ? `No lectures scheduled for ${DAY_LABELS[selectedDay]}.`
                  : "No weekly timetable slots have been scheduled yet across your enrolled batches."}
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
                    className={`rounded-3xl border p-5 space-y-4 ${
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
                        <TimetableCard key={slot.id} slot={slot} />
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
                <TimetableCard key={slot.id} slot={slot} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TimetableCard({ slot }: { slot: any }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3 group">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              {slot.startTime} – {slot.endTime}
            </span>
          </div>

          <span className="text-[10px] font-medium text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1 shrink-0">
            <MapPin className="w-2.5 h-2.5 text-zinc-400" />
            {slot.room || "Room 101"}
          </span>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
            {slot.subject.name}
          </h4>
          <span className="text-[11px] font-mono text-zinc-500">
            {slot.subject.code} • Batch: {slot.batchName}
          </span>
        </div>
      </div>

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

        <Link
          href={`/portal/batches/${slot.batchId}`}
          className="text-[11px] font-semibold text-indigo-400 hover:text-white flex items-center gap-0.5"
        >
          <span>Batch</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
