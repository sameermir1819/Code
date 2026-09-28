import { SCAN_COOLDOWN_SECONDS } from "./attendance-scanner";

type Decoder = (data: Uint8ClampedArray, width: number, height: number, options: { inversionAttempts: "dontInvert" }) => { data: string } | null;

// A card held in front of the lens must not turn check-in into check-out.
// It must leave the frame before being accepted again, even after cooldown.
export function createCameraScanGate() {
  const cards = new Map<string, { seen: number; submitted: number }>();
  let lastSubmission = -Infinity;
  return (code: string, now = Date.now()) => {
    const previous = cards.get(code);
    if (previous && (now - previous.seen < 1200 || now - previous.submitted < SCAN_COOLDOWN_SECONDS * 1000)) {
      cards.set(code, { ...previous, seen: now });
      return false;
    }
    if (now - lastSubmission < 1200) return false;
    cards.set(code, { seen: now, submitted: now });
    lastSubmission = now;
    for (const [key, value] of cards) if (now - value.seen > 5 * 60 * 1000) cards.delete(key);
    return true;
  };
}

export function cameraErrorMessage(error: unknown) {
  const name = error && typeof error === "object" && "name" in error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera permission denied. Allow camera access in your browser's site settings, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No usable camera was found. Try another device or use the USB scanner.";
  if (name === "NotReadableError" || name === "AbortError") return "Camera could not start. Close other apps using it, then try again.";
  return "Camera could not start. Check camera access and try again.";
}

export function createCameraSession(video: HTMLVideoElement, decode: Decoder, onScan: (code: string) => void, onError: (error: unknown) => void) {
  let stopped = false;
  let stream: MediaStream | null = null;
  let timer: number | undefined;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const accept = createCameraScanGate();

  function stop() {
    stopped = true;
    window.clearTimeout(timer);
    const activeStream = stream;
    stream = null;
    activeStream?.getTracks().forEach((track) => track.stop());
    if (activeStream && video.srcObject === activeStream) { video.pause(); video.srcObject = null; }
  }

  function frame() {
    if (stopped) return;
    try {
      if (context && video.readyState >= 2 && video.videoWidth && video.videoHeight) {
        const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = decode(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
        if (result?.data && accept(result.data)) onScan(result.data);
      }
    } catch (error) {
      stop();
      onError(error);
      return;
    }
    if (!stopped) timer = window.setTimeout(frame, 200);
  }

  return {
    async start() {
      try {
        if (!context) throw new Error("Camera preview unavailable");
        const acquired = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (stopped) { acquired.getTracks().forEach((track) => track.stop()); return false; }
        stream = acquired;
        video.srcObject = stream;
        await video.play();
        if (stopped) return false;
        frame();
        return !stopped;
      } catch (error) {
        const cancelled = stopped;
        stop();
        if (!cancelled) throw error;
        return false;
      }
    },
    stop,
    getTrack: () => stream?.getVideoTracks()[0],
  };
}
