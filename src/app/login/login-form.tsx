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
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
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
        setErrorMsg(res.error || "Authentication failed. Please verify credentials.");
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* ── Left Hero Panel (Coaching Prestige Showcase) ── */}
      <div className="hidden lg:flex lg:w-7/12 bg-gradient-to-br from-[#0a192f] via-[#0f2b5c] to-[#1e3a8a] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <InstituteLogo logoUrl={logoUrl} name={instituteName} size={44} />
          </div>
          <div>
            <h2 className="font-black text-lg tracking-wider uppercase font-serif text-white">
              {instituteName}
            </h2>
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-widest block">
              Enterprise Academic ERP Portal
            </span>
          </div>
        </div>

        {/* Center Coaching Value Proposition */}
        <div className="relative z-10 space-y-6 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Coaching &amp; Test Prep Management</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight">
            Excellence in Academic Coaching, Attendance &amp; Financial Governance.
          </h1>

          <p className="text-sm text-zinc-300 leading-relaxed">
            {tagline || "Streamlined student lifecycle from admissions and biometric QR attendance to automated fee receipts and real-time performance analytics."}
          </p>

          {/* Key Feature Stats Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-xl font-black text-white block">100%</span>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                Paperless Receipts
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-xl font-black text-amber-300 block">CR-80</span>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                Smart PVC ID Cards
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-xl font-black text-emerald-400 block">Real-time</span>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                Batch Analytics
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-400 border-t border-white/10 pt-6">
          <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Bank-Grade 256-Bit SSL Encryption</span>
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            ISO 9001:2015 Verified
          </span>
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Top Brand (visible on small screens) */}
          <div className="lg:hidden text-center space-y-3 pb-2">
            <div className="flex justify-center">
              <InstituteLogo logoUrl={logoUrl} name={instituteName} size={64} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground uppercase">
                {instituteName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{tagline}</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-2">
            <div className="hidden lg:flex items-center gap-2 mb-4">
              <InstituteLogo logoUrl={logoUrl} name={instituteName} size={40} />
              <span className="font-bold text-sm tracking-tight text-foreground uppercase">
                {instituteName}
              </span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              Sign In to Your Account
            </h3>
            <p className="text-xs text-muted-foreground">
              Enter your registered credentials to access your administrative workspace.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <span className="h-2 w-2 rounded-full bg-destructive shrink-0"></span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-muted-foreground">Registered User</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 text-xs bg-muted/30 focus:bg-background transition-all"
                  placeholder="admin@futurexlearning.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-muted-foreground">Confidential</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-10 text-xs bg-muted/30 focus:bg-background transition-all"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to ERP</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Security & Access Info Footer */}
          <div className="pt-4 border-t border-border/60 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Multi-Role Access Control (Admin, Faculty, Accounts)</span>
            </div>
            <p className="text-[10px] text-zinc-400">
              For credentials assistance, contact campus IT desk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
