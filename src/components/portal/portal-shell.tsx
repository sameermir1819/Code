"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import { InstituteLogo } from "@/components/ui/institute-logo";
import { logoutUser } from "@/server/actions/auth";
import {
  LayoutDashboard,
  CalendarCheck2,
  Award,
  Receipt,
  BookOpen,
  QrCode,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface StudentInfo {
  id: string;
  name: string;
  studentId: string;
  admissionNo: string;
  email?: string | null;
  photoUrl?: string | null;
  gradeClass?: string | null;
}

interface PortalShellProps {
  student: StudentInfo | null;
  instituteName: string;
  instituteLogoUrl?: string | null;
  isPreview?: boolean;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/portal", label: "Overview", icon: LayoutDashboard },
  { href: "/portal/attendance", label: "My Attendance", icon: CalendarCheck2 },
  { href: "/portal/results", label: "Exams & Results", icon: Award },
  { href: "/portal/fees", label: "Fees & Receipts", icon: Receipt },
  { href: "/portal/materials", label: "Study Materials", icon: BookOpen },
  { href: "/portal/id-card", label: "Digital ID Card", icon: QrCode },
  { href: "/portal/profile", label: "My Profile", icon: User },
];

export function PortalShell({
  student,
  instituteName,
  instituteLogoUrl,
  isPreview,
  children,
}: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutUser();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-foreground flex flex-col font-poppins selection:bg-primary/20">
      {/* Admin Preview Notification Bar */}
      {isPreview && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs font-medium text-amber-300 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>
              <strong>Staff Preview Mode:</strong> You are viewing the Student Portal as student{" "}
              <span className="font-semibold text-white underline">{student?.name || "Student"}</span> ({student?.studentId}).
            </span>
          </div>
          <a
            href="/dashboard"
            className="flex items-center gap-1 text-xs text-amber-200 hover:text-white underline"
          >
            <span>Return to Staff Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Main Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#070b13]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-white/10 border border-white/15">
              <InstituteLogo logoUrl={instituteLogoUrl} name={instituteName} size={34} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide text-white uppercase truncate max-w-[180px] sm:max-w-xs">
                  {instituteName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  STUDENT PORTAL
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Academic &amp; Student Self-Service Workspace
              </p>
            </div>
          </div>

          {/* Center / Right: Desktop Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href);

              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right: Student Profile & Logout */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-white block leading-tight truncate max-w-[140px]">
                {student?.name || "Student"}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 block">
                {student?.studentId || "ID: Pending"}
              </span>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign Out"
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#090e18] px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-white block">
                  {student?.name || "Student"}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {student?.studentId} • {student?.gradeClass || "Active Scholar"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/portal"
                    ? pathname === "/portal"
                    : pathname.startsWith(item.href);

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-zinc-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            &copy; {new Date().getFullYear()} {instituteName}. Authorized Student Portal.
          </span>
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            256-Bit Encrypted Student Self-Service Network
          </span>
        </div>
      </footer>
    </div>
  );
}
