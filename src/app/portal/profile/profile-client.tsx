"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateStudentPassword } from "@/server/actions/portal";
import { logoutUser } from "@/server/actions/auth";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronRight,
  LogOut,
  QrCode,
  GraduationCap,
  Building2,
  Users,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";

interface ProfileProps {
  student: {
    name: string;
    studentId: string;
    admissionNo: string;
    email?: string | null;
    phone?: string | null;
    dob?: Date | string | null;
    gender: string;
    address?: string | null;
    city?: string | null;
    emergencyContact?: string | null;
    gradeClass?: string | null;
    photoUrl?: string | null;
    status?: string | null;
    admissionDate?: Date | string | null;
    parent?: {
      name: string;
      phone: string;
      relation?: string | null;
    } | null;
    institute?: {
      name: string;
      code: string;
    } | null;
    session?: {
      name: string;
    } | null;
  };
}

export function StudentProfileClient({ student }: ProfileProps) {
  const router = useRouter();

  // Password Change Form State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutUser();
    router.push("/login");
    router.refresh();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await updateStudentPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setMsg({ type: "success", text: "Password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setMsg(null);
        }, 1800);
      } else {
        setMsg({ type: "error", text: res.error || "Failed to update password." });
      }
    } catch {
      setMsg({ type: "error", text: "An error occurred while updating your password." });
    } finally {
      setLoading(false);
    }
  };

  const dobStr = student.dob
    ? new Date(student.dob).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not Registered";

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* ── Settings Page Header ── */}
      <div className="px-1 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
            Student Profile
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Student Identity, Academic Records &amp; Security Credentials
          </p>
        </div>
        <Link
          href="/portal/id-card"
          className="p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold"
        >
          <QrCode className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Digital ID</span>
        </Link>
      </div>

      {/* ── Apple ID Profile Hero Card (iOS 18 Inset Grouped) ── */}
      <div className="rounded-3xl bg-gradient-to-b from-[#182032] to-[#101524] border border-white/15 p-6 shadow-xl shadow-black/40 text-center relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Large iOS Avatar */}
        <div className="relative inline-block mx-auto mb-3">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-xl shadow-indigo-600/30">
            <div className="w-full h-full rounded-full bg-[#0d121f] flex items-center justify-center text-white font-extrabold text-2xl tracking-wider">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>
          <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#101524] flex items-center justify-center text-white" title="Active">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </span>
        </div>

        {/* Name & Apple-ID Subtitle */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {student.name}
        </h2>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          {student.studentId} • Admission: {student.admissionNo}
        </p>

        {/* iOS Badges Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {student.status || "ACTIVE SCHOLAR"}
          </span>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-white/10 text-zinc-200 border border-white/10">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            {student.gradeClass || "Class 11"}
          </span>

          {student.session && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-mono text-zinc-300 bg-white/5 border border-white/10">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {student.session.name}
            </span>
          )}
        </div>
      </div>

      {/* ── iOS Inset Group 1: Personal Contact & Details ── */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3">
          Contact &amp; Identification
        </span>

        <div className="rounded-2xl bg-[#121726]/90 border border-white/10 divide-y divide-white/5 overflow-hidden shadow-md">
          {/* Phone */}
          <div className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Phone Number</span>
                <span className="text-sm font-semibold text-white font-mono">
                  {student.phone || "Not recorded"}
                </span>
              </div>
            </div>

            {student.phone && (
              <button
                onClick={() => handleCopy(student.phone!, "phone")}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Copy Phone"
              >
                {copiedField === "phone" ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-zinc-400 block">Registered Email</span>
                <span className="text-sm font-semibold text-white truncate block">
                  {student.email || "No email linked"}
                </span>
              </div>
            </div>

            {student.email && (
              <button
                onClick={() => handleCopy(student.email!, "email")}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Copy Email"
              >
                {copiedField === "email" ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Date of Birth */}
          <div className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Date of Birth</span>
                <span className="text-sm font-semibold text-white">{dobStr}</span>
              </div>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Official</span>
          </div>

          {/* Gender & Identity */}
          <div className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Gender &amp; Category</span>
                <span className="text-sm font-semibold text-white">
                  {student.gender} • Regular Student
                </span>
              </div>
            </div>
          </div>

          {/* Residential Address */}
          <div className="flex items-start justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Residential Address</span>
                <span className="text-sm font-semibold text-white leading-relaxed">
                  {student.address
                    ? `${student.address}${student.city ? `, ${student.city}` : ""}`
                    : "Address on file"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── iOS Inset Group 2: Parent & Emergency Contact ── */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3">
          Family &amp; Emergency
        </span>

        <div className="rounded-2xl bg-[#121726]/90 border border-white/10 divide-y divide-white/5 overflow-hidden shadow-md">
          {/* Guardian Name */}
          <div className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Parent / Guardian</span>
                <span className="text-sm font-semibold text-white">
                  {student.parent?.name || "Guardian on record"}
                </span>
              </div>
            </div>
            <span className="text-xs font-medium text-zinc-400 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
              {student.parent?.relation || "Parent"}
            </span>
          </div>

          {/* Guardian Phone */}
          <div className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Emergency Helpline / Phone</span>
                <span className="text-sm font-semibold text-white font-mono">
                  {student.parent?.phone || student.emergencyContact || "—"}
                </span>
              </div>
            </div>

            {(student.parent?.phone || student.emergencyContact) && (
              <a
                href={`tel:${student.parent?.phone || student.emergencyContact}`}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
              >
                <span>Call</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── iOS Inset Group 3: Academic Institution ── */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3">
          Academic Credentials
        </span>

        <div className="rounded-2xl bg-[#121726]/90 border border-white/10 divide-y divide-white/5 overflow-hidden shadow-md">
          {/* Institute Campus */}
          <div className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Enrolled Campus</span>
                <span className="text-sm font-semibold text-white">
                  {student.institute?.name || "Main Campus"}
                </span>
              </div>
            </div>
            {student.institute?.code && (
              <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded-md bg-white/5">
                {student.institute.code}
              </span>
            )}
          </div>

          {/* Digital PVC ID Card Row */}
          <Link
            href="/portal/id-card"
            className="flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-fuchsia-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">High-DPI Digital PVC ID Card</span>
                <span className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  View &amp; Print ID Card
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-white transition-colors">
              <span className="text-xs">QR Verified</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── iOS Inset Group 4: Security & Password ── */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3">
          Sign-In &amp; Security
        </span>

        <div className="rounded-2xl bg-[#121726]/90 border border-white/10 divide-y divide-white/5 overflow-hidden shadow-md">
          {/* Change Password Trigger */}
          <button
            onClick={() => setIsPasswordModalOpen(!isPasswordModalOpen)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-yellow-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Password &amp; Keychain</span>
                <span className="text-sm font-semibold text-white">Change Secret Password</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-zinc-400">
              <span className="text-xs">{isPasswordModalOpen ? "Close" : "Update"}</span>
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${
                  isPasswordModalOpen ? "rotate-90" : ""
                }`}
              />
            </div>
          </button>

          {/* Expandable iOS Password Box */}
          {isPasswordModalOpen && (
            <div className="p-4 bg-white/[0.02] border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <p className="text-xs text-zinc-400">
                Enter your current credentials to set a new 6+ character password.
              </p>

              {msg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    msg.type === "success"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {msg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{msg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-3">
                {/* Current Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300 block">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current or default password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:outline-none focus:border-indigo-500 transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300 block">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:outline-none focus:border-indigo-500 transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300 block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-semibold transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Encryption Indicator */}
          <div className="flex items-center justify-between p-3.5 bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-700 flex items-center justify-center text-white shadow-sm shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Device Security</span>
                <span className="text-sm font-semibold text-white">
                  256-Bit SSL/TLS Encryption
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">Secured</span>
          </div>
        </div>
      </div>

      {/* ── iOS Inset Group 5: Destructive Sign Out ── */}
      <div className="rounded-2xl bg-[#121726]/90 border border-white/10 overflow-hidden shadow-md">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full p-4 text-center text-sm font-bold text-rose-500 hover:bg-rose-500/10 active:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>{loggingOut ? "Signing Out..." : "Sign Out of Student Account"}</span>
        </button>
      </div>

      {/* Bottom Info Note */}
      <p className="text-[11px] text-center text-zinc-500 font-sans">
        Official Student Portal • Secure &amp; End-to-End Encrypted
      </p>
    </div>
  );
}
