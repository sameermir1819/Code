import { requireStaffPermission } from "@/lib/auth";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { authorizedCampusId } from "@/lib/campus-scope";
import { getActiveCampusId } from "@/server/actions/campus";

export const dynamic = "force-dynamic";
export default async function TimetablePage() {
  await requireStaffPermission("timetable.view");
  const session = await requireStaffPermission("timetable.view");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());
  const slots = await db.timetableSlot.findMany({
    where: {
      batch: { instituteId, status: "ACTIVE" },
      teacher: { status: "ACTIVE" },
      ...(session.role === "TEACHER" ? { teacherId: session.teacherId || "" } : {}),
    },
    include: { batch: { select: { id: true, name: true } }, subject: { select: { name: true } }, teacher: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Weekly Timetable</h1><p className="text-sm text-muted-foreground">{session.role === "TEACHER" ? "Your scheduled classes." : "Classes for the selected campus. Open a batch to manage its schedule."}</p></div>
    {!slots.length ? <p className="rounded-xl border bg-card p-6 text-muted-foreground">No classes scheduled yet.</p> : days.map((day) => {
      const classes = slots.filter((slot) => slot.dayOfWeek === day);
      if (!classes.length) return null;
      return <section key={day} className="space-y-3"><h2 className="font-semibold capitalize">{day.toLowerCase()}</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{classes.map((slot) => <div key={slot.id} className="space-y-2 rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">{slot.startTime}?{slot.endTime}</p><p>{slot.subject.name}</p>
        <Link className="text-sm text-primary underline" href={"/dashboard/batches/" + slot.batch.id}>{slot.batch.name}</Link>
        <p className="text-sm text-muted-foreground">{slot.teacher.name} ? {slot.room || "Room not assigned"}</p>
      </div>)}</div></section>;
    })}
  </div>;
}
