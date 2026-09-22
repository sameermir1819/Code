"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstituteLogo } from "@/components/ui/institute-logo";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  KeyRound,
  Info,
  CalendarCheck2,
  Award,
  BookOpen,
  QrCode,
  ArrowLeft,
} from "lucide-react";

interface StudentLoginFormProps {
  logoUrl: string | null;
  instituteName: string;
  tagline: string;
}

export function StudentLoginForm({
  logoUrl,
  instituteName,
  tagline,
}: StudentLoginFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    startTransition(async () => {
      const res = await loginUser({ identifier, password });
      if (res.success) {
        if (res.user?.role === "STUDENT") {
          router.push("/portal");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      } else {
        setErrorMsg(
          res.error ||
            "Authentication failed. Please verify your Name_name (e.g. aarav_sharma) and your Student Code."
        );
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#060b13] text-foreground font-poppins selection:bg-indigo-500/25 selection:text-white relative overflow-hidden">
      {/* ── Background Subtle Mesh Lights ── */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[160px]" />
      </div>

      {/* ── Left Hero Panel (Student Academy Showcase) ── */}
      <div className="hidden lg:flex lg:w-7/12 p-12 xl:p-16 flex-col justify-between relative z-10 border-r border-white/10 bg-gradient-to-b from-indigo-950/[0.08] to-transparent">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl">
              <InstituteLogo logoUrl={logoUrl} name={instituteName} size={42} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg tracking-wide uppercase text-white">
                  {instituteName}
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  STUDENT PORTAL
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Academic &amp; Student Self-Service Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Encrypted Student Session</span>
          </div>
        </div>

        {/* Center Student Highlights */}
        <div className="space-y-6 my-auto py-8 max-w-xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Student Academic Hub</span>
            </div>
            <h1 className="text-3xl xl:text-5xl font-black tracking-tight text-white leading-[1.12]">
              Track Your Academic Journey in One Seamless Place.
            </h1>
            <p className="text-sm xl:text-base text-zinc-300 font-normal leading-relaxed">
              {tagline ||
                "Check attendance records, download faculty lecture notes, review test scorecard matrices, and access your digital smart student ID."}
            </p>
          </div>

          {/* Student Feature Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Attendance Ledger</span>
                <span className="text-[11px] text-zinc-400 leading-tight block">
                  Real-time biometric attendance records &amp; percentage.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Exams &amp; Reports</span>
                <span className="text-[11px] text-zinc-400 leading-tight block">
                  Detailed marks cards, rank metrics &amp; teacher remarks.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Digital Smart ID</span>
                <span className="text-[11px] text-zinc-400 leading-tight block">
                  Printable CR-80 card with verified scanner QR code.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Study Materials</span>
                <span className="text-[11px] text-zinc-400 leading-tight block">
                  Lecture PDFs, assignment sheets &amp; practice mock tests.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance */}
        <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-zinc-300 font-medium">Student Portal Active &amp; Synced</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>Official Student Login</span>
            <span>•</span>
            <span>TLS 256-Bit Protection</span>
          </div>
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12 lg:p-14 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Top Brand (visible on small screens) */}
          <div className="lg:hidden text-center space-y-2.5 pb-2">
            <div className="flex justify-center">
              <div className="p-2 rounded-2xl bg-white/10 backdrop-blur border border-white/15 shadow-xl">
                <InstituteLogo logoUrl={logoUrl} name={instituteName} size={54} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white uppercase">
                {instituteName}
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                STUDENT PORTAL
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Student Portal
              </span>
              <a
                href="/login"
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Staff Login</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Student Sign In
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Enter your student username in format <code className="text-indigo-300 bg-white/5 px-1 py-0.5 rounded font-mono">Name_name</code> and your Student Code.
            </p>
          </div>

          {/* Instructions Box */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>How to Sign In:</span>
            </div>
            <ul className="text-[11px] text-indigo-200/90 list-disc list-inside space-y-0.5 pl-1">
              <li>
                <strong>Username:</strong> Your Name as <span className="font-mono text-white">firstname_lastname</span> (e.g. <span className="font-mono text-white">aarav_sharma</span>) or Student ID
              </li>
              <li>
                <strong>Password:</strong> Your official <strong>Student Code</strong> (e.g. <span className="font-mono text-white">STU-2026-0001</span>)
              </li>
            </ul>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                <span>Student Username</span>
                <span className="text-[10px] text-indigo-300 font-mono">format: Name_name</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 h-11 text-xs rounded-xl bg-white/[0.04] border-white/15 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                  placeholder="e.g. aarav_sharma or STU-2026-0001"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field (Student Code) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200">
                  Student Code (Password)
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      "Your password is your Student Code (e.g. STU-2026-0001) as printed on your ID card or admission slip. If you don't know your code, please contact the campus desk."
                    );
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Forgot Student Code?
                </a>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 text-xs rounded-xl bg-white/[0.04] border-white/15 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                  placeholder="e.g. STU-2026-0001"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white transition-colors focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30 cursor-pointer"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Student Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Student Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Link to Staff Login */}
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-zinc-400">
              Are you an Administrator, Faculty or Staff?{" "}
              <a
                href="/login"
                className="font-bold text-white hover:text-indigo-300 underline transition-colors"
              >
                Sign In to Staff Workspace &rarr;
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

