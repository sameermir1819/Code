import type { SessionUser } from "./permissions";

// Assigned staff cannot change their authorization by editing the campus cookie.
export function authorizedCampusId(session: SessionUser, selectedCampusId: string): string {
  const id = session.role !== "SUPER_ADMIN" && session.instituteId
    ? session.instituteId : selectedCampusId;
  if (!id || id === "ALL") throw new Error("Select an authorized campus first");
  return id;
}
