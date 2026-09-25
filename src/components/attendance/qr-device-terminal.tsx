"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QrCode, UserCheck, Usb } from "lucide-react";
import { recordQrAttendance, getTodayAttendanceLiveFeed } from "@/server/actions/attendance";
import { parseStudentCard, createScanRequestId } from "@/lib/attendance-scanner";
import { playCheckInChime } from "@/lib/audio-chime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type LiveEntry = Awaited<ReturnType<typeof getTodayAttendanceLiveFeed>>[number];
type PendingScan = { code: string; requestId: string };

export function QrDeviceTerminal() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queue = useRef<PendingScan[]>([]);
  const pendingCodes = useRef(new Set<string>());
  const processing = useRef(false);
  const mounted = useRef(true);
  const [pending, setPending] = useState(0);
  const [focused, setFocused] = useState(false);
  const [liveFeed, setLiveFeed] = useState<LiveEntry[]>([]);
  const [feedError, setFeedError] = useState("");
  const [failedScans, setFailedScans] = useState<Array<PendingScan & { message: string }>>([]);
  const [status, setStatus] = useState({ text: "", type: "info" });

  const loadLiveFeed = useCallback(async () => {
    try {
      const entries = await getTodayAttendanceLiveFeed();
      if (mounted.current) { setLiveFeed(entries); setFeedError(""); }
    } catch {
      if (mounted.current) setFeedError("Live entries could not be refreshed. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void loadLiveFeed();
    const interval = window.setInterval(() => void loadLiveFeed(), 10000);
    const focusInput = () => inputRef.current?.focus();
    window.addEventListener("focus", focusInput);
    return () => {
      mounted.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", focusInput);
    };
  }, [loadLiveFeed]);

  async function scanCard(payload: string, retryRequestId?: string) {
    let code: string;
    try {
      code = parseStudentCard(payload);
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : "Invalid card", type: "error" });
      playCheckInChime("error");
      return;
    }
    if (pendingCodes.current.has(code)) return;
    pendingCodes.current.add(code);
    queue.current.push({ code, requestId: retryRequestId ?? failedScans.find((scan) => scan.code === code)?.requestId ?? createScanRequestId() });
    setPending(pendingCodes.current.size);
    if (processing.current) return;
    processing.current = true;

    // Scanners can send another card while the previous request is in flight.
    // Keep every code and process them in order instead of dropping scans.
    try {
      while (queue.current.length) {
        const { code: next, requestId } = queue.current.shift()!;
        if (mounted.current) setStatus({ text: `Recording ${next}...`, type: "info" });
        try {
          const result = await recordQrAttendance(next, requestId);
          if (mounted.current) {
            setFailedScans((previous) => previous.filter((scan) => scan.code !== next));
            setStatus({
              text: `${result.student.name} — ${result.message}`,
              type: result.isAlreadyMarked ? "info" : "success",
            });
            playCheckInChime(result.isAlreadyMarked ? "warning" : "success");
            void loadLiveFeed();
          }
        } catch (error) {
          if (mounted.current) {
            const message = error instanceof Error ? error.message : "Attendance could not be recorded. Please try again.";
            setFailedScans((previous) => [...previous.filter((scan) => scan.code !== next), { code: next, requestId, message }]);
            setStatus({
              text: `${next}: ${message}`,
              type: "error",
            });
            playCheckInChime("error");
          }
        } finally {
          pendingCodes.current.delete(next);
          if (mounted.current) setPending(pendingCodes.current.size);
        }
      }
    } finally {
      processing.current = false;
    }
  }

  function submitScan() {
    const input = inputRef.current;
    if (!input) return;
    const code = input.value;
    input.value = "";
    input.focus();
    if (code.trim()) void scanCard(code);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 self-start border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Usb className="h-5 w-5" />QR Card Scanner</CardTitle>
          <CardDescription>Scan the student card on arrival to check in, then scan again when leaving to check out.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className={`rounded-lg border p-4 ${focused ? "bg-green-50 border-green-200 text-green-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
            <p className="font-semibold">{focused ? "Ready to scan" : "Click the scan field to resume"}</p>
            <p className="text-xs mt-1">Keep this terminal open while students scan their cards.</p>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); submitScan(); }} className="space-y-2">
            <label htmlFor="student-card-scan" className="text-sm font-medium">Student card</label>
            <Input
              ref={inputRef} id="student-card-scan" autoFocus autoComplete="off"
              autoCapitalize="off" spellCheck={false} maxLength={1024}
              placeholder="Scan card here..."
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onKeyDown={(event) => {
                if (event.key === "Tab" && inputRef.current?.value.trim()) {
                  event.preventDefault(); submitScan();
                }
              }}
            />
            <Button type="button" variant="secondary" className="w-full" onClick={() => inputRef.current?.focus()}>
              Focus scanner
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">Set the scanner to keyboard mode with Enter or Tab after each scan. Attendance saves automatically.</p>
          <p className="text-xs text-muted-foreground">Repeat scans within 30 seconds of entry are ignored. Each day records one check-in and one check-out.</p>
          {pending > 0 && <p role="status" className="text-sm font-medium">{pending} scan{pending === 1 ? "" : "s"} waiting to finish. Keep this page open.</p>}
          <div role="status" aria-live="polite" aria-atomic="true" className={`rounded-lg p-3 text-sm ${
            status.type === "error" ? "bg-red-50 text-red-800" : status.type === "success" ? "bg-green-50 text-green-800" : "bg-muted text-foreground"
          }`}>
            {status.text || "Waiting for a student card. First scan: check-in. Next scan: check-out."}
          </div>
          {failedScans.length > 0 && (
            <div className="space-y-3 rounded-lg border border-red-200 p-3">
              <p className="text-sm font-semibold text-destructive">Scans needing attention</p>
              {failedScans.map((scan) => (
                <div key={scan.code} className="space-y-1 text-xs">
                  <p className="font-semibold">{scan.code}</p><p>{scan.message}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => { void scanCard(scan.code, scan.requestId); inputRef.current?.focus(); }}>Retry {scan.code}</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg"><UserCheck className="h-5 w-5 text-green-600" />Today&apos;s Check-ins &amp; Check-outs</CardTitle>
              <CardDescription>Attendance at the selected campus · India time</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => { void loadLiveFeed(); inputRef.current?.focus(); }}>Refresh</Button>
          </div>
          {feedError && <p role="alert" className="text-sm text-destructive">{feedError}</p>}
        </CardHeader>
        <CardContent className="p-0">
          {liveFeed.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground"><QrCode className="h-12 w-12 mx-auto opacity-30 mb-3" /><p>No entries to display yet.</p></div>
          ) : (
            <div className="divide-y overflow-y-auto max-h-[550px]">
              {liveFeed.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 p-4">
                  <div><p className="font-semibold">{entry.studentName}</p><p className="text-xs text-muted-foreground">{entry.studentCode} · {entry.batchName}</p></div>
                  <div className="text-right">
                    <Badge variant={entry.gateStatus === "CHECKED_OUT" ? "secondary" : entry.gateStatus === "INSIDE" ? "success" : "outline"}>
                      {entry.gateStatus === "CHECKED_OUT" ? "Checked out" : entry.gateStatus === "INSIDE" ? "Inside" : "Not scanned"}
                    </Badge>
                    <p className="text-xs text-muted-foreground font-mono mt-1">In: {entry.checkInTime || "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">Out: {entry.checkOutTime || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
