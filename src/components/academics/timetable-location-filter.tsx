"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type CampusOption = {
  id: string;
  name: string;
  city?: string | null;
};

export function TimetableLocationFilter({
  campuses,
  value,
}: {
  campuses: CampusOption[];
  value: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const changeLocation = (location: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (location === "GLOBAL") params.delete("location");
    else params.set("location", location);

    const query = params.toString();
    startTransition(() => router.replace(query ? `/timetable?${query}` : "/timetable"));
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <label htmlFor="timetable-location" className="mb-1.5 block text-xs font-semibold">
        Filter by location
      </label>
      <select
        id="timetable-location"
        value={value}
        disabled={isPending}
        onChange={(event) => changeLocation(event.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
      >
        <option value="GLOBAL">All Locations (Global)</option>
        {campuses.map((campus) => (
          <option key={campus.id} value={campus.id}>
            {campus.name}{campus.city ? ` — ${campus.city}` : ""}
          </option>
        ))}
      </select>
      {isPending && <p className="mt-1.5 text-[11px] text-muted-foreground">Updating timetable…</p>}
    </div>
  );
}
