import { getEffectivePermissions, requireStaffPermission } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/lib/db";
import { getAllCampuses } from "@/server/actions/campus";
import {
  ArrowUpRight,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CalendarPlus,
  Clock3,
  DoorOpen,
  GraduationCap,
  MapPin,
  UsersRound,
} from "lucide-react";
import { TimetableLocationFilter } from "@/components/academics/timetable-location-filter";

export const dynamic = "force-dynamic";

const DAYS = [
  { value: "MONDAY", short: "Mon", label: "Monday" },
  { value: "TUESDAY", short: "Tue", label: "Tuesday" },
  { value: "WEDNESDAY", short: "Wed", label: "Wednesday" },
  { value: "THURSDAY", short: "Thu", label: "Thursday" },
  { value: "FRIDAY", short: "Fri", label: "Friday" },
  { value: "SATURDAY", short: "Sat", label: "Saturday" },
  { value: "SUNDAY", short: "Sun", label: "Sunday" },
] as const;

function durationInMinutes(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return Math.max(0, endHour * 60 + endMinute - (startHour * 60 + startMinute));
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const { location = "GLOBAL" } = await searchParams;
  const session = await requireStaffPermission("timetable.view");
  const permissions = await getEffectivePermissions(session);
  const canManage = permissions.includes("timetable.manage") && permissions.includes("batches.view");

  const [slots, campuses] = await Promise.all([
    db.timetableSlot.findMany({
      where: {
        batch: {
          status: "ACTIVE",
          ...(!["GLOBAL", "ALL"].includes(location) ? { instituteId: location } : {}),
        },
        teacher: { status: "ACTIVE" },
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            institute: { select: { id: true, name: true, code: true, city: true } },
          },
        },
        subject: { select: { name: true } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    getAllCampuses(),
  ]);

  const selectedCampus = campuses.find((campus) => campus.id === location);
  const locationLabel = selectedCampus?.name || "All locations";
  const activeDays = new Set(slots.map((slot) => slot.dayOfWeek)).size;
  const batchCount = new Set(slots.map((slot) => slot.batch.id)).size;
  const facultyCount = new Set(slots.map((slot) => slot.teacher.id)).size;
  const totalMinutes = slots.reduce(
    (total, slot) => total + durationInMinutes(slot.startTime, slot.endTime),
    0,
  );
  const today = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  }).format(new Date()).toUpperCase();

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-sky-500/10 p-5 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <CalendarDays className="h-3.5 w-3.5" /> Weekly operations
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-primary" /> {locationLabel}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Classes &amp; Timetable</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              See every active class, teacher, room, and batch in one weekly view. Open a batch to update its schedule.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {permissions.includes("batches.view") && (
              <Link href="/dashboard/batches" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-background/85 px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-muted">
                <GraduationCap className="h-4 w-4" /> View classes
              </Link>
            )}
            {canManage && (
              <Link href="/dashboard/batches" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                <CalendarPlus className="h-4 w-4" /> Manage schedules
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Weekly classes", value: slots.length, detail: `${activeDays} active days`, icon: BookOpenCheck, tone: "text-primary bg-primary/10" },
          { label: "Teaching time", value: formatDuration(totalMinutes), detail: "scheduled this week", icon: Clock3, tone: "text-sky-600 bg-sky-500/10" },
          { label: "Active batches", value: batchCount, detail: "with scheduled classes", icon: GraduationCap, tone: "text-emerald-600 bg-emerald-500/10" },
          { label: "Faculty roster", value: facultyCount, detail: "teachers on timetable", icon: UsersRound, tone: "text-violet-600 bg-violet-500/10" },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border bg-card/90 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{metric.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{metric.detail}</p>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.tone}`}>
                <metric.icon className="h-4 w-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <TimetableLocationFilter campuses={campuses} value={location} />

      {!slots.length ? (
        <section className="rounded-3xl border-2 border-dashed bg-card/70 px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold">No classes scheduled</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            There are no active timetable entries for {locationLabel}. Add classes from an active batch workspace.
          </p>
          {canManage && (
            <Link href="/dashboard/batches" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
              <CalendarPlus className="h-4 w-4" /> Choose a batch
            </Link>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Weekly agenda</h2>
              <p className="text-xs text-muted-foreground">Classes are ordered by start time for quick scanning.</p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">Times shown in local campus time</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {DAYS.map((day) => {
              const classes = slots.filter((slot) => slot.dayOfWeek === day.value);
              const isToday = today === day.value;

              return (
                <article key={day.value} className={`overflow-hidden rounded-2xl border bg-card/90 shadow-sm ${isToday ? "border-primary/50 ring-1 ring-primary/20" : ""}`}>
                  <header className={`flex items-center justify-between border-b px-4 py-3 ${isToday ? "bg-primary/10" : "bg-muted/25"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${isToday ? "bg-primary text-primary-foreground" : "border bg-background text-foreground"}`}>
                        {day.short}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold">{day.label}</h3>
                        <p className="text-[11px] text-muted-foreground">{classes.length ? `${classes.length} scheduled ${classes.length === 1 ? "class" : "classes"}` : "No classes"}</p>
                      </div>
                    </div>
                    {isToday && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">Today</span>}
                  </header>

                  <div className="space-y-2 p-3">
                    {!classes.length ? (
                      <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 text-center text-xs text-muted-foreground">
                        No sessions planned for {day.label}.
                      </div>
                    ) : (
                      classes.map((slot) => (
                        <div key={slot.id} className="group rounded-xl border bg-background/75 p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                          <div className="flex gap-3">
                            <div className="w-[76px] shrink-0 border-r pr-3">
                              <p className="font-mono text-sm font-bold text-primary">{slot.startTime}</p>
                              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">to {slot.endTime}</p>
                              <p className="mt-2 text-[10px] font-semibold text-muted-foreground">{formatDuration(durationInMinutes(slot.startTime, slot.endTime))}</p>
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-bold">{slot.subject.name}</h4>
                              <Link href={`/dashboard/batches/${slot.batch.id}`} className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs font-semibold text-primary hover:underline">
                                <span className="truncate">{slot.batch.name}</span>
                                <ArrowUpRight className="h-3 w-3 shrink-0" />
                              </Link>

                              <div className="mt-2 grid gap-1.5 text-[11px] text-muted-foreground sm:grid-cols-2">
                                <span className="flex min-w-0 items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 shrink-0 text-foreground/70" /><span className="truncate">{slot.teacher.name}</span></span>
                                <span className="flex min-w-0 items-center gap-1.5"><DoorOpen className="h-3.5 w-3.5 shrink-0 text-foreground/70" /><span className="truncate">{slot.room || "Room not assigned"}</span></span>
                                <span className="flex min-w-0 items-center gap-1.5 sm:col-span-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-foreground/70" /><span className="truncate">{slot.batch.institute.name}{slot.batch.institute.city ? `, ${slot.batch.institute.city}` : ""}</span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
