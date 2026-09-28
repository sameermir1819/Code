import type { getTodayAttendanceLiveFeed, recordQrAttendanceSafe } from "@/server/actions/attendance";

export type AttendanceLiveEntry = Awaited<ReturnType<typeof getTodayAttendanceLiveFeed>>[number];
type ActionResult = Awaited<ReturnType<typeof recordQrAttendanceSafe>>;
type ScanResult = Omit<Extract<ActionResult, { success: true }>, "record"> | Extract<ActionResult, { success: false }>;

// Plain JSON requests do not join Next's sequential Server Action queue.
// A background feed refresh therefore cannot hold up a newly scanned card.
async function terminalRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, { ...options, credentials: "same-origin", cache: "no-store" });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "Attendance connection failed. Please retry the scan.");
  if (!result || typeof result !== "object") throw new Error("Attendance response unavailable. Please retry the scan.");
  return result;
}

export async function saveAttendanceScan(code: string, requestId: string, campusId: string): Promise<ScanResult> {
  const result = await terminalRequest("/api/attendance/terminal", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, requestId, campusId }),
  });
  if (typeof result.success !== "boolean" || (result.success &&
    (typeof result.student?.name !== "string" || typeof result.liveEntry?.id !== "string"))) {
    throw new Error("Attendance confirmation unavailable. Please retry the scan.");
  }
  return result;
}

export async function fetchAttendanceFeed(campusId: string): Promise<AttendanceLiveEntry[]> {
  const result = await terminalRequest(`/api/attendance/terminal?campusId=${encodeURIComponent(campusId)}`);
  if (!Array.isArray(result.entries)) throw new Error("Attendance feed unavailable. Please refresh again.");
  return result.entries;
}
