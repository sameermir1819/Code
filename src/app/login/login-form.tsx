"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstituteLogo } from "@/components/ui/institute-logo";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";

interface LoginFormProps {
  logoUrl: string | null;
  instituteName: string;
  tagline: string;
}

export function LoginForm({ logoUrl, instituteName }: LoginFormProps) {
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#07090e] text-zinc-100 font-sans selection:bg-indigo-500/25 selection:text-white relative overflow-hidden p-4 sm:p-6">
      {/* ── Minimalist Ambient Backlight (Linear/Vercel Aesthetic) ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-blue-500/5 to-purple-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40 z-0" />

      {/* ── Modern Glass Auth Card ── */}
      <div className="w-full max-w-[420px] relative z-10">
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0d121d]/80 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/80 space-y-7">
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner">
              <InstituteLogo logoUrl={logoUrl} name={instituteName} size={48} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white uppercase">
                  {instituteName}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-300 border border-white/10">
                  STAFF
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Administrative Workspace &amp; Operations Sign In
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 text-xs rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all shadow-inner"
                  placeholder="name@institute.com"
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
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Please contact your institute's Super Administrator to reset your password.");
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 text-xs rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all shadow-inner"
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
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30 cursor-pointer"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 text-xs font-semibold rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-white/5 active:scale-[0.99]"
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Security Badge */}
          <div className="pt-2 border-t border-white/[0.06] text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
              <span>TLS 256-Bit Encrypted Session</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
