"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Building2, Loader2, MapPinned } from "lucide-react";

type CampusOption = {
  id: string;
  name: string;
  city?: string | null;
};

export function TimetableLocationFilter({ campuses, value }: { campuses: CampusOption[]; value: string }) {
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
    <section className="rounded-2xl border bg-card/90 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPinned className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold">Schedule location</h2>
            <p className="text-xs text-muted-foreground">Switch between the global timetable and a single campus.</p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Building2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <select
            id="timetable-location"
            aria-label="Filter timetable by location"
            value={value}
            disabled={isPending}
            onChange={(event) => changeLocation(event.target.value)}
            className="h-10 w-full appearance-none rounded-xl border border-input bg-background pl-9 pr-10 text-sm font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          >
            <option value="GLOBAL">All locations</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}{campus.city ? ` — ${campus.city}` : ""}
              </option>
            ))}
          </select>
          {isPending && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>
    </section>
  );
}
