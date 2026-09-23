"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/server/actions/auth";
import { formatCurrency } from "@/lib/utils";
import { InstituteLogo } from "@/components/ui/institute-logo";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileCheck2,
  CalendarCheck2,
  ShieldCheck,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
  ExternalLink,
  Target,
  FileText,
  BarChart3,
  Layers,
  Sparkle,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  User,
} from "lucide-react";

interface CampusItem {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface TestSeriesItem {
  id: string;
  title: string;
  code: string;
  targetExam: string;
  fee: number;
  totalTests: number;
  startDate?: Date | string;
  endDate?: Date | string;
  testCenterVenue?: string | null;
}

interface InstituteInfo {
  id: string;
  name: string;
  logoUrl?: string | null;
  tagline?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  address?: string | null;
}

interface HomeLandingPageProps {
  institute: InstituteInfo | null;
  campuses: CampusItem[];
  testSeries?: TestSeriesItem[];
  studentCount?: number;
}

export function HomeLandingPage({
  institute,
  campuses = [],
  testSeries = [],
  studentCount = 1250,
}: HomeLandingPageProps) {
  const router = useRouter();

  // Navigation & Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Student Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isLoginPending, startLoginTransition] = useTransition();

  const instName = institute?.name || "Futurex Learning";
  const instCity = institute?.city || "Srinagar";
  const helpline = institute?.phone || "+91 98765 43210";
  const cleanHelpline = helpline.replace(/[^\d]/g, "");

  // Handle Student Login Submission
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
          res.error || "Authentication failed. Please verify your Student Code / Mobile and password."
        );
      }
    });
  };

  return (
    <div id="top" className="min-h-screen bg-[#06080f] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* ── Ambient Background Lighting ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-2/3 -right-40 w-[500px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* ── STICKY TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#06080f]/85 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Institute Title */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full rounded-[10px] bg-[#090e1a] flex items-center justify-center text-white overflow-hidden">
                <InstituteLogo logoUrl={institute?.logoUrl} name={instName} size={28} />
              </div>
            </div>
            <div className="min-w-0">
              <span className="font-black text-white text-sm sm:text-lg tracking-tight block leading-tight group-hover:text-indigo-300 transition-colors truncate max-w-[130px] xs:max-w-[170px] sm:max-w-none">
                {instName}
              </span>
              <span className="text-[10px] sm:text-[11px] text-zinc-400 flex items-center gap-1 sm:gap-1.5 -mt-0.5 truncate">
                <span className="font-semibold text-indigo-400">Kashmir</span>
                <span className="text-zinc-600">•</span>
                <span className="truncate">Hawal &amp; Parraypora</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-zinc-300">
            <a href="#test-series" className="hover:text-white transition-colors">
              Offline Test Series
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Student Cloud
            </a>
            <a href="#campuses" className="hover:text-white transition-colors">
              Campuses
            </a>
            <a href="#contact" className="hover:text-white transition-colors">
              Counseling Desk
            </a>
          </nav>

          {/* Desktop Action Buttons: Student Login & Apply Now */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 transition-all shadow-sm cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Student Login</span>
            </button>

            <Link
              href="/apply"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Apply Online 2026</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Right Action Controls */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-white/15 text-white flex items-center gap-1 border border-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>Login</span>
            </button>
            <Link
              href="/apply"
              className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 active:scale-95 transition-all"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Apply</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white active:scale-95 transition-all"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-indigo-300" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden px-4 pt-3 pb-6 border-b border-white/10 bg-[#070a14] space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-medium text-zinc-300">
              <a
                href="#test-series"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-white/5"
              >
                Offline Test Series &amp; OMR
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-white/5"
              >
                Student Portal Features
              </a>
              <a
                href="#test-series"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-white/5"
              >
                Test Series &amp; OMR
              </a>
              <a
                href="#campuses"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-white/5"
              >
                Campuses (Hawal &amp; Parraypora)
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-white/5"
              >
                Contact &amp; Helpline
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 text-center cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Student Login</span>
              </button>
              <Link
                href="/apply"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 text-center shadow-md shadow-indigo-600/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Apply Online</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 1. HERO SECTION ── */}
      <section className="relative z-10 pt-10 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-6 shadow-sm">
          <Sparkle className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Admissions Open for Session 2026-2027 • Hawal &amp; Parraypora</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline" />
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15] sm:leading-[1.12]">
          Build High-Yield Ranks in{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            NEET, JEE &amp; Foundation
          </span>
        </h1>

        <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Kashmir&apos;s leading competitive coaching platform with offline classrooms, OMR test series, daily problem sheets (DPPs), and transparent student progress tracking.
        </p>

        {/* Dual Primary Call-to-Actions */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Student Portal Sign In</span>
          </button>

          <Link
            href="/apply"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Apply for Admission</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* KPI Counter Pills */}
        <div className="mt-14 sm:mt-18 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">Classroom Scholars</span>
            <p className="text-xl sm:text-2xl font-black text-white">{studentCount}+ Active</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">NEET/JEE Faculty</span>
            <p className="text-xl sm:text-2xl font-black text-indigo-400">100% Ex-Kota &amp; NIT</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">Srinagar Centers</span>
            <p className="text-xl sm:text-2xl font-black text-purple-400">Hawal &amp; Parraypora</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">OMR Test Drill</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400">Daily Analytics</p>
          </div>
        </div>
      </section>

      {/* ── 2. TEST SERIES & OMR SHOWCASE ── */}
      <section id="test-series" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">
            Rank Booster Drills
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Official All-Kashmir Test Series
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Pen-and-paper OMR drills mapped exactly to NTA NEET &amp; JEE patterns with real-time statewide percentile cards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testSeries && testSeries.length > 0 ? (
            testSeries.map((ts) => (
              <div
                key={ts.id}
                className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                      {ts.targetExam}
                    </span>
                    <span className="font-mono text-xs text-zinc-400 font-semibold">
                      {ts.totalTests} Full Tests
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {ts.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2">
                    Venue: {ts.testCenterVenue || "Hawal & Parraypora Exam Centers"}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <span className="text-lg font-black text-white">
                    {formatCurrency(ts.fee)}
                  </span>
                  <Link
                    href={`/apply?interest=${encodeURIComponent(ts.title)}`}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <span>Enroll Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    NEET UG 2026
                  </span>
                  <span className="text-xs font-mono text-zinc-400">12 Full Tests</span>
                </div>
                <h3 className="text-lg font-bold text-white">NEET All-Kashmir Ranker Drill</h3>
                <p className="text-xs text-zinc-400">Complete NCERT Biology, Organic Chemistry, and Physics mechanics mock series.</p>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-lg font-black text-white">₹3,000</span>
                  <Link href="/apply?interest=NEET+Test+Series" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1">
                    <span>Enroll Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                    JEE MAIN 2026
                  </span>
                  <span className="text-xs font-mono text-zinc-400">10 Full Tests</span>
                </div>
                <h3 className="text-lg font-bold text-white">JEE Rank Accelerator Series</h3>
                <p className="text-xs text-zinc-400">Computerized &amp; pen-paper mock drill series with speed-accuracy error analysis.</p>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-lg font-black text-white">₹2,500</span>
                  <Link href="/apply?interest=JEE+Test+Series" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1">
                    <span>Enroll Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                    FOUNDATION
                  </span>
                  <span className="text-xs font-mono text-zinc-400">8 Chapter Tests</span>
                </div>
                <h3 className="text-lg font-bold text-white">Class 9th &amp; 10th Olympiad Benchmark</h3>
                <p className="text-xs text-zinc-400">Conceptual foundation test series for NTSE, Maths Olympiads and Board exams.</p>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-lg font-black text-white">₹1,800</span>
                  <Link href="/apply?interest=Foundation+Test+Series" className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1">
                    <span>Enroll Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── 4. STUDENT PORTAL DIGITAL EXPERIENCE ── */}
      <section id="features" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 inline-block">
              Technology-Driven Learning
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              One Smart Portal for Your Complete Academic Life.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Every enrolled student receives personal credentials to our official Scholar Portal. No lost notes, no unrecorded absences—everything is tracked with real-time academic transparency.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">OMR Test Scores &amp; Percentile Analysis</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Instant scorecard after each test drill with question-wise analysis and accuracy trends.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">Digital DPPs &amp; Study Notes Vault</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Download chapter-wise formula books, DPP sheets, and teacher annotations from anywhere.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">QR Code Attendance &amp; SMS Logs</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Automated biometric and QR attendance scanning with instant parental updates.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Mockup Card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-blue-950/40 border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-zinc-400 ml-2">portal.futurexlearning.com</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  STUDENT PORTAL
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                      ST
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">Aryan Sehgal</h4>
                      <p className="text-[10px] text-zinc-400 font-mono">Roll: STU-2026-0042 • NEET Medical</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    96.5% Attendance
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-400">Latest Mock Test</span>
                    <p className="font-bold text-white text-sm">645 / 720</p>
                    <span className="text-[10px] text-emerald-400">Rank #3 in Campus</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-400">Today&apos;s Lectures</span>
                    <p className="font-bold text-white text-sm">Physics &amp; Botany</p>
                    <span className="text-[10px] text-indigo-300">Room 204 • Hawal</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-center space-y-2">
                  <h4 className="text-xs font-bold text-white">Are you an enrolled student?</h4>
                  <p className="text-[11px] text-zinc-300">Sign in with your Student ID to access your daily timetable and scorecards.</p>
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Open Student Login Window</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. DUAL CAMPUSES IN SRINAGAR ── */}
      <section id="campuses" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
            Modern Physical Centers
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Two Prime Campuses in Srinagar
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Conveniently situated in Hawal and Parraypora with hi-tech smart classrooms, library facilities, and counseling helpdesks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Hawal Campus */}
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 sm:p-7 space-y-4 hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                HAWAL CENTER
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Admissions Desk Open
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Hawal Srinagar Campus</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Main Academic Complex, Near College Gate, Hawal Srinagar, Kashmir - 190002
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Center Code:</span>
                <span className="font-mono font-bold text-white">HAWAL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Contact:</span>
                <span className="font-mono text-zinc-200">{helpline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Hours:</span>
                <span>9:00 AM – 6:00 PM (Mon – Sat)</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Link
                href="/apply?campus=HAWAL"
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs text-center shadow-md transition-all"
              >
                Apply for Hawal Batch
              </Link>
              <a
                href={`tel:${cleanHelpline}`}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs text-center border border-white/10"
              >
                Call Desk
              </a>
            </div>
          </div>

          {/* Parraypora Campus */}
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 sm:p-7 space-y-4 hover:border-indigo-400/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                PARRAYPORA CENTER
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Admissions Desk Open
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Parraypora Srinagar Campus</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Educational Hub, Near Airport Road, Parraypora Srinagar, Kashmir - 190005
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Center Code:</span>
                <span className="font-mono font-bold text-white">PARRAYPORA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Contact:</span>
                <span className="font-mono text-zinc-200">{helpline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Hours:</span>
                <span>9:00 AM – 6:00 PM (Mon – Sat)</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Link
                href="/apply?campus=PARRAYPORA"
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center shadow-md transition-all"
              >
                Apply for Parraypora Batch
              </Link>
              <a
                href={`tel:${cleanHelpline}`}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs text-center border border-white/10"
              >
                Call Desk
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. COUNSELING & ADMISSIONS CALLOUT ── */}
      <section id="contact" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-white/5 text-center">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900/30 via-purple-900/30 to-blue-900/30 border border-white/10 p-8 sm:p-12 space-y-6">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Start Your NEET &amp; JEE Preparation for 2026
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300">
              Limited seats per classroom batch for optimal student-faculty ratio. Apply online or talk directly with our counselors.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/apply"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Submit Admission Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href={`https://wa.me/${cleanHelpline}?text=Hello%20${encodeURIComponent(instName)},%20I%20am%20interested%20in%20admission%20for%20the%202026-2027%20batch.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Admission Desk</span>
            </a>

            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Student Login</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10 bg-[#04060b] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <InstituteLogo logoUrl={institute?.logoUrl} name={instName} size={28} />
              <span className="font-extrabold text-white text-base tracking-tight">{instName}</span>
            </div>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Premier coaching institute &amp; academic operating system in Srinagar, Kashmir. Empowering students for NEET, JEE, and Olympiads with high-impact pedagogical training.
            </p>
            <div className="text-xs text-zinc-500 font-mono">
              <span>Helpline: </span>
              <a href={`tel:${cleanHelpline}`} className="text-zinc-300 hover:text-white">
                {helpline}
              </a>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Portals &amp; Links</h4>
            <ul className="space-y-1.5 text-zinc-400">
              <li>
                <Link href="/apply" className="hover:text-indigo-400 transition-colors">
                  Online Admission Application 2026
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="hover:text-indigo-400 transition-colors text-left cursor-pointer"
                >
                  Student Portal Login
                </button>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors">
                  Faculty &amp; Staff Login
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Campuses</h4>
            <ul className="space-y-1.5 text-zinc-400">
              <li>Hawal Campus, Srinagar</li>
              <li>Parraypora Campus, Srinagar</li>
              <li className="text-[10px] text-zinc-500 pt-1">Academic Session 2026-2027</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} {instName}. All Rights Reserved.</p>
          <p className="text-[11px] text-zinc-600 mt-2 sm:mt-0">
            Registered Coaching Institute &amp; Telecalling CRM Platform
          </p>
        </div>
      </footer>

      {/* ─── DEDICATED STUDENT LOGIN MODAL POPUP ─── */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0c101c]/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/90 space-y-4">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex p-2 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner mb-0.5">
                <InstituteLogo logoUrl={institute?.logoUrl} name={instName} size={36} />
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Student Portal Sign In
              </h3>
              <p className="text-xs text-zinc-400">
                Enter your Roll No, Student ID, or Registered Mobile
              </p>
            </div>

            {/* Error Banner */}
            {loginError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Student ID / Roll No / Phone
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. STU-2026-001 or 9876543210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Portal Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
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
                <span className="text-[10px] text-zinc-500">First-time login uses default PIN</span>
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

            {/* New Admission Option */}
            <div className="pt-3 border-t border-white/10 text-center">
              <p className="text-xs text-zinc-400">
                New student without an account?{" "}
                <Link
                  href="/apply"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Apply Online for 2026 Batch →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
