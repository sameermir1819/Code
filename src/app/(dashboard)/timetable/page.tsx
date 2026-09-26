import { getEffectivePermissions, requireStaffPermission } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/lib/db";
import { getAllCampuses } from "@/server/actions/campus";
import { CalendarPlus, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const { location = "GLOBAL" } = await searchParams;
  const session = await requireStaffPermission("timetable.view");
  const permissions = await getEffectivePermissions(session);
  const canManage = permissions.includes("timetable.manage") && permissions.includes("batches.view");
  const [slots, campuses] = await Promise.all([db.timetableSlot.findMany({
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
      teacher: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  }), getAllCampuses()]);
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-bold">Classes &amp; Timetable</h1><p className="text-sm text-muted-foreground">Global class schedule across all locations. Open a batch to manage its schedule.</p></div>
      {canManage && <Link href="/dashboard/batches" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"><CalendarPlus className="h-4 w-4" />Manage Classes by Batch</Link>}
    </div>
    <form method="get" className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="timetable-location" className="mb-1.5 block text-xs font-semibold">Filter by location</label>
        <select id="timetable-location" name="location" defaultValue={location} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="GLOBAL">All Locations (Global)</option>
          {campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}{campus.city ? ` — ${campus.city}` : ""}</option>)}
        </select>
      </div>
      <button type="submit" className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Apply Filter</button>
    </form>
    {!slots.length ? <p className="rounded-xl border bg-card p-6 text-muted-foreground">No classes scheduled yet.</p> : days.map((day) => {
      const classes = slots.filter((slot) => slot.dayOfWeek === day);
      if (!classes.length) return null;
      return <section key={day} className="space-y-3"><h2 className="font-semibold capitalize">{day.toLowerCase()}</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{classes.map((slot) => <div key={slot.id} className="space-y-2 rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">{slot.startTime}–{slot.endTime}</p><p>{slot.subject.name}</p>
        <Link className="text-sm text-primary underline" href={"/dashboard/batches/" + slot.batch.id}>{slot.batch.name}</Link>
        <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{slot.batch.institute.name}{slot.batch.institute.city ? ` — ${slot.batch.institute.city}` : ""}</p>
        <p className="text-sm text-muted-foreground">{slot.teacher.name} · {slot.room || "Room not assigned"}</p>
      </div>)}</div></section>;
    })}
  </div>;
}
