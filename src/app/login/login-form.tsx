"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InstituteLogo } from "@/components/ui/institute-logo";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Layers,
  CalendarCheck,
  CreditCard,
  FileCheck2,
  Shield,
  X,
} from "lucide-react";

interface LoginFormProps {
  logoUrl: string | null;
  instituteName: string;
  tagline: string;
  instituteCode?: string;
  city?: string;
}

export function LoginForm({
  logoUrl,
  instituteName,
  tagline,
  instituteCode = "FL-CAMPUS-01",
  city = "Srinagar",
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    startTransition(async () => {
      const res = await loginUser({ email, password });
      if (res.success) {
        if (res.user?.role === "STUDENT") {
          router.push("/portal");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      } else {
        setErrorMsg(res.error || "Authentication failed. Invalid email or password.");
      }
    });
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full bg-[#06080e] text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-white relative overflow-x-hidden overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row">
      {/* ── Ambient Background Lighting Mesh ── */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-600/15 via-blue-600/10 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-purple-600/15 via-indigo-600/10 to-transparent rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none opacity-40 z-0" />

      {/* ── LEFT SHOWCASE PANEL (Side Wala Panel) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-6 xl:p-8 2xl:p-10 h-full relative z-10 border-r border-white/[0.06] bg-gradient-to-b from-[#090d16]/75 via-[#070a12]/85 to-[#05070c] overflow-hidden">
        {/* Institute Branding Header */}
        <div className="space-y-3 xl:space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 shadow-inner">
              <InstituteLogo logoUrl={logoUrl} name={instituteName} size={36} />
            </div>
            <div>
              <span className="text-sm xl:text-base font-bold tracking-tight text-white uppercase block leading-tight">
                {instituteName}
              </span>
              <p className="text-[11px] text-zinc-400 font-medium">
                Campus: <span className="font-mono text-zinc-300">{instituteCode}</span> • {city}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-medium text-indigo-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>Institute Management System</span>
          </div>

          <div className="space-y-1 pt-0.5">
            <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Centralized Academic &amp; Operational Control
            </h2>
            <p className="text-xs xl:text-sm text-zinc-400 leading-relaxed max-w-md line-clamp-2">
              {tagline || "Unified administrative portal for coaching institutes, faculty management, attendance registers, and student performance."}
            </p>
          </div>
        </div>

        {/* System Capabilities Pillars (Compact 2x2 Grid) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5 my-auto py-2">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">Academics &amp; Batches</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                Batch scheduling, syllabi, faculty assignments, and enrollments.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">Classroom Attendance</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                Live attendance marking with QR scan &amp; hardware support.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">Fee Accounting</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                Installment ledgers, fee plans, &amp; computerized invoices.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">Offline Test Series</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                Mock drill assessments, OMR marks recording, &amp; rank cards.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-zinc-500 text-[10px]">
            <span>Secure Enterprise Architecture</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT LOGIN CARD PANEL ── */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-6 xl:p-8 h-full relative z-10 overflow-y-auto lg:overflow-hidden">
        {/* Top Navigation */}
        <div className="flex items-center justify-end pb-2 sm:pb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors"
          >
            <span>← Back to Website</span>
          </Link>
        </div>

        {/* Centered Auth Card */}
        <div className="w-full max-w-md mx-auto my-auto py-1">
          <div className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#0d121f]/85 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/80 space-y-4">
            {/* Header in Card */}
            <div className="space-y-1.5 text-center">
              <div className="inline-flex p-2 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner mb-0.5">
                <InstituteLogo logoUrl={logoUrl} name={instituteName} size={36} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">Staff Sign In</h1>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-indigo-500/10 text-indigo-400 border-indigo-500/20 py-0 px-1.5">
                    Faculty &amp; Admin
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400">
                  Enter your assigned credentials to access your administrative workspace.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Info Message */}
            {infoMsg && (
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{infoMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoMsg("")}
                  className="text-zinc-400 hover:text-white text-xs p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Work Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 text-xs rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                    placeholder="name@institute.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 text-xs rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30 cursor-pointer accent-indigo-500"
                  />
                  <span>Remember workstation</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setInfoMsg("To reset staff credentials, please request your institute's Super Administrator.");
                  }}
                  className="text-[11px] text-zinc-400 hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 text-xs font-semibold rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 transition-all flex items-center justify-center gap-2 mt-1.5 shadow-lg shadow-white/5 active:scale-[0.99] cursor-pointer"
              >
                {isPending ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Security Badge */}
            <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500">
              <div className="inline-flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-indigo-400" />
                <span>TLS 256-Bit Encrypted</span>
              </div>
              <div className="inline-flex items-center gap-1 text-zinc-500">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>Authorized Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="text-center text-[10px] text-zinc-600 pt-2">
          <span>&copy; {new Date().getFullYear()} {instituteName}. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
