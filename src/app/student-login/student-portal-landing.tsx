"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  CheckCircle2,
  X,
  FileText,
  CreditCard,
  MessageCircle,
  ChevronRight,
  Menu,
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

interface StudentPortalLandingProps {
  logoUrl: string | null;
  instituteName: string;
  tagline: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  campuses?: CampusItem[];
  courses: CourseItem[];
  testSeries?: TestSeriesItem[];
}

export function StudentPortalLanding({
  logoUrl,
  instituteName,
  tagline,
  city = "Srinagar",
  phone = "+91 98765 43210",
  email = "admissions@futurexlearning.com",
  campuses = [],
  courses = [],
  testSeries = [],
}: StudentPortalLandingProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Modal State ──
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Login Form State ──
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isLoginPending, startLoginTransition] = useTransition();

  // Auto-open modal if URL specifies ?login=true or ?action=login
  useEffect(() => {
    if (searchParams?.get("login") === "true" || searchParams?.get("action") === "login") {
      setIsLoginModalOpen(true);
    }
  }, [searchParams]);

  // Handle Login submission
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
          res.error || "Authentication failed. Please verify your Student Code / Mobile number and password."
        );
      }
    });
  };

  return (
    <div id="top" className="min-h-screen w-full bg-[#06080f] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* ── Ambient Background Lighting ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[150px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-blue-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-purple-600/10 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
      </div>

      {/* ── Sticky Top Navigation ── */}
      <header className="sticky top-0 z-40 w-full bg-[#06080f]/80 backdrop-blur-xl border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Institute Branding */}
          <Link href="/home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[10px] bg-[#090e1a] flex items-center justify-center text-white overflow-hidden">
                <InstituteLogo logoUrl={logoUrl} name={instituteName} size={30} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
                  {instituteName}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-bold text-indigo-300">
                  Home
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium -mt-0.5">
                <span>Kashmir</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">Hawal &amp; Parraypora</span>
              </p>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-300">
            <a href="#top" className="text-white hover:text-indigo-300 transition-colors font-bold">
              Home
            </a>
            <a href="#portal-features" className="hover:text-white transition-colors">
              Portal Features
            </a>
            <a href="#test-series" className="hover:text-white transition-colors">
              Test Series
            </a>
            <a href="#campuses" className="hover:text-white transition-colors">
              Campuses
            </a>
            <a href="#help" className="hover:text-white transition-colors">
              Helpline
            </a>
          </nav>

          {/* Action Buttons: Sign In & Apply */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white font-semibold text-xs border border-white/15 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Student Login</span>
            </button>

            <Link
              href="/apply"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Apply for Admission</span>
              <span className="sm:hidden">Apply</span>
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white md:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#090e1a] px-4 py-3 space-y-2 text-sm text-zinc-300">
            <a
              href="#top"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-white font-bold"
            >
              Home
            </a>
            <a
              href="#portal-features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-white"
            >
              Portal Features
            </a>
            <a
              href="#test-series"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-white"
            >
              Test Series
            </a>
            <a
              href="#campuses"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-white"
            >
              Campuses &amp; Centers
            </a>
            <a
              href="#help"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-white"
            >
              Student Helpline
            </a>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Admissions Open 2026-27</span>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="text-xs text-indigo-400 font-bold"
              >
                Student Sign In →
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Landing Body Content ── */}
      <main className="relative z-10 flex-1">
        {/* ── 1. Hero Section ── */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-blue-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Official Student Learning &amp; Academic Self-Service Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Your Complete Academic Journey, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
              Streamlined in One Portal.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to the digital gateway for enrolled scholars and new applicants.
            Check instant OMR scorecards, track classroom attendance, download chapter DPPs,
            review fee statements, or submit your online admission application.
          </p>

          {/* Primary Action Buttons: Student Login & Apply Now */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-white/10 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Student Sign In / Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/apply"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Apply for Admission (Session 2026-2027)</span>
            </Link>
          </div>

          {/* Trust KPI Strip */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur text-left">
              <span className="text-xl font-bold text-white block">100% OMR</span>
              <span className="text-xs text-zinc-400 mt-0.5 block">Instant Rank &amp; Question Analysis</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur text-left">
              <span className="text-xl font-bold text-emerald-400 block">Daily QR Scan</span>
              <span className="text-xs text-zinc-400 mt-0.5 block">Class Attendance &amp; SMS Alerts</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur text-left">
              <span className="text-xl font-bold text-indigo-400 block">Digital DPPs</span>
              <span className="text-xs text-zinc-400 mt-0.5 block">Formula Books &amp; Study Vault</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur text-left">
              <span className="text-xl font-bold text-purple-400 block">Smart ID Card</span>
              <span className="text-xs text-zinc-400 mt-0.5 block">Digital Pass &amp; Fee Receipts</span>
            </div>
          </div>
        </section>

        {/* ── 2. Test Series Showcase Section ── */}
        <section id="test-series" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-2">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>All-India Major Mock Series</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Offline &amp; Computerized Test Series (Session 2026)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
                Real exam simulation conducted on genuine OMR sheets across our Srinagar testing centers.
                Scores and All-Kashmir rankings uploaded to the student portal on the same day.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-zinc-200 text-xs font-semibold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>View My Test Scores</span>
              </button>
            </div>
          </div>

          {/* Test Series Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testSeries.length > 0 ? (
              testSeries.map((ts) => (
                <div
                  key={ts.id}
                  className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-lg shadow-black/40"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wide">
                        {ts.targetExam}
                      </span>
                      <span className="font-mono text-xs text-zinc-400 font-semibold">
                        {ts.totalTests} Full Tests
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {ts.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 font-mono">
                      Series Code: {ts.code}
                    </p>

                    <div className="mt-3.5 pt-3 border-t border-white/[0.06] space-y-1.5 text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{ts.testCenterVenue || "Hawal & Parraypora Centers"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>OMR &amp; CBT Standard Assessment</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Registration</span>
                      <span className="text-base font-extrabold text-white">₹{ts.fee}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsLoginModalOpen(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/10 transition-all"
                      >
                        Scorecard
                      </button>
                      <Link
                        href={`/apply?interest=${encodeURIComponent(ts.title)}`}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1"
                      >
                        <span>Enroll</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Default Fallback Test Series Cards
              <>
                <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-lg shadow-black/40">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                        NEET 2026
                      </span>
                      <span className="font-mono text-xs text-zinc-400 font-semibold">12 Major Tests</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      All-Kashmir NEET Major Mock Test Series
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Full 720-marks NTA pattern simulation with instant OMR ranks.</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-base font-extrabold text-white">₹2,500</span>
                    <Link
                      href="/apply?interest=NEET+Test+Series"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1"
                    >
                      <span>Enroll Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-lg shadow-black/40">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wide">
                        JEE 2026
                      </span>
                      <span className="font-mono text-xs text-zinc-400 font-semibold">10 Major Tests</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      JEE Main &amp; Advanced Rank Booster Drill
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Computerized &amp; pen-paper mock series with detailed error analysis.</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-base font-extrabold text-white">₹2,500</span>
                    <Link
                      href="/apply?interest=JEE+Test+Series"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1"
                    >
                      <span>Enroll Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-lg shadow-black/40">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wide">
                        Foundation 10th
                      </span>
                      <span className="font-mono text-xs text-zinc-400 font-semibold">8 Chapter Drills</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Class 9th &amp; 10th Science &amp; Maths Olympiad
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Foundational competitive preparation and board exam benchmarks.</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-base font-extrabold text-white">₹1,800</span>
                    <Link
                      href="/apply?interest=Foundation+Test+Series"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1"
                    >
                      <span>Enroll Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── 3. Four Core Student Services Pillars ── */}
        <section id="portal-features" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              What You Get in Your Student Cloud
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
              Designed specifically for high-achieving Kashmir students preparing for competitive entrance examinations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-indigo-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Instant OMR Rank Cards</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Scan your performance metrics, subject accuracy, negative-marking analysis, and batch leaderboards.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Classroom QR Attendance</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Every lecture punch is registered live. Track your overall monthly attendance percentage and leave records.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Daily Practice Vault (DPPs)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Download high-yield question sets, revision flashcards, and homework DPPs directly to your phone.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Smart ID &amp; Fee Receipts</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Access your digital photo ID pass, fee installment schedules, and download computerized fee tax receipts.
              </p>
            </div>
          </div>
        </section>

        {/* ── 4. Srinagar Dual Campuses ── */}
        <section id="campuses" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Physical Testing &amp; Counseling Campuses
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Visit our counseling desks in person or connect directly via phone helpline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  Center Code: FL-HWL-01
                </span>
                <span className="text-xs text-zinc-400 font-mono">Downtown Center</span>
              </div>
              <h3 className="text-lg font-bold text-white">Hawal Campus, Srinagar</h3>
              <p className="text-xs text-zinc-300">
                Opposite Islamia College Main Gate, Hawal, Srinagar, Jammu &amp; Kashmir 190002
              </p>
              <div className="pt-2 flex items-center gap-3">
                <a
                  href={`tel:${phone}`}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 flex items-center gap-1.5"
                >
                  <Phone className="w-3 h-3 text-indigo-400" />
                  <span>Call Hawal Desk</span>
                </a>
                <Link
                  href="/apply?campus=Hawal"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Apply Here
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Center Code: FL-PRP-02
                </span>
                <span className="text-xs text-zinc-400 font-mono">South City Center</span>
              </div>
              <h3 className="text-lg font-bold text-white">Parraypora Campus, Srinagar</h3>
              <p className="text-xs text-zinc-300">
                Coaching Hub, Near Airport Road, Parraypora, Srinagar, Jammu &amp; Kashmir 190005
              </p>
              <div className="pt-2 flex items-center gap-3">
                <a
                  href={`tel:${phone}`}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 flex items-center gap-1.5"
                >
                  <Phone className="w-3 h-3 text-purple-400" />
                  <span>Call Parraypora Desk</span>
                </a>
                <Link
                  href="/apply?campus=Parraypora"
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                >
                  Apply Here
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Quick Support & Help Callout ── */}
        <section id="help" className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-white/[0.06] text-center space-y-4">
          <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-blue-950/40 border border-indigo-500/25 space-y-3">
            <h3 className="text-xl font-bold text-white">Need Help Accessing Your Portal?</h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
              If your student ID is not recognized, or if you forgot your portal password,
              please reach out to the campus registrar or message us on WhatsApp with your admission slip.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <a
                href={`https://wa.me/91${(phone || "9876543210").replace(/\D/g, "")}?text=Hello%20Futurex%20Learning%2C%20I%20need%20help%20with%20my%20Student%20Portal%20Login.`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Helpline</span>
              </a>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Open Login Window</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Bottom Footer ── */}
      <footer className="relative z-10 w-full bg-[#05070d] border-t border-white/5 py-6 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{instituteName}</span>
            <span>•</span>
            <span>Student Portal 2026</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a href="#top" className="hover:text-white transition-colors font-medium">
              Home
            </a>
            <span>•</span>
            <Link href="/apply" className="hover:text-white transition-colors text-indigo-400 font-semibold">
              Apply Online 2026
            </Link>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="hover:text-white transition-colors text-indigo-300 font-semibold cursor-pointer"
            >
              Sign In
            </button>
          </div>

          <p className="text-[10px] text-zinc-600">
            &copy; {new Date().getFullYear()} {instituteName}. All rights reserved.
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
              className="absolute right-4 top-4 p-1.5 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex p-2 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner mb-0.5">
                <InstituteLogo logoUrl={logoUrl} name={instituteName} size={36} />
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
