"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/server/actions/auth";
import { InstituteLogo } from "@/components/ui/institute-logo";
import {
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  User,
  Phone,
  BookOpen,
  CalendarCheck2,
  Clock,
  GraduationCap,
  MapPin,
  FileCheck2,
  Shield,
  HelpCircle,
} from "lucide-react";

interface CourseItem {
  id: string;
  name: string;
  code: string;
  duration?: string | null;
  standardFee?: number;
}

interface CampusItem {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  phone?: string | null;
}

interface StudentPortalLandingProps {
  logoUrl: string | null;
  instituteName: string;
  tagline: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  campuses?: CampusItem[];
  courses: CourseItem[];
}

export function StudentPortalLanding({
  logoUrl,
  instituteName,
  tagline,
  city = "Srinagar",
  phone = "+91 98765 43210",
  campuses = [],
  courses = [],
}: StudentPortalLandingProps) {
  const router = useRouter();

  // ── Login State ──
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isLoginPending, startLoginTransition] = useTransition();

  // ── Handle Login ──
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    startLoginTransition(async () => {
      const res = await loginUser({ identifier, password });
      if (res.success) {
        if (res.user?.role === "STUDENT") {
          router.push("/portal");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      } else {
        setLoginError(
          res.error || "Authentication failed. Please verify your Student Code and password."
        );
      }
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#06080f] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col justify-between relative p-3 sm:p-5 lg:px-10 lg:py-4">
      {/* ── Ambient Background Glows ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[750px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-purple-600/10 blur-[130px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* ── Top Header / Navbar ── */}
      <header className="relative z-10 w-full flex items-center justify-between py-1 shrink-0 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/30">
            <div className="w-full h-full rounded-[10px] bg-[#090e1a] flex items-center justify-center text-white overflow-hidden">
              <InstituteLogo logoUrl={logoUrl} name={instituteName} size={28} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight block leading-tight">
                {instituteName}
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-400">
                Student Portal
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 -mt-0.5 flex items-center gap-1.5">
              <span>{city || "Academic Center"}</span>
              {campuses.length > 0 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400">
                    {campuses.map((c) => c.code || c.name).join(" & ")}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Header Action Buttons: Home & Apply for Admission */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-all font-medium"
          >
            ← Home
          </Link>

          <Link
            href="/apply"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Apply for Admission</span>
          </Link>
        </div>
      </header>

      {/* ── Main Viewport Center Area (100vh Single Viewport) ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-2 min-h-0">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* ── Left Column: Student Landing Presentation & Options ── */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-4 text-left pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 w-fit">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Official Student Learning &amp; Academic Hub</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              One Unified Portal for Your Complete Academic Journey.
            </h1>

            <p className="text-xs xl:text-sm text-zinc-300 leading-relaxed max-w-xl">
              Access your scheduled test series, instant OMR scorecards, chapter-wise
              DPPs, lecture notes vault, and live attendance ledger anytime, anywhere.
            </p>

            {/* Prominent Action Buttons (Clear Separate Options) */}
            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/apply"
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Apply for Admission 2026-2027</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-zinc-300 text-xs">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-white">Hawal &amp; Parraypora</span>
                <span className="text-zinc-500">Campuses</span>
              </div>
            </div>

            {/* 4 Feature Pillars */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 max-w-lg">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Test Series &amp; OMR</h4>
                  <p className="text-[10px] text-zinc-400">Scorecards &amp; rank analysis</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Live Attendance</h4>
                  <p className="text-[10px] text-zinc-400">Class presence logs</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Study Notes Vault</h4>
                  <p className="text-[10px] text-zinc-400">Formula sheets &amp; DPPs</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Digital Smart ID</h4>
                  <p className="text-[10px] text-zinc-400">Verified QR student pass</p>
                </div>
              </div>
            </div>

            {/* Helpline contact */}
            <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Admissions Desk: <strong className="text-zinc-200 font-mono">{phone}</strong></span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-medium">Counselor Support</span>
            </div>
          </div>

          {/* ── Right Column: Dedicated Student Login Card ── */}
          <div className="w-full lg:col-span-5 max-w-[420px] mx-auto">
            <div className="rounded-3xl bg-[#0d121d]/90 backdrop-blur-2xl border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden flex flex-col justify-between">
              
              <div className="p-6 sm:p-7 space-y-4">
                {/* Header in Card */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-400">
                      <GraduationCap className="w-3 h-3" />
                      <span>Enrolled Student Sign In</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white">Student Sign In</h3>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Enter your assigned Student Code or registered roll number to enter your academic dashboard.
                  </p>
                </div>

                {/* Login Error */}
                {loginError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-[11px]">{loginError}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Student Code / Roll Number
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. STU-2026-0001"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your portal password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-3 w-3 rounded border-white/20 bg-white/5 text-indigo-500 accent-indigo-500 cursor-pointer"
                      />
                      <span>Remember device</span>
                    </label>
                    <span className="text-[10px] text-zinc-500">First time login uses default pass</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoginPending}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-1"
                  >
                    {isLoginPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In to Student Portal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* ── Separate Option: Apply for Admission Online ── */}
                <div className="pt-3 border-t border-white/10">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-blue-950/40 border border-indigo-500/20 flex items-center justify-between gap-3">
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">New Admission 2026?</span>
                      <span className="text-[10px] text-zinc-400 block">Apply online &amp; select campus</span>
                    </div>
                    <Link
                      href="/apply"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1 active:scale-[0.98]"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="pt-1 text-center">
                  <p className="text-[11px] text-zinc-500">
                    Trouble signing in? Contact your center coordinator or call{" "}
                    <span className="text-zinc-300 font-mono">{phone}</span>
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ── Bottom Footer / Copyright ── */}
      <footer className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 border-t border-white/5 pt-2 shrink-0">
        <p>© {new Date().getFullYear()} {instituteName}. Official Student Academic Portal.</p>
        <div className="flex items-center gap-4 mt-1 sm:mt-0 text-[10px] text-zinc-400">
          <span>Hawal Campus</span>
          <span>•</span>
          <span>Parraypora Campus</span>
          <span>•</span>
          <Link href="/apply" className="text-indigo-400 hover:underline">
            Admissions 2026
          </Link>
        </div>
      </footer>
    </div>
  );
}
