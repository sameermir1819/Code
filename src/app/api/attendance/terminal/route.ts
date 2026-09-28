import { NextResponse } from "next/server";
import { getTodayAttendanceLiveFeed, recordQrAttendanceSafe } from "@/server/actions/attendance";

export const dynamic = "force-dynamic";

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "NEXT_REDIRECT") return json({ success: false, error: "Session expired. Sign in again before scanning." }, 401);
  if (/^FORBIDDEN/.test(message)) return json({ success: false, error: "You do not have permission at this campus." }, 403);
  console.error("Attendance terminal request failed:", error);
  return json({ success: false, error: "Attendance could not be saved. Please retry the scan." }, 503);
}

function validCampus(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
}

export async function POST(request: Request) {
  // Recreate Server Actions' same-origin protection for the JSON save route.
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return json({ success: false, error: "Invalid scan origin. Open the attendance page and try again." }, 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ success: false, error: "Invalid scan request." }, 400);
  }
  if (Number(request.headers.get("content-length")) > 4096) return json({ success: false, error: "Invalid scan request." }, 413);
  let body;
  try {
    const text = await request.text();
    if (text.length > 4096) return json({ success: false, error: "Invalid scan request." }, 413);
    body = JSON.parse(text);
  } catch { return json({ success: false, error: "Invalid scan request." }, 400); }
  if (!body || typeof body.code !== "string" || body.code.length > 1024 || !validCampus(body.campusId)
    || typeof body.requestId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(body.requestId)) {
    return json({ success: false, error: "Invalid scan request. Select a campus and scan again." }, 400);
  }
  try {
    // The existing guard, transaction, campus checks and retry ID stay intact.
    const result = await recordQrAttendanceSafe(body.code, body.requestId, body.campusId);
    if (!result.success) return json(result, 400);
    const { record: _record, ...confirmation } = result;
    return json(confirmation);
  } catch (error) { return failure(error); }
}

export async function GET(request: Request) {
  const campusId = new URL(request.url).searchParams.get("campusId");
  if (!validCampus(campusId)) return json({ success: false, error: "Select a campus before refreshing attendance." }, 400);
  try {
    return json({ entries: await getTodayAttendanceLiveFeed(campusId) });
  } catch (error) { return failure(error); }
}
