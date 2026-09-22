"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstituteLogo } from "@/components/ui/institute-logo";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface LoginFormProps {
  logoUrl: string | null;
  instituteName: string;
  tagline: string;
}

export function LoginForm({ logoUrl, instituteName, tagline }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    startTransition(async () => {
      const res = await loginUser({ email, password });
      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Authentication failed. Invalid email or password.");
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#060b13] text-foreground font-poppins selection:bg-primary/25 selection:text-white relative overflow-hidden">
      {/* ── Background Subtle Mesh Lights ── */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-blue-600/15 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[160px]" />
      </div>

      {/* ── Left Hero Panel (Enterprise SaaS Showcase) ── */}
      <div className="hidden lg:flex lg:w-7/12 p-12 xl:p-16 flex-col justify-between relative z-10 border-r border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
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
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  LTS 2.4
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Autonomous Coaching Institute Operating System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Tenant Vault</span>
          </div>
        </div>

        {/* Center Live Enterprise Dashboard Mockup */}
        <div className="space-y-6 my-auto py-8 max-w-xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-xs font-semibold text-blue-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Multi-Campus Academic &amp; Financial ERP</span>
            </div>
            <h1 className="text-3xl xl:text-5xl font-black tracking-tight text-white leading-[1.12]">
              Elevate Your Coaching Institute to Modern Standards.
            </h1>
            <p className="text-sm xl:text-base text-zinc-300 font-normal leading-relaxed">
              {tagline ||
                "Seamless student lifecycle from biometric QR check-ins and fee collection ledgers to test performance matrices and automated admissions."}
            </p>
          </div>

          {/* Glassmorphic Metrics Terminal Card */}
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-zinc-200">Live Campus Operations Feed</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Main Campus • Auto-Sync</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-zinc-400 block font-medium">Today's Attendance</span>
                <span className="text-xl font-extrabold text-white mt-0.5 block">98.4%</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium">
                  <TrendingUp className="w-2.5 h-2.5" /> +2.1% Biometric QR
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-zinc-400 block font-medium">Monthly Collections</span>
                <span className="text-xl font-extrabold text-white mt-0.5 block">₹14.85 L</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium">
                  <TrendingUp className="w-2.5 h-2.5" /> 94% Fee Realized
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-zinc-400 block font-medium">Active Inquiries</span>
                <span className="text-xl font-extrabold text-amber-300 mt-0.5 block">42 Leads</span>
                <span className="text-[10px] text-amber-300/80 mt-0.5 block font-medium">
                  18 Due for Follow-up
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Auto-Invoicing
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  CR-80 Smart IDs
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Parent WhatsApp Bot
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">SEC-ID: FL-PROD</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance */}
        <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-300 font-medium">All Cloud Nodes &amp; Databases Healthy</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>ISO 9001:2015 Compliant</span>
            <span>•</span>
            <span>256-Bit TLS End-to-End</span>
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
              <p className="text-xs text-zinc-400 mt-0.5">{tagline}</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Portal Authentication
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Sign In to Your Workspace
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Enter your authorized staff or student credentials to access your portal.
            </p>
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
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                <span>Email Address or Username</span>
                <span className="text-[10px] text-zinc-400 font-normal">Work Email</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 text-xs rounded-xl bg-white/[0.04] border-white/15 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  placeholder="name@institute.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200">
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Please contact your institute's Super Administrator to reset your password.");
                  }}
                  className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 text-xs rounded-xl bg-white/[0.04] border-white/15 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  placeholder="••••••••••••"
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
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30 cursor-pointer"
                />
                <span>Remember this workstation for 7 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials &amp; Campus Scope...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Bottom Security Footer */}
          <div className="pt-4 border-t border-white/10 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Multi-Role Access Control • Direct TLS-1.3 Encryption</span>
            </div>
            <p className="text-[10px] text-zinc-500">
              Protected by Enterprise Audit Trail &amp; Device Identity Verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
