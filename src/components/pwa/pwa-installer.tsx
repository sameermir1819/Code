"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Sparkles, Smartphone, Share, MoreVertical, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Check if already running as installed app
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // 3. Detect device & OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Capture native beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Only show install UI when the user explicitly clicks an install button.
    const handleCustomOpen = () => {
      setShowBanner(true);
      if (!deferredPrompt) {
        setShowGuideModal(true);
      }
    };
    window.addEventListener("futurex:open-install-modal", handleCustomOpen);

    // 6. Hide when installed
    const handleAppInstalled = () => {
      setShowBanner(false);
      setShowGuideModal(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log("[PWA] App installed successfully!");
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("futurex:open-install-modal", handleCustomOpen);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
        setShowGuideModal(false);
      }
      setDeferredPrompt(null);
    } else {
      // If beforeinstallprompt hasn't fired or on iOS / in-app browser, show guided steps
      setShowGuideModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem("futurex_pwa_banner_closed_session", "true");
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* ── 1. BOTTOM FLOATING INSTALL BANNER ── */}
      {showBanner && (
        <aside
          aria-label="Install Student App"
          className="fixed bottom-4 inset-x-3 sm:left-auto sm:right-6 sm:w-[380px] z-50 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
        >
          <div className="relative rounded-2xl bg-[#090d18]/95 backdrop-blur-2xl border border-indigo-500/40 p-4 shadow-2xl shadow-black/90 text-white flex flex-col gap-3">
            {/* Close Button */}
            <button
              onClick={handleDismissBanner}
              className="absolute right-2.5 top-2.5 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content Header */}
            <div className="flex items-center gap-3 pr-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/30 shrink-0">
                <div className="w-full h-full rounded-[10px] bg-[#090e1a] flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icon-192.png"
                    alt="Futurex App Logo"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/logo.png";
                    }}
                  />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-xs tracking-tight text-white">
                    Futurex Student App
                  </h4>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                    Official PWA
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug line-clamp-2">
                  Install for 1-tap access to attendance, test scores &amp; DPPs.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{deferredPrompt ? "Install App Now" : "Add to Phone"}</span>
              </button>
              <button
                type="button"
                onClick={handleDismissBanner}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── 2. STEP-BY-STEP MANUAL INSTALL MODAL ── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-[#0c101c] border border-white/15 rounded-3xl p-6 shadow-2xl shadow-black/90 space-y-4 text-white">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">
                Install on Your Phone
              </h3>
              <p className="text-xs text-zinc-400">
                Add Futurex Student App directly to your home screen in 2 quick steps:
              </p>
            </div>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    Tap the <strong>Share</strong> button{" "}
                    <Share className="inline w-3.5 h-3.5 text-indigo-400 mx-0.5" /> at the
                    bottom of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    Scroll down and tap{" "}
                    <strong className="text-white">Add to Home Screen</strong>.
                  </p>
                </div>
              </div>
            ) : (
              /* Android Chrome Instructions */
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    Tap the <strong>three dots</strong>{" "}
                    <MoreVertical className="inline w-3.5 h-3.5 text-indigo-400 mx-0.5" /> at
                    the top right of Chrome.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    Tap <strong className="text-white">Install app</strong> or{" "}
                    <strong className="text-white">Add to Home screen</strong>.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
