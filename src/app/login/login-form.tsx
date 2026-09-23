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
  Sparkles,
  QrCode,
  CreditCard,
  GraduationCap,
  Layers,
  ChevronRight,
  KeyRound,
  Check,
  Shield,
  HelpCircle,
  X,
} from "lucide-react";

interface LoginFormProps {
  logoUrl: string | null;
  instituteName: string;
  tagline: string;
  instituteCode?: string;
  city?: string;
}

const DEMO_PRESETS = [
  {
    role: "Super Admin",
    email: "superadmin@futurexlearning.com",
    label: "Master Control",
    color: "from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-500/30",
  },
  {
    role: "Campus Admin",
    email: "admin@futurexlearning.com",
    label: "Coordinator",
    color: "from-blue-500/20 to-cyan-500/10 text-blue-300 border-blue-500/30",
  },
  {
    role: "Faculty",
    email: "rajesh.verma@futurexlearning.com",
    label: "Teacher",
    color: "from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/30",
  },
  {
    role: "Finance",
    email: "accounts@futurexlearning.com",
    label: "Accountant",
    color: "from-purple-500/20 to-pink-500/10 text-purple-300 border-purple-500/30",
  },
];

export function LoginForm({
  logoUrl,
  instituteName,
  tagline,
  instituteCode = "FL-CAMPUS-01",
  city = "New Delhi",
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [showQuickFill, setShowQuickFill] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
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

  const handleQuickFill = (demoEmail: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword("Admin@123");
    setActiveDemo(roleName);
    setErrorMsg("");
    setInfoMsg(`Pre-filled credentials for ${roleName}. Click "Sign In to Workspace" below.`);
  };

  return (
    <div className="min-h-screen w-full bg-[#06080e] text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-white relative overflow-hidden flex flex-col lg:flex-row">
      {/* ── Ambient Background Lighting Mesh ── */}
      <div className="absolute top-0 left-0 w-[550px] h-[550px] bg-gradient-to-br from-indigo-600/15 via-blue-600/10 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-purple-600/15 via-indigo-600/10 to-transparent rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none opacity-40 z-0" />

      {/* ── LEFT SHOWCASE PANEL (Visible on lg+) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 xl:p-16 relative z-10 border-r border-white/[0.06] bg-gradient-to-b from-[#090d16]/70 via-[#070a12]/80 to-[#05070c]">
        {/* Top Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 shadow-inner">
              <InstituteLogo logoUrl={logoUrl} name={instituteName} size={38} />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white uppercase">
                {instituteName}
              </span>
              <p className="text-xs text-zinc-400 font-medium">
                Campus Code: <span className="font-mono text-zinc-300">{instituteCode}</span> • {city}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Academic Session 2025–2026 Live</span>
          </div>

          <div className="space-y-3 pt-2">
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise Academy &amp; Coaching Management
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              {tagline || "Centralized platform managing academic batches, biometric QR attendance, multi-installment fees, and offline test series."}
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-3.5 my-8">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Smart Attendance &amp; ID Cards</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-normal">
                High-speed physical USB &amp; camera QR scanning with geolocation validation and real-time parent alerts.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Fee Accounting &amp; GST Invoicing</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-normal">
                Multi-plan installment management, outstanding balances tracking, and print-ready computerized receipts.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Offline Test Series &amp; OMR Rankings</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-normal">
                Full-scale NEET/JEE mock drills with negative marking calculation, percentile rank lists, and subject analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-zinc-500 text-[11px]">
            <span>v2.4.0</span>
            <span>•</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT LOGIN CARD PANEL ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative z-10 overflow-y-auto">
        {/* Top Bar Switch to Student Portal */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pb-6">
          <span className="text-xs text-zinc-400 hidden sm:inline">Are you an enrolled student?</span>
          <Link
            href="/student-login"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors"
          >
            <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
            <span>Student Portal</span>
            <ChevronRight className="h-3 w-3 text-zinc-500" />
          </Link>
        </div>

        {/* Centered Auth Card */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          <div className="p-8 sm:p-9 rounded-3xl bg-[#0d121f]/85 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/80 space-y-6">
            {/* Header in Card */}
            <div className="space-y-2 text-center">
              <div className="inline-flex p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner mb-1">
                <InstituteLogo logoUrl={logoUrl} name={instituteName} size={44} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">Staff Sign In</h1>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                    Faculty &amp; Admin
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400">
                  Enter your assigned institute credentials to access administrative tools.
                </p>
              </div>
            </div>

            {/* Quick Demo Credentials Accordion */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowQuickFill(!showQuickFill)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
                  <span>One-Click Demo Credentials</span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    ({showQuickFill ? "Hide" : "Click to view"})
                  </span>
                </button>
                <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0 bg-white/5 text-zinc-400">
                  Admin@123
                </Badge>
              </div>

              {showQuickFill && (
                <div className="grid grid-cols-2 gap-1.5 pt-1 animate-in fade-in zoom-in-95 duration-150">
                  {DEMO_PRESETS.map((demo) => {
                    const isSelected = activeDemo === demo.role;
                    return (
                      <button
                        key={demo.role}
                        type="button"
                        onClick={() => handleQuickFill(demo.email, demo.role)}
                        className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-500/20 border-indigo-500/40 text-white font-semibold"
                            : "bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-zinc-300 hover:text-white"
                        }`}
                      >
                        <div className="truncate pr-1">
                          <p className="font-semibold text-[11px] leading-tight text-white truncate">
                            {demo.role}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono truncate">{demo.label}</p>
                        </div>
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-zinc-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Info Message */}
            {infoMsg && (
              <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium flex items-center justify-between gap-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">{infoMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoMsg("")}
                  className="text-zinc-400 hover:text-white text-xs p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Work Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Work Email Address</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (activeDemo) setActiveDemo(null);
                    }}
                    className="pl-10 h-11 text-xs rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                    placeholder="name@futurexlearning.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("");
                      setInfoMsg("To reset staff credentials, please request your institute's Super Administrator or IT Coordinator.");
                    }}
                    className="text-[11px] text-zinc-400 hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 text-xs rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner font-mono tracking-wider"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30 cursor-pointer accent-indigo-500"
                  />
                  <span>Remember this workstation</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 text-xs font-semibold rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-white/5 active:scale-[0.99] cursor-pointer"
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
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
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
              <div className="inline-flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>TLS 256-Bit Encrypted</span>
              </div>
              <div className="inline-flex items-center gap-1 text-zinc-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Authorized Staff Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="text-center text-[11px] text-zinc-500 pt-4">
          <span>&copy; {new Date().getFullYear()} {instituteName}. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
