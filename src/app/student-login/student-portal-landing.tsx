"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/server/actions/auth";
import { submitPublicAdmissionEnquiry } from "@/server/actions/leads";
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
  Send,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  GraduationCap,
  MapPin,
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

const CLASS_OPTIONS = [
  "Class 9th Foundation",
  "Class 10th Board + Olympiad",
  "Class 11th (Medical - NEET)",
  "Class 11th (Engineering - JEE)",
  "Class 12th (Board + Target)",
  "Dropper / Repeater (NEET/JEE)",
  "General / Other",
];

export function StudentPortalLanding({
  logoUrl,
  instituteName,
  tagline,
  city = "Srinagar",
  phone = "+91 98765 43210",
  campuses = [],
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
    campusId: campuses && campuses.length > 0 ? campuses[0].id : "",
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07090e] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col justify-between relative p-3 sm:p-5 lg:px-10 lg:py-4">
      {/* ── Ambient Glows (Pointer-events-none) ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 blur-[130px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* ── Top Header / Navbar ── */}
      <header className="relative z-10 w-full flex items-center justify-between py-1 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/30">
            <div className="w-full h-full rounded-[10px] bg-[#090e1a] flex items-center justify-center text-white overflow-hidden">
              <InstituteLogo logoUrl={logoUrl} name={instituteName} size={28} />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-white text-sm sm:text-base tracking-tight block leading-tight">
              {instituteName}
            </span>
            <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider">
              Student Academic Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Admissions 2026-2027 Open</span>
          </span>
          <Link
            href="/login"
            className="text-[11px] text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition-all"
          >
            Staff Login
          </Link>
        </div>
      </header>

      {/* ── Main Viewport Center Area (No Scroll, Fits perfectly) ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-2 min-h-0">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Left Column: Visual Pitch & Quick Bullets (Desktop only or compact on small) */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-4 text-left pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Official Scholar Portal • Academic Command Center</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              Empowering Scholars with Digital Learning &amp; Transparency.
            </h1>

            <p className="text-xs xl:text-sm text-zinc-300 leading-relaxed max-w-xl">
              Access your weekly class timetables, lecture notes, daily attendance
              ledger, exam results, and digital smart ID badge all in one place.
            </p>

            {/* 4 Compact Features Cards */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 max-w-lg">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Live Timetables</h4>
                  <p className="text-[10px] text-zinc-400">Class timings &amp; rooms</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Attendance Feed</h4>
                  <p className="text-[10px] text-zinc-400">Session presence log</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Study Notes Vault</h4>
                  <p className="text-[10px] text-zinc-400">PDFs &amp; formula sheets</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Digital Smart ID</h4>
                  <p className="text-[10px] text-zinc-400">Verified QR badge</p>
                </div>
              </div>
            </div>

            {/* Helpline contact */}
            <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Admissions Desk: <strong className="text-zinc-200 font-mono">{phone}</strong></span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-medium">Fast Counselor Callback</span>
            </div>
          </div>

          {/* Right Column: Interactive Dual Tab Card (Fits viewport perfectly) */}
          <div className="w-full lg:col-span-5 max-w-[420px] mx-auto">
            <div className="rounded-3xl bg-[#0d121d]/90 backdrop-blur-2xl border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden flex flex-col justify-between">
              {/* Tab Switcher */}
              <div className="p-1.5 bg-white/[0.02] border-b border-white/5 grid grid-cols-2 gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setLoginError("");
                  }}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
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
                  className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
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
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-white">Student Sign In</h3>
                    <p className="text-[11px] text-zinc-400">
                      Sign in with your official Student Code or registered roll number.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="text-[11px]">{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300">
                        Student Code / User ID
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

                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-3 w-3 rounded border-white/20 bg-white/5 text-indigo-500 accent-indigo-500 cursor-pointer"
                        />
                        <span>Remember device</span>
                      </label>
                      <span className="text-[10px] text-zinc-500">Default pass on first login</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoginPending}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
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

                  <div className="pt-2 border-t border-white/5 text-center">
                    <p className="text-[11px] text-zinc-400">
                      New admission for 2026?{" "}
                      <button
                        onClick={() => setActiveTab("signup")}
                        className="text-indigo-400 font-semibold hover:underline"
                      >
                        Apply Online Now →
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* ── TAB 2: APPLY / SIGN UP ── */}
              {activeTab === "signup" && (
                <div className="p-5 sm:p-6 space-y-3.5">
                  {signupSuccess ? (
                    <div className="text-center space-y-3 py-1">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-block">
                          Application Received
                        </span>
                        <h4 className="text-base font-bold text-white">
                          Thank You, {signupSuccess.name.split(" ")[0]}!
                        </h4>
                        <p className="text-[11px] text-zinc-300">
                          Application registered into Admissions CRM.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-left text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Ref ID:</span>
                          <span className="font-mono font-bold text-white uppercase">
                            {signupSuccess.leadId.slice(0, 8)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Course:</span>
                          <span className="text-indigo-300 font-semibold truncate max-w-[170px]">
                            {signupSuccess.course}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <a
                          href={`https://wa.me/${cleanHelpline}?text=Hello%20${encodeURIComponent(instituteName)},%20I%20have%20submitted%20my%20admission%20inquiry%20(Ref:%20${signupSuccess.leadId.slice(0, 8)}).`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Admission Desk</span>
                        </a>

                        <button
                          onClick={() => {
                            setSignupSuccess(null);
                            setActiveTab("login");
                          }}
                          className="w-full py-1 text-[11px] text-zinc-400 hover:text-white"
                        >
                          Back to Sign In
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Apply for Admission</span>
                        </h3>
                        <p className="text-[11px] text-zinc-400">
                          Reserve your batch seat &amp; receive free academic counseling.
                        </p>
                      </div>

                      {signupError && (
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{signupError}</span>
                        </div>
                      )}

                      <form onSubmit={handleSignup} className="space-y-2.5">
                        <div className="space-y-0.5">
                          <label className="text-[11px] font-semibold text-zinc-300">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Student Full Name"
                            value={signupForm.name}
                            onChange={(e) =>
                              setSignupForm({ ...signupForm, name: e.target.value })
                            }
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[11px] font-semibold text-zinc-300">
                            WhatsApp Mobile Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="10-digit Mobile Number"
                            value={signupForm.phone}
                            onChange={(e) =>
                              setSignupForm({ ...signupForm, phone: e.target.value })
                            }
                            className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-indigo-400" />
                              <span>Preferred Campus / Branch *</span>
                            </span>
                            <span className="text-[9px] text-zinc-400 font-normal">Choose Center</span>
                          </label>
                          <select
                            value={signupForm.campusId}
                            onChange={(e) =>
                              setSignupForm({ ...signupForm, campusId: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl bg-[#111625] border border-white/10 text-white text-[11px] focus:outline-none focus:border-indigo-500"
                          >
                            {campuses && campuses.length > 0 ? (
                              campuses.map((c) => (
                                <option key={c.id} value={c.id} className="bg-[#111625] text-white">
                                  {c.name} {c.code ? `(${c.code})` : ""}
                                </option>
                              ))
                            ) : (
                              <option value="" className="bg-[#111625] text-white">
                                Main Campus
                              </option>
                            )}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <label className="text-[11px] font-semibold text-zinc-300">
                              Program *
                            </label>
                            <select
                              value={signupForm.courseInterest}
                              onChange={(e) =>
                                setSignupForm({ ...signupForm, courseInterest: e.target.value })
                              }
                              className="w-full px-2 py-1.5 rounded-xl bg-[#111625] border border-white/10 text-white text-[11px] focus:outline-none focus:border-indigo-500"
                            >
                              {courses.length > 0 ? (
                                courses.map((c) => (
                                  <option key={c.id} value={c.name} className="bg-[#111625] text-white">
                                    {c.name}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="NEET Medical Target">NEET Medical</option>
                                  <option value="JEE Main & Advanced">JEE Engineering</option>
                                  <option value="Class 11-12 Board + Competitive">Class 11-12</option>
                                  <option value="Foundation 9th-10th">Foundation</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[11px] font-semibold text-zinc-300">
                              Current Class *
                            </label>
                            <select
                              value={signupForm.currentClass}
                              onChange={(e) =>
                                setSignupForm({ ...signupForm, currentClass: e.target.value })
                              }
                              className="w-full px-2 py-1.5 rounded-xl bg-[#111625] border border-white/10 text-white text-[11px] focus:outline-none focus:border-indigo-500"
                            >
                              {CLASS_OPTIONS.map((cls) => (
                                <option key={cls} value={cls} className="bg-[#111625] text-white">
                                  {cls}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSignupPending}
                          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 mt-1"
                        >
                          {isSignupPending ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Submitting...</span>
                            </div>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Submit Admission Inquiry</span>
                            </>
                          )}
                        </button>
                      </form>

                      <div className="pt-1.5 border-t border-white/5 text-center">
                        <Link
                          href="/apply"
                          className="text-[10px] text-zinc-400 hover:text-indigo-300 flex items-center justify-center gap-1"
                        >
                          <span>Need full scholarship application form?</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Bottom Card Footer */}
              <div className="px-5 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 shrink-0">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Official SSL Portal</span>
                </span>
                <span>{city} Campus</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Single-Line Footer ── */}
      <footer className="relative z-10 w-full text-center py-1 text-[11px] text-zinc-500 shrink-0 border-t border-white/5 flex items-center justify-between px-4">
        <span>© {new Date().getFullYear()} {instituteName}. All rights reserved.</span>
        <span className="hidden sm:inline-block text-zinc-600">Official Student Portal &amp; Telecalling CRM Engine</span>
      </footer>
    </div>
  );
}
