"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, QrCode, UserCheck, Usb } from "lucide-react";
import { CameraQrScanner } from "./camera-qr-scanner";
import { recordQrAttendanceSafe, getTodayAttendanceLiveFeed } from "@/server/actions/attendance";
import { parseStudentCard, createScanRequestId } from "@/lib/attendance-scanner";
import { playCheckInChime } from "@/lib/audio-chime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type LiveEntry = Awaited<ReturnType<typeof getTodayAttendanceLiveFeed>>[number];
type PendingScan = { code: string; requestId: string };

export function QrDeviceTerminal({ campusId, onPendingChange }: { campusId: string; onPendingChange: (count: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoSubmitTimer = useRef<number | null>(null);
  const backgroundScanTimer = useRef<number | null>(null);
  const backgroundScanBuffer = useRef("");
  const scanCardRef = useRef<(payload: string) => Promise<void>>(async () => undefined);
  const queue = useRef<PendingScan[]>([]);
  const pendingCodes = useRef(new Set<string>());
  const processing = useRef(false);
  const mounted = useRef(true);
  const feedRevision = useRef(0);
  const feedRefreshing = useRef(false);
  const [pending, setPending] = useState(0);
  const [focused, setFocused] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "usb">("camera");
  const scanModeRef = useRef(scanMode);
  scanModeRef.current = scanMode;
  const [liveFeed, setLiveFeed] = useState<LiveEntry[]>([]);
  const [feedError, setFeedError] = useState("");
  const [failedScans, setFailedScans] = useState<Array<PendingScan & { message: string }>>([]);
  const [status, setStatus] = useState({ text: "", type: "info" });

  const loadLiveFeed = useCallback(async () => {
    if (feedRefreshing.current) return;
    feedRefreshing.current = true;
    const revision = feedRevision.current;
    try {
      const entries = await getTodayAttendanceLiveFeed(campusId);
      if (mounted.current && revision === feedRevision.current) { setLiveFeed(entries); setFeedError(""); }
    } catch {
      if (mounted.current && revision === feedRevision.current) setFeedError("Live entries could not be refreshed. Check your connection and try again.");
    } finally { feedRefreshing.current = false; }
  }, [campusId]);

  useEffect(() => { onPendingChange(pending); }, [pending, onPendingChange]);

  useEffect(() => {
    if (window.matchMedia("(min-width: 768px) and (pointer: fine)").matches) setScanMode("usb");
  }, []);

  useEffect(() => {
    if (scanMode !== "usb") return;
    const focusInput = () => { if (!document.hidden) inputRef.current?.focus({ preventScroll: true }); };
    const initialFocus = window.requestAnimationFrame(focusInput);
    window.addEventListener("focus", focusInput);
    document.addEventListener("visibilitychange", focusInput);
    return () => {
      window.cancelAnimationFrame(initialFocus);
      window.removeEventListener("focus", focusInput);
      document.removeEventListener("visibilitychange", focusInput);
    };
  }, [scanMode]);

  useEffect(() => {
    mounted.current = true;
    void loadLiveFeed();
    const refreshVisible = () => { if (!document.hidden && !processing.current) void loadLiveFeed(); };
    const interval = window.setInterval(refreshVisible, 3000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      mounted.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
      if (autoSubmitTimer.current !== null) window.clearTimeout(autoSubmitTimer.current);
      if (backgroundScanTimer.current !== null) window.clearTimeout(backgroundScanTimer.current);
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
          const result = await recordQrAttendanceSafe(next, requestId, campusId);
          if (!result.success) throw new Error(result.error);
          if (mounted.current) {
            feedRevision.current++;
            setLiveFeed((entries) => [result.liveEntry, ...entries.filter((entry) => entry.id !== result.liveEntry.id)].slice(0, 30));
            setFeedError("");
            setFailedScans((previous) => previous.filter((scan) => scan.code !== next));
            setStatus({
              text: `${result.student.name} — ${result.message}`,
              type: result.isAlreadyMarked ? "info" : "success",
            });
            playCheckInChime(result.isAlreadyMarked ? "warning" : "success");
            if (!result.isAlreadyMarked) { try { navigator.vibrate?.(80); } catch { /* Optional device feedback. */ } }
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

  scanCardRef.current = scanCard;

  function submitScan() {
    if (autoSubmitTimer.current !== null) {
      window.clearTimeout(autoSubmitTimer.current);
      autoSubmitTimer.current = null;
    }
    const input = inputRef.current;
    if (!input) return;
    const code = input.value;
    input.value = "";
    input.focus();
    if (code.trim()) void scanCard(code);
  }

  useEffect(() => {
    function submitBackgroundScan() {
      if (backgroundScanTimer.current !== null) {
        window.clearTimeout(backgroundScanTimer.current);
        backgroundScanTimer.current = null;
      }
      const code = backgroundScanBuffer.current;
      backgroundScanBuffer.current = "";
      if (code.trim()) void scanCardRef.current(code);
    }

    function isEditableTarget(target: EventTarget | null) {
      return target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || (target instanceof HTMLElement && target.isContentEditable);
    }

    function handleBackgroundKey(event: KeyboardEvent) {
      if (scanModeRef.current !== "usb") return;
      // Barcode to PC may send keystrokes to the page instead of the scan input
      // when focus changes. Capture only fast printable input outside form fields.
      if (event.target === inputRef.current || isEditableTarget(event.target)) return;
      if (event.key === "Enter" || event.key === "Tab") {
        if (backgroundScanBuffer.current) {
          event.preventDefault();
          submitBackgroundScan();
        }
        return;
      }
      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length !== 1) return;

      backgroundScanBuffer.current += event.key;
      if (backgroundScanTimer.current !== null) window.clearTimeout(backgroundScanTimer.current);
      backgroundScanTimer.current = window.setTimeout(submitBackgroundScan, 250);
    }

    function handleBackgroundPaste(event: ClipboardEvent) {
      if (scanModeRef.current !== "usb") return;
      if (event.target === inputRef.current || isEditableTarget(event.target)) return;
      const code = event.clipboardData?.getData("text") ?? "";
      if (!code.trim()) return;
      event.preventDefault();
      backgroundScanBuffer.current = "";
      void scanCardRef.current(code);
    }

    window.addEventListener("keydown", handleBackgroundKey);
    window.addEventListener("paste", handleBackgroundPaste);
    return () => {
      window.removeEventListener("keydown", handleBackgroundKey);
      window.removeEventListener("paste", handleBackgroundPaste);
      if (backgroundScanTimer.current !== null) window.clearTimeout(backgroundScanTimer.current);
    };
  }, []);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-6">
      <Card className="min-w-0 self-start border-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg"><QrCode className="h-5 w-5 shrink-0" />QR Card Scanner</CardTitle>
          <CardDescription>Scan the student card on arrival to check in, then scan again when leaving to check out.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Scan method">
            <Button type="button" className="min-h-11 gap-2" variant={scanMode === "camera" ? "default" : "outline"} aria-pressed={scanMode === "camera"} onClick={() => setScanMode("camera")}><Camera className="h-4 w-4" />Camera</Button>
            <Button type="button" className="min-h-11 gap-2" variant={scanMode === "usb" ? "default" : "outline"} aria-pressed={scanMode === "usb"} onClick={() => setScanMode("usb")}><Usb className="h-4 w-4" />USB Scanner</Button>
          </div>
          <div role="status" aria-live="polite" aria-atomic="true" className={`break-words rounded-lg p-3 text-sm ${
            status.type === "error" ? "bg-red-50 text-red-800" : status.type === "success" ? "bg-green-50 text-green-800" : "bg-muted text-foreground"
          }`}>
            {status.text || "Waiting for a student card. First scan: check-in. Next scan: check-out."}
          </div>
          {scanMode === "camera" ? <CameraQrScanner onScan={(code) => void scanCardRef.current(code)} /> : <>
          <div className={`rounded-lg border p-4 ${focused ? "bg-green-50 border-green-200 text-green-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
            <p className="font-semibold">{focused ? "Ready to scan" : "Click the scan field to resume"}</p>
            <p className="text-xs mt-1">Keep this terminal open while students scan their cards.</p>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); submitScan(); }} className="space-y-2">
            <label htmlFor="student-card-scan" className="text-sm font-medium">Student card</label>
            <Input
              ref={inputRef} id="student-card-scan" autoComplete="off" className="min-h-11 text-base"
              autoCapitalize="off" spellCheck={false} maxLength={1024}
              placeholder="Scan card here..."
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onChange={() => {
                if (autoSubmitTimer.current !== null) window.clearTimeout(autoSubmitTimer.current);
                // USB/Bluetooth scanners type the complete code very quickly.
                // Submit after a brief quiet period, even without Enter/Tab.
                autoSubmitTimer.current = window.setTimeout(() => submitScan(), 250);
              }}
              onKeyDown={(event) => {
                if (event.key === "Tab" && inputRef.current?.value.trim()) {
                  event.preventDefault(); submitScan();
                }
              }}
            />
            <Button type="button" variant="secondary" className="min-h-11 w-full" onClick={() => inputRef.current?.focus()}>
              Focus scanner
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">Set the scanner to keyboard/HID mode. Attendance saves automatically after the QR code is received; Enter or Tab is optional.</p>
          </>}
          <p className="text-xs text-muted-foreground">Repeat scans of the same card within 60 seconds are ignored. Other students can scan immediately.</p>
          {pending > 0 && <p role="status" className="text-sm font-medium">{pending} scan{pending === 1 ? "" : "s"} waiting to finish. Keep this page open.</p>}
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
      <Card className="min-w-0">
        <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><UserCheck className="h-5 w-5 shrink-0 text-green-600" />Today&apos;s Check-ins &amp; Check-outs</CardTitle>
              <CardDescription>Attendance at the selected campus · India time</CardDescription>
            </div>
            <Button variant="outline" className="min-h-11" onClick={() => { void loadLiveFeed(); inputRef.current?.focus(); }}>Refresh</Button>
          </div>
          {feedError && <p role="alert" className="text-sm text-destructive">{feedError}</p>}
        </CardHeader>
        <CardContent className="p-0">
          {liveFeed.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground"><QrCode className="h-12 w-12 mx-auto opacity-30 mb-3" /><p>No entries to display yet.</p></div>
          ) : (
            <div className="divide-y overflow-y-auto max-h-[550px]">
              {liveFeed.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 break-words"><p className="font-semibold">{entry.studentName}</p><p className="text-xs text-muted-foreground">{entry.studentCode} · {entry.batchName}</p></div>
                  <div className="sm:shrink-0 sm:text-right">
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
