import type { SessionUser } from "./permissions";

// Assigned staff cannot change their authorization by editing the campus cookie.
export function authorizedCampusId(session: SessionUser, selectedCampusId: string): string {
  const id = session.role !== "SUPER_ADMIN" && session.instituteId
    ? session.instituteId : selectedCampusId;
  if (!id || id === "ALL" || id === "GLOBAL") {
    throw new Error("Select an authorized campus first");
  }
  return id;
}

// Use for writes whose target record already determines the location. Global/central
// staff may act on any selected location; assigned staff remain limited to theirs.
export function assertCampusAccess(session: SessionUser, targetCampusId: string): string {
  const authorizedId = authorizedCampusId(session, targetCampusId);
  if (authorizedId !== targetCampusId) {
    throw new Error("You do not have permission to manage records for this location.");
  }
  return targetCampusId;
}
