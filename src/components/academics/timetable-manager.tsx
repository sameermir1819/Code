"use client";

import { useState, useTransition } from "react";
import { createTimetableSlot, deleteTimetableSlot } from "@/server/actions/academics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

interface TimetableManagerProps {
  initialSlots: any[];
  batches: any[];
  subjects: any[];
  teachers: any[];
  userRole?: string;
}

export function TimetableManager({
  initialSlots,
  batches,
  subjects,
  teachers,
  userRole = "ADMIN",
}: TimetableManagerProps) {
  const [slots, setSlots] = useState(initialSlots);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

  // Form State
  const [formData, setFormData] = useState({
    dayOfWeek: "MONDAY",
    batchId: batches[0]?.id || "",
    subjectId: subjects[0]?.id || "",
    teacherId: teachers[0]?.id || "",
    room: "Lecture Hall 101",
    startTime: "09:00",
    endTime: "10:30",
  });

  const openScheduleModal = (day?: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (day) {
      setFormData((prev) => ({ ...prev, dayOfWeek: day }));
    }
    setIsModalOpen(true);
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.batchId) {
      setErrorMsg("Please select a target Class/Batch. If none exist, create a class first.");
      return;
    }
    if (!formData.subjectId) {
      setErrorMsg("Please select a subject.");
      return;
    }
    if (!formData.teacherId) {
      setErrorMsg("Please select an instructor/teacher.");
      return;
    }
    if (formData.startTime >= formData.endTime) {
      setErrorMsg("Class start time must be before end time.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createTimetableSlot({
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          batchId: formData.batchId,
          subjectId: formData.subjectId,
          teacherId: formData.teacherId,
          room: formData.room || "Lecture Hall 101",
        });

        if (res?.success && res.slot) {
          const batch = batches.find((b) => b.id === formData.batchId);
          const subject = subjects.find((s) => s.id === formData.subjectId);
          const teacher = teachers.find((t) => t.id === formData.teacherId);

          setSlots((prev) => [
            ...prev,
            {
              ...res.slot,
              batch: batch || { name: "Class" },
              subject: subject || { name: "Subject" },
              teacher: teacher || { name: "Teacher" },
            },
          ]);

          setSuccessMsg(`Class scheduled for ${formData.dayOfWeek} (${formData.startTime} - ${formData.endTime})!`);
          setIsModalOpen(false);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to schedule class.");
      }
    });
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to remove this scheduled class?")) return;

    startTransition(async () => {
      try {
        await deleteTimetableSlot(slotId);
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
        setSuccessMsg("Class removed from timetable.");
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to delete slot.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Weekly Timetable & Classes</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {slots.length} Classes Total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Classroom scheduling, faculty allocations, and automated conflict-prevention timetables.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => openScheduleModal()}
              className="inline-flex items-center gap-2 text-xs font-semibold shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule New Class</span>
            </Button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map((day) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === day);

          return (
            <Card key={day} className="flex flex-col border shadow-xs">
              <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold tracking-wide">{day}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {daySlots.length} Classes
                  </Badge>
                  {isAdmin && (
                    <button
                      onClick={() => openScheduleModal(day)}
                      title={`Add class for ${day}`}
                      className="p-1 rounded hover:bg-muted text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 flex-1 text-xs">
                {daySlots.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground italic text-xs">No classes scheduled</p>
                    {isAdmin && (
                      <button
                        onClick={() => openScheduleModal(day)}
                        className="mt-2 text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add class
                      </button>
                    )}
                  </div>
                ) : (
                  daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-lg border bg-card hover:border-primary/40 space-y-1.5 shadow-xs transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-foreground">{slot.subject?.name || "Subject"}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-primary font-semibold text-[11px]">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={isPending}
                              title="Delete this class"
                              className="p-1 rounded hover:bg-red-100 text-red-600 dark:hover:bg-red-950/50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground">
                        Class: <strong className="text-foreground">{slot.batch?.name || "Class"}</strong>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-foreground" />
                          {slot.teacher?.name || "Faculty"}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <MapPin className="h-3 w-3" />
                          {slot.room}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SCHEDULE CLASS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-lg font-bold text-foreground">Schedule New Class</h3>
                <p className="text-xs text-muted-foreground">
                  Select day, batch, subject, instructor, and room allocation.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {batches.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs space-y-3">
                <p className="font-semibold">No active classes or batches available to schedule!</p>
                <p>Please create a class or batch first before scheduling timetable classes.</p>
                <Link
                  href="/batches"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Go to Create Class / Batch
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1 text-foreground">
                      Day of the Week *
                    </label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground"
                    >
                      {days.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-foreground">
                      Select Class / Batch *
                    </label>
                    <select
                      value={formData.batchId}
                      onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-foreground">
                      Subject / Course Topic *
                    </label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-foreground">
                      Faculty / Instructor *
                    </label>
                    <select
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-foreground">
                      Start Time *
                    </label>
                    <Input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-foreground">
                      End Time *
                    </label>
                    <Input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1 text-foreground">
                      Classroom / Lecture Room *
                    </label>
                    <Input
                      required
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      placeholder="e.g. Lecture Hall 101, Room 204"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Scheduling..." : "Schedule Class"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

