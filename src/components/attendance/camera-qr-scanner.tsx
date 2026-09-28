"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Flashlight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cameraErrorMessage, createCameraSession } from "@/lib/camera-scanner";

type CameraSession = ReturnType<typeof createCameraSession>;

export function CameraQrScanner({ onScan }: { onScan: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<CameraSession | null>(null);
  const generation = useRef(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [state, setState] = useState<"stopped" | "starting" | "running">("stopped");
  const [error, setError] = useState("");
  const [hasTorch, setHasTorch] = useState(false);
  const [torch, setTorch] = useState(false);

  const stop = useCallback(() => {
    generation.current++;
    sessionRef.current?.stop();
    sessionRef.current = null;
    setState("stopped");
    setHasTorch(false);
    setTorch(false);
  }, []);

  useEffect(() => {
    const lifecycle = generation;
    const sessions = sessionRef;
    const onHidden = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", stop);
    return () => {
      lifecycle.current++;
      sessions.current?.stop();
      sessions.current = null;
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", stop);
    };
  }, [stop]);

  async function start() {
    if (sessionRef.current || state === "starting") return;
    setError("");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera access requires a secure HTTPS page and a supported browser. Open this page in Chrome or Safari.");
      return;
    }
    const current = ++generation.current;
    setState("starting");
    try {
      const { default: decode } = await import("jsqr");
      if (current !== generation.current || !videoRef.current) return;
      const session = createCameraSession(videoRef.current, decode, (code) => onScanRef.current(code), (cause) => {
        if (current !== generation.current) return;
        stop();
        setError(cameraErrorMessage(cause));
      });
      sessionRef.current = session;
      const started = await session.start();
      if (current !== generation.current || !started) return;
      const track = session.getTrack();
      try {
        const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
        setHasTorch(Boolean(capabilities?.torch));
      } catch { setHasTorch(false); }
      setState("running");
    } catch (cause) {
      if (current !== generation.current) return;
      stop();
      setError(cameraErrorMessage(cause));
    }
  }

  async function toggleTorch() {
    const session = sessionRef.current;
    const track = session?.getTrack();
    if (!track) return;
    const next = !torch;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      if (session === sessionRef.current) setTorch(next);
    } catch { setError("Torch is unavailable on this camera. Try scanning in better light."); }
  }

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-square w-full max-w-[55svh] overflow-hidden rounded-xl bg-slate-950">
        <video ref={videoRef} muted playsInline aria-label="Student QR camera preview" className="h-full w-full object-cover" />
        {state !== "running" ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center text-white">
            {state === "starting" ? <Loader2 className="h-10 w-10 animate-spin" /> : <Camera className="h-12 w-12 text-white/60" />}
            <p className="text-sm">{state === "starting" ? "Opening camera..." : "Start camera to scan a student card"}</p>
          </div>
        ) : <div className="pointer-events-none absolute inset-[10%] rounded-2xl border-2 border-white/70" />}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-11 flex-1 gap-2" onClick={() => void start()} disabled={state !== "stopped"}>
          <Camera className="h-4 w-4" />{state === "running" ? "Camera running" : "Start camera"}
        </Button>
        {state !== "stopped" && <Button type="button" variant="outline" className="min-h-11 gap-2" onClick={stop}><CameraOff className="h-4 w-4" />Stop</Button>}
        {hasTorch && <Button type="button" variant="outline" className="min-h-11 gap-2" aria-pressed={torch} onClick={() => void toggleTorch()}><Flashlight className="h-4 w-4" />{torch ? "Torch off" : "Torch on"}</Button>}
      </div>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Keep the QR inside the box and hold steady in good light. If blurry, move the card slightly farther away. “Recording” means the QR was read; wait for the saved confirmation. Then show the next card.</p>
    </div>
  );
}
