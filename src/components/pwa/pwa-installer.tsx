"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Sparkles, Smartphone, Share } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
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

    // 2. Check if already installed / running in standalone mode
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Check if user recently dismissed (within 2 days)
    const lastDismissed = localStorage.getItem("futurex_pwa_dismissed");
    if (lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 2) {
        return;
      }
    }

    // 5. Capture native beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 6. If iOS, show after 3 seconds on mobile
    let iosTimer: NodeJS.Timeout;
    if (isIosDevice && !isRunningStandalone) {
      iosTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 3500);
    }

    // 7. Hide when installed
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log("[PWA] App installed successfully!");
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("futurex_pwa_dismissed", Date.now().toString());
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <aside
      aria-label="Install Student App"
      className="fixed bottom-20 sm:bottom-6 inset-x-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="relative rounded-2xl bg-[#090d18]/95 backdrop-blur-2xl border border-indigo-500/30 p-4 shadow-2xl shadow-black/80 text-white flex flex-col gap-3">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute right-2.5 top-2.5 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Row */}
        <div className="flex items-center gap-3 pr-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/30 shrink-0">
            <div className="w-full h-full rounded-[10px] bg-[#090e1a] flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Futurex App Logo"
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-xs tracking-tight text-white">
                Futurex Student App
              </h4>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                1-Tap Install
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">
              Install for instant access to DPPs, OMR ranks &amp; attendance alerts.
            </p>
          </div>
        </div>

        {/* Action Row */}
        {deferredPrompt ? (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Official App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold"
            >
              Later
            </button>
          </div>
        ) : isIOS ? (
          <div className="pt-1.5 border-t border-white/10 flex items-center gap-2 text-[11px] text-indigo-300">
            <Share className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              Tap Safari Share button <span className="font-bold text-white">[⎙]</span> then select{" "}
              <strong className="text-white underline">Add to Home Screen</strong>.
            </span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
