"use client";

import React, { useState } from "react";
import { updateStudentPassword } from "@/server/actions/portal";
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
    parent?: {
      name: string;
      phone: string;
      relation?: string | null;
    } | null;
  };
}

export function StudentProfileClient({ student }: ProfileProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Student Profile &amp; Security</h1>
        <p className="text-xs text-zinc-400">
          Official enrollment records and security credential management.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Student Registration Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity Card */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{student.name}</h2>
                <p className="text-xs text-zinc-400 font-mono">
                  {student.studentId} • Admission: {student.admissionNo}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-white/5">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Contact Phone
                </span>
                <span className="font-medium text-white flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  {student.phone || "Not recorded"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Registered Email
                </span>
                <span className="font-medium text-white flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  {student.email || "Not recorded"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Date of Birth
                </span>
                <span className="font-medium text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  {dobStr}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Gender &amp; Grade
                </span>
                <span className="font-medium text-white">
                  {student.gender} • {student.gradeClass || "Active Scholar"}
                </span>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Permanent Address
                </span>
                <span className="font-medium text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  {student.address ? `${student.address}, ${student.city || ""}` : "Not recorded"}
                </span>
              </div>
            </div>
          </div>

          {/* Guardian / Emergency Contact */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Parent &amp; Emergency Guardian
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Guardian Name
                </span>
                <span className="font-medium text-white">
                  {student.parent?.name || "Not specified"} (
                  {student.parent?.relation || "Guardian"})
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Guardian Phone
                </span>
                <span className="font-medium text-white flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {student.parent?.phone || student.emergencyContact || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Change Password Security Box */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                Change Password
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Update your secret login password. Must be at least 6 characters long.
            </p>

            {msg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  msg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                }`}
              >
                {msg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{msg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary"
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <span>Updating...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Save New Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

