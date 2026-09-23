"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/server/actions/auth";
import { submitPublicAdmissionEnquiry } from "@/server/actions/leads";
import { InstituteLogo } from "@/components/ui/institute-logo";
import {
  GraduationCap,
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
  Award,
  QrCode,
  Clock,
  Layers,
  Send,
  CheckCircle2,
  MessageCircle,
  ChevronRight,
  ExternalLink,
  School,
} from "lucide-react";

interface CourseItem {
  id: string;
  name: string;
  code: string;
  duration?: string | null;
  standardFee?: number;
}

interface StudentPortalLandingProps {
  logoUrl: string | null;
  instituteName: string;
  tagline: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  courses: CourseItem[];
}

const CLASS_OPTIONS = [
  "Class 8th / Pre-Foundation",
  "Class 9th Foundation",
  "Class 10th Board + Olympiad",
  "Class 11th (Medical - NEET)",
  "Class 11th (Engineering - JEE)",
  "Class 12th (Board + Competitive)",
  "Dropper / Repeater (NEET Target)",
  "Dropper / Repeater (JEE Advanced Target)",
  "General / Other",
];

export function StudentPortalLanding({
  logoUrl,
  instituteName,
  tagline,
  city = "Srinagar",
  phone = "+91 98765 43210",
  email = "admissions@institute.com",
  courses,
}: StudentPortalLandingProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // ── Login State ──
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isLoginPending, startLoginTransition] = useTransition();

  // ── Sign Up / New Admission State ──
  const [signupForm, setSignupForm] = useState({
    name: "",
    phone: "",
    email: "",
    courseInterest: courses.length > 0 ? courses[0].name : "NEET Medical Target",
    currentClass: "Class 11th (Medical - NEET)",
    city: city || "Srinagar",
    notes: "",
  });
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState<{
    leadId: string;
    name: string;
    phone: string;
    course: string | null;
  } | null>(null);
  const [isSignupPending, startSignupTransition] = useTransition();

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

  // ── Handle New Admission Sign Up ──
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    if (!signupForm.name.trim()) {
      setSignupError("Please enter your full name.");
      return;
    }

    const cleanPhone = signupForm.phone.trim().replace(/[^\d+]/g, "");
    if (cleanPhone.length < 10) {
      setSignupError("Please enter a valid 10-digit mobile number.");
      return;
    }

    startSignupTransition(async () => {
      try {
        const res = await submitPublicAdmissionEnquiry(signupForm);
        if (res.success && res.leadId) {
          setSignupSuccess({
            leadId: res.leadId,
            name: res.name || signupForm.name,
            phone: res.phone || signupForm.phone,
            course: res.course || signupForm.courseInterest,
          });
        } else {
          setSignupError(res.error || "Failed to submit inquiry. Please try again.");
        }
      } catch (err: any) {
        setSignupError(err.message || "An unexpected error occurred.");
      }
    });
  };

  const cleanHelpline = (phone || "").replace(/[^\d]/g, "");

  const scrollToAuthCard = (tab: "login" | "signup") => {
    setActiveTab(tab);
    const el = document.getElementById("auth-card-anchor");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* ── Background Ambient Lighting ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[550px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/2 -left-48 w-96 h-96 bg-blue-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 -right-48 w-96 h-96 bg-purple-600/10 blur-[130px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#07090e]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/student-login" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/30">
              <div className="w-full h-full rounded-[14px] bg-[#090e1a] flex items-center justify-center text-white overflow-hidden">
                <InstituteLogo logoUrl={logoUrl} name={instituteName} size={32} />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight block">
                {instituteName}
              </span>
              <span className="text-[10px] text-indigo-400 font-bold block -mt-0.5 uppercase tracking-wider">
                Student Academic Portal
              </span>
            </div>
          </Link>

          {/* Nav Right CTA Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => scrollToAuthCard("signup")}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Apply for Admission</span>
            </button>

            <button
              onClick={() => scrollToAuthCard("login")}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <User className="w-3.5 h-3.5 text-zinc-900" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Hero Section ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-20 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column (Hero Copy & Highlights) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-zinc-300 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Academic Year 2026-2027 Portal</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-300 font-bold">Admissions Open</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Empowering Scholars with Digital Learning &amp; Transparency.
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Welcome to the official student portal of{" "}
              <strong className="text-white">{instituteName}</strong>. Check your weekly
              lecture timetable, study notes, attendance ledger, exam scorecards, and
              digital smart ID badge in real time.
            </p>

            {/* Quick Interactive Features Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-left">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-white text-xs">Live Timetables</h4>
                <p className="text-[11px] text-zinc-400">Class schedules &amp; room slots</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <CalendarCheck2 className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-white text-xs">Attendance Feed</h4>
                <p className="text-[11px] text-zinc-400">Transparent daily logs</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <h4 className="font-bold text-white text-xs">Study Notes Vault</h4>
                <p className="text-[11px] text-zinc-400">PDFs, tests &amp; assignments</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <Award className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white text-xs">Exam Scorecards</h4>
                <p className="text-[11px] text-zinc-400">Scores, ranks &amp; analytics</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <QrCode className="w-4 h-4 text-pink-400" />
                <h4 className="font-bold text-white text-xs">Digital Smart ID</h4>
                <p className="text-[11px] text-zinc-400">QR pass for gate &amp; library</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white text-xs">Verified Portal</h4>
                <p className="text-[11px] text-zinc-400">Encrypted student access</p>
              </div>
            </div>

            {/* Helpline Footer */}
            <div className="pt-2 flex items-center justify-center lg:justify-between text-xs text-zinc-400 flex-wrap gap-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admissions Helpline:</span>
                <span className="font-mono text-zinc-200 font-bold">{phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Official Campus System</span>
              </div>
            </div>
          </div>

          {/* Right Column (Dual Card: Login vs New Admission Sign Up) */}
          <div id="auth-card-anchor" className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-[#0d121d]/90 backdrop-blur-2xl border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden">
              {/* Tab Switcher */}
              <div className="p-2 bg-white/[0.02] border-b border-white/5 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setLoginError("");
                  }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "login"
                      ? "bg-white text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Student Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("signup");
                    setSignupError("");
                  }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "signup"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Apply / Sign Up</span>
                </button>
              </div>

              {/* ── TAB 1: STUDENT LOGIN ── */}
              {activeTab === "login" && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Student Sign In</h3>
                    <p className="text-xs text-zinc-400">
                      Enter your official Student Code and password to access your dashboard.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Student Code Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                        <span>Student Code / User ID</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. STU-2026-0001 or roll no"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Enter your portal password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-500 pt-0.5">
                        First time logging in? Use your assigned default password, then change it in your profile.
                      </p>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30 cursor-pointer accent-indigo-500"
                        />
                        <span>Remember workstation</span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoginPending}
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-white/5 transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                      {isLoginPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                          <span>Signing In...</span>
                        </div>
                      ) : (
                        <>
                          <span>Sign In to Student Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Switch to Sign Up Trigger */}
                  <div className="pt-2 border-t border-white/5 text-center">
                    <p className="text-xs text-zinc-400">
                      Not enrolled in a batch yet?{" "}
                      <button
                        onClick={() => setActiveTab("signup")}
                        className="text-indigo-400 font-semibold hover:underline"
                      >
                        Apply for New Admission →
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* ── TAB 2: NEW ADMISSION / SIGN UP ── */}
              {activeTab === "signup" && (
                <div className="p-6 sm:p-8 space-y-5">
                  {signupSuccess ? (
                    <div className="text-center space-y-4 py-2">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-block">
                          Application Received
                        </span>
                        <h4 className="text-xl font-bold text-white">
                          Thank You, {signupSuccess.name.split(" ")[0]}!
                        </h4>
                        <p className="text-xs text-zinc-300">
                          Your application has been received into our Admissions CRM.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-left text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Reference ID:</span>
                          <span className="font-mono font-bold text-white uppercase">
                            {signupSuccess.leadId.slice(0, 10)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Target Program:</span>
                          <span className="text-indigo-300 font-semibold">
                            {signupSuccess.course}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Status:</span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Counselor Callback Scheduled
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <a
                          href={`https://wa.me/${cleanHelpline}?text=Hello%20${encodeURIComponent(instituteName)},%20I%20have%20submitted%20my%20admission%20application%20(Ref:%20${signupSuccess.leadId.slice(0, 8)}).%20Please%20guide%20me%20for%20admission.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Chat with Admissions on WhatsApp</span>
                        </a>

                        <button
                          onClick={() => {
                            setSignupSuccess(null);
                            setActiveTab("login");
                          }}
                          className="w-full py-2 text-xs text-zinc-400 hover:text-white"
                        >
                          Back to Login
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Admissions 2026-2027 Open</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">Apply for Admission</h3>
                        <p className="text-xs text-zinc-400">
                          Fill your details to reserve your batch seat &amp; get free academic counseling.
                        </p>
                      </div>

                      {signupError && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{signupError}</span>
                        </div>
                      )}

                      <form onSubmit={handleSignup} className="space-y-3.5">
                        {/* Student Name */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-300">
                            Student Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sameer Mir"
                            value={signupForm.name}
                            onChange={(e) =>
                              setSignupForm({ ...signupForm, name: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>

                        {/* Mobile Number */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-300">
                            Mobile Number (WhatsApp) *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. 9876543210"
                            value={signupForm.phone}
                            onChange={(e) =>
                              setSignupForm({ ...signupForm, phone: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>

                        {/* Target Course */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-300">
                            Target Program / Course *
                          </label>
                          <select
                            value={signupForm.courseInterest}
                            onChange={(e) =>
                              setSignupForm({ ...signupForm, courseInterest: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#111625] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          >
                            {courses.length > 0 ? (
                              courses.map((c) => (
                                <option
                                  key={c.id}
                                  value={c.name}
                                  className="bg-[#111625] text-white"
                                >
                                  {c.name} {c.code ? `(${c.code})` : ""}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="NEET Medical Target 2026-2027">
                                  NEET Medical Target 2026-2027
                                </option>
                                <option value="JEE Main & Advanced 2-Year Program">
                                  JEE Main &amp; Advanced 2-Year Program
                                </option>
                                <option value="Class 11-12 Board + Competitive">
                                  Class 11-12 Board + Competitive
                                </option>
                                <option value="Foundation (Class 9th & 10th)">
                                  Foundation (Class 9th &amp; 10th)
                                </option>
                                <option value="Repeater / Dropper Intensive Batch">
                                  Repeater / Dropper Intensive Batch
                                </option>
                              </>
                            )}
                          </select>
                        </div>

                        {/* Current Class */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-300">
                            Current Class / Stage *
                          </label>
                          <select
                            value={signupForm.currentClass}
                            onChange={(e) =>
                              setSignupForm({ ...signupForm, currentClass: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#111625] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          >
                            {CLASS_OPTIONS.map((cls) => (
                              <option key={cls} value={cls} className="bg-[#111625] text-white">
                                {cls}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* City */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-300">
                            City / District
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Srinagar, Anantnag, Baramulla"
                            value={signupForm.city}
                            onChange={(e) =>
                              setSignupForm({ ...signupForm, city: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSignupPending}
                          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] disabled:opacity-50"
                        >
                          {isSignupPending ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Submitting Application...</span>
                            </div>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Submit Application &amp; Reserve Seat</span>
                            </>
                          )}
                        </button>
                      </form>

                      {/* Direct Link to Detailed Page */}
                      <div className="pt-2 border-t border-white/5 text-center">
                        <Link
                          href="/apply"
                          className="text-[11px] text-zinc-400 hover:text-indigo-300 flex items-center justify-center gap-1"
                        >
                          <span>Looking for detailed scholarship application?</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Bottom Card Security Footer */}
              <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Official SSL Verified</span>
                </span>
                <Link href="/login" className="text-zinc-400 hover:text-white">
                  Staff / Admin Login →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Why Students Choose Us (Banner Grid) ── */}
        <div className="pt-10 border-t border-white/5 space-y-6 text-center">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Modern Academic Infrastructure
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Everything a student needs to excel.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Weekly Class Timetable</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Stay synchronized with live batch slots, faculty assignments, classroom room
                numbers, and weekly subject hours.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Curated Study Notes</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Download faculty-curated notes, daily practice problems (DPPs), question banks,
                and chapter revision slides.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Offline Test Series</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                OMR pen-paper exam schedules, official answer keys, instant marks evaluations,
                and percentile rank analysis.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-500 space-y-2">
        <p>© {new Date().getFullYear()} {instituteName}. All rights reserved.</p>
        <p className="text-[11px] text-zinc-600">
          Official Student Portal &amp; Academic Admissions Gateway
        </p>
      </footer>
    </div>
  );
}
