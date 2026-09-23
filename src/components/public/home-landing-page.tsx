"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";

interface CampusItem {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface CourseItem {
  id: string;
  name: string;
  code: string;
  gradeClass?: string | null;
  duration?: string | null;
  standardFee?: number | null;
  description?: string | null;
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
  courses: CourseItem[];
  studentCount?: number;
}

export function HomeLandingPage({
  institute,
  campuses = [],
  courses = [],
  studentCount = 1250,
}: HomeLandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const instName = institute?.name || "Futurex Learning";
  const instCity = institute?.city || "Srinagar";
  const helpline = institute?.phone || "+91 98765 43210";
  const cleanHelpline = helpline.replace(/[^\d]/g, "");

  return (
    <div className="min-h-screen bg-[#06080f] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* ── Ambient Background Lighting ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-2/3 -right-40 w-[500px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* ── STICKY TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#06080f]/85 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Institute Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[10px] bg-[#090e1a] flex items-center justify-center text-white overflow-hidden">
                <InstituteLogo logoUrl={institute?.logoUrl} name={instName} size={30} />
              </div>
            </div>
            <div>
              <span className="font-black text-white text-base sm:text-lg tracking-tight block leading-tight group-hover:text-indigo-300 transition-colors">
                {instName}
              </span>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 -mt-0.5">
                <span className="font-semibold text-indigo-400">Kashmir</span>
                <span className="text-zinc-600">•</span>
                <span>Hawal &amp; Parraypora</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-zinc-300">
            <a href="#courses" className="hover:text-white transition-colors">
              Programs &amp; Batches
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Student Cloud
            </a>
            <a href="#test-series" className="hover:text-white transition-colors">
              OMR Test Series
            </a>
            <a href="#campuses" className="hover:text-white transition-colors">
              Campuses
            </a>
            <a href="#contact" className="hover:text-white transition-colors">
              Counseling Desk
            </a>
          </nav>

          {/* Desktop Action Buttons: Student Login & Apply Now */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/student-login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 transition-all shadow-sm"
            >
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Student Login</span>
            </Link>

            <Link
              href="/apply"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Apply Online 2026</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/apply"
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 text-white"
            >
              Apply
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden px-4 pt-3 pb-6 border-b border-white/10 bg-[#070a14] space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-medium text-zinc-300">
              <a
                href="#courses"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-white/5"
              >
                Programs &amp; Batches
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
              <Link
                href="/student-login"
                className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 text-center"
              >
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Student Login</span>
              </Link>
              <Link
                href="/apply"
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 text-center shadow-md shadow-indigo-600/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Apply Online</span>
              </Link>
            </div>

            <div className="text-center pt-1">
              <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-300">
                Staff / Faculty Administrative Login →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 1. HERO SECTION ── */}
      <section className="relative z-10 pt-10 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Eyebrow Notification Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-6 shadow-sm">
          <Sparkle className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Admissions Open for Session 2026-2027 • Hawal &amp; Parraypora</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline" />
        </div>

        {/* Master Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15] sm:leading-[1.12]">
          Kashmir&apos;s Premier Academy for{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
            NEET, JEE &amp; Foundation
          </span>{" "}
          Excellence.
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base lg:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Top-tier faculty, exhaustive daily practice papers (DPPs), computerized OMR test series,
          and a digital student portal for live performance tracking.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <Link
            href="/apply"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Apply for Admission (2026)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/student-login"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-sm border border-white/15 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Student Portal Sign In</span>
          </Link>
        </div>

        {/* Quick Highlights Strip (Hawal & Parraypora) */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hawal Srinagar Campus</span>
          </span>
          <span className="text-zinc-700">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Parraypora Srinagar Campus</span>
          </span>
          <span className="text-zinc-700">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct Counselor Callback</span>
          </span>
        </div>

        {/* 4 Pillars Trust Metrics Bar */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">15,000+</div>
            <div className="text-xs font-semibold text-indigo-400 mt-1">Scholars Mentored</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Across Kashmir Valley</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">98.4%</div>
            <div className="text-xs font-semibold text-emerald-400 mt-1">Board &amp; Qualifying Rate</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Class 10th, 11th &amp; 12th</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-purple-400 tracking-tight">Top 50</div>
            <div className="text-xs font-semibold text-purple-400 mt-1">State Ranks Produced</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">In NEET &amp; JEE Advanced</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">2 Campuses</div>
            <div className="text-xs font-semibold text-amber-300 mt-1">Hawal &amp; Parraypora</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Full AC, Smart Classrooms</p>
          </div>
        </div>
      </section>

      {/* ── 2. ACADEMIC PROGRAMS SHOWCASE ── */}
      <section id="courses" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">
            Target Batches 2026-2027
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Tailored Competitive &amp; Board Programs
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Scientifically crafted curriculum covering exhaustive NCERT concepts, national-level question banks, and weekly rank mock tests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div
                key={course.id}
                className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 flex flex-col justify-between hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {course.code || "TARGET BATCH"}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      {course.duration || "Annual Session"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {course.name}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {course.description || "Comprehensive coaching with daily practice papers, chapter revision notes, and specialized doubt removal sessions."}
                  </p>

                  <div className="space-y-1.5 pt-2 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Class: {course.gradeClass || "11th / 12th / Dropper"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Printed Modules &amp; OMR Test Series</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Digital Student Portal Access</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Standard Fee</span>
                    <span className="font-extrabold text-sm sm:text-base text-white">
                      {formatCurrency(course.standardFee || 100000)}
                    </span>
                  </div>

                  <Link
                    href={`/apply?course=${encodeURIComponent(course.name)}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/25 active:scale-95"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Fallback Cards if DB courses are loading */}
              <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  NEET MEDICAL
                </span>
                <h3 className="text-lg font-bold text-white">NEET Medical Target 2026-2027</h3>
                <p className="text-xs text-zinc-400">Class 11, 12 &amp; Dropper batches with daily Biology, Chemistry and Physics drills.</p>
                <Link href="/apply" className="block text-center py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white">Apply Online</Link>
              </div>
              <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  JEE ENGINEERING
                </span>
                <h3 className="text-lg font-bold text-white">JEE Main &amp; Advanced 2-Year</h3>
                <p className="text-xs text-zinc-400">Rigorous problem solving, calculus drills, and national mock rank assessments.</p>
                <Link href="/apply" className="block text-center py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white">Apply Online</Link>
              </div>
              <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  FOUNDATION
                </span>
                <h3 className="text-lg font-bold text-white">Class 9th &amp; 10th Olympiad + Board</h3>
                <p className="text-xs text-zinc-400">Solid fundamental conceptual clarity for NTSE, Olympiads, and future competitive edge.</p>
                <Link href="/apply" className="block text-center py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white">Apply Online</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── 3. STUDENT PORTAL DIGITAL EXPERIENCE ── */}
      <section id="features" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 inline-block">
              Technology-Driven Learning
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              One Smart Portal for Your Complete Academic Life.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Every enrolled student at Futurex Learning receives personal credentials to our official Scholar Portal. No guessing, no lost notes—everything is tracked with real-time academic transparency.
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
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">Digital QR Smart ID Badge</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Verified digital pass for campus access, library checkout, and biometric attendance.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/student-login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs shadow-lg transition-all"
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Sign In to Student Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Showcase Box */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-gradient-to-b from-[#0c101c] to-[#070913] border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-zinc-400 ml-2">portal.futurexlearning.com</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  LIVE STATUS
                </span>
              </div>

              {/* Sample Dashboard Mock Card */}
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

                {/* Big Portal Callout Button */}
                <div className="p-4 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-center space-y-2">
                  <h4 className="text-xs font-bold text-white">Are you an enrolled student for 2026?</h4>
                  <p className="text-[11px] text-zinc-300">Sign in with your Student Code to access your daily dashboard.</p>
                  <Link
                    href="/student-login"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
                  >
                    <span>Open Student Login Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── 4. DUAL CAMPUSES IN SRINAGAR ── */}
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
                Coaching Hub Corridor, Airport Road, Parraypora Srinagar, Kashmir - 190014
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
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center shadow-md shadow-indigo-600/30 transition-all"
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

      {/* ── 5. FINAL CALL TO ACTION BANNER ── */}
      <section id="contact" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-blue-950/60 border border-indigo-500/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Session 2026-2027 Registrations
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Begin Your Preparation Today.
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

            <Link
              href="/student-login"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Student Login</span>
            </Link>
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
                  Online Admission Application
                </Link>
              </li>
              <li>
                <Link href="/student-login" className="hover:text-indigo-400 transition-colors">
                  Enrolled Student Portal Login
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors">
                  Faculty &amp; Staff Login
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Centers</h4>
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
    </div>
  );
}
