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
  QrCode,
  CreditCard,
  Layers,
  GraduationCap,
  Activity,
  Zap,
} from "lucide-react";

interface LoginFormProps {
  logoUrl: string | null;
  instituteName: string;
  tagline: string;
}

export function LoginForm({ logoUrl, instituteName, tagline }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@futurexlearning.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [isPending, startTransition] = useTransition();

  const handleRoleQuickSelect = (role: string, roleEmail: string, rolePass: string) => {
    setSelectedRole(role);
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMsg("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    startTransition(async () => {
      const res = await loginUser({ email, password });
      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Authentication failed. Please check credentials.");
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background font-poppins selection:bg-primary/20 selection:text-primary">
      {/* ── Left Hero Panel (Enterprise Showcase) ── */}
      <div className="hidden lg:flex lg:w-7/12 bg-gradient-to-br from-[#070e1b] via-[#0c1a30] to-[#12284c] text-white p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
            <InstituteLogo logoUrl={logoUrl} name={instituteName} size={44} />
          </div>
          <div>
            <h2 className="font-extrabold text-lg tracking-wide uppercase text-white">
              {instituteName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-widest">
                Enterprise Academic ERP
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-[10px] text-zinc-400 font-mono">v2.4 LTS</span>
            </div>
          </div>
        </div>

        {/* Center Coaching Value Proposition */}
        <div className="relative z-10 space-y-7 max-w-xl my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Next-Generation Coaching Institute OS</span>
          </div>

          <h1 className="text-3xl xl:text-5xl font-black tracking-tight leading-[1.15]">
            Total Command Over Academics, Attendance &amp; Financial Growth.
          </h1>

          <p className="text-sm xl:text-base text-zinc-300 leading-relaxed font-light">
            {tagline || "Streamlined student lifecycle from biometric QR attendance and automated fee vouchers to test performance analytics and staff scheduling."}
          </p>

          {/* Interactive Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <QrCode className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">Biometric QR &amp; GPS</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Sub-second batch attendance with automated WhatsApp SMS alerts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">Tax Invoices &amp; Receipts</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                1-click fee vouchers, partial installments &amp; defaulters recovery.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="h-7 w-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">CR-80 Smart ID Cards</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                ISO standard printable PVC smart cards with institute QR code.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="h-7 w-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">Batch Test Analytics</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Instant marksheets, ranking matrices &amp; student report cards.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-400 border-t border-white/10 pt-6">
          <span className="flex items-center gap-2 text-zinc-300 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>All ERP Clusters Operational</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>256-Bit SSL AES Encrypted</span>
          </span>
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Top Brand (visible on small screens) */}
          <div className="lg:hidden text-center space-y-3 pb-2">
            <div className="flex justify-center">
              <InstituteLogo logoUrl={logoUrl} name={instituteName} size={64} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground uppercase">
                {instituteName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{tagline}</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-2">
            <div className="hidden lg:flex items-center gap-2.5 mb-3">
              <InstituteLogo logoUrl={logoUrl} name={instituteName} size={36} />
              <span className="font-bold text-sm tracking-tight text-foreground uppercase">
                {instituteName}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Sign In to ERP
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Access your coaching workspace, academic records, and fee ledgers.
            </p>
          </div>

          {/* Quick Demo Role Switcher Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>QUICK ROLE DEMO LOGIN</span>
              <span className="text-[10px] text-primary">1-Click Auto-Fill</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleRoleQuickSelect("ADMIN", "admin@futurexlearning.com", "admin123")}
                className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all ${
                  selectedRole === "ADMIN"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickSelect("TEACHER", "teacher@futurexlearning.com", "teacher123")}
                className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all ${
                  selectedRole === "TEACHER"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickSelect("STUDENT", "student@futurexlearning.com", "student123")}
                className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all ${
                  selectedRole === "STUDENT"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickSelect("ACCOUNTANT", "accountant@futurexlearning.com", "accountant123")}
                className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all ${
                  selectedRole === "ACCOUNTANT"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Accounts
              </button>
            </div>
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
                <span className="text-[10px] text-muted-foreground font-normal">Registered Identity</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 text-xs rounded-xl bg-card border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                  placeholder="admin@futurexlearning.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-muted-foreground font-normal">Confidential Token</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 text-xs rounded-xl bg-card border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
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
              className="w-full h-11 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {selectedRole.replace("_", " ")}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Security & Access Info Footer */}
          <div className="pt-4 border-t border-border/60 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Multi-Role Access Control Enabled (Admin, Faculty, Accounts)</span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Futurex Learning ERP • ISO 9001:2015 Compliant Academic Architecture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
