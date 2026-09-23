"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { InstituteLogo } from "@/components/ui/institute-logo";
import { logoutUser } from "@/server/actions/auth";
import {
  LayoutDashboard,
  CalendarCheck2,
  Award,
  Layers,
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
  Plus,
  LayoutGrid,
  Clock,
  Compass,
  GraduationCap,
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
  { href: "/portal/test-series", label: "Offline Test Series", icon: Layers },
  { href: "/portal/fees", label: "Fees & Receipts", icon: Receipt },
  { href: "/portal/materials", label: "Study Materials", icon: BookOpen },
  { href: "/portal/id-card", label: "Digital ID Card", icon: QrCode },
  { href: "/portal/profile", label: "My Profile", icon: User },
];

// Quick Action Sheet items for mobile speed-dial
const QUICK_ACTIONS = [
  {
    href: "/portal",
    label: "Timetable & Batches",
    sub: "View classes & lectures",
    icon: Clock,
    color: "bg-indigo-500 text-white",
  },
  {
    href: "/portal/materials",
    label: "Study Materials",
    sub: "Notes, PDFs & Books",
    icon: BookOpen,
    color: "bg-purple-500 text-white",
  },
  {
    href: "/portal/id-card",
    label: "Digital ID Card",
    sub: "High-DPI PVC card",
    icon: QrCode,
    color: "bg-pink-500 text-white",
  },
  {
    href: "/portal/attendance",
    label: "Attendance Feed",
    sub: "Daily logs & stats",
    icon: CalendarCheck2,
    color: "bg-emerald-500 text-white",
  },
  {
    href: "/portal/test-series",
    label: "Offline Test Series",
    sub: "OMR marks & rank",
    icon: Layers,
    color: "bg-sky-500 text-white",
  },
  {
    href: "/portal/results",
    label: "Exams & Results",
    sub: "Scorecards & reports",
    icon: Award,
    color: "bg-amber-500 text-white",
  },
  {
    href: "/portal/fees",
    label: "Fees & Receipts",
    sub: "Installments & ledger",
    icon: Receipt,
    color: "bg-teal-500 text-white",
  },
  {
    href: "/portal/profile",
    label: "My Profile",
    sub: "Account & security",
    icon: User,
    color: "bg-blue-600 text-white",
  },
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
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutUser();
    router.push("/login");
    router.refresh();
  };

  const studentInitial = student?.name ? student.name[0].toUpperCase() : "S";

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/25 selection:text-white">
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
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#070a12]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand */}
          <Link href="/portal" className="flex items-center gap-3 group">
            <div className="p-1 rounded-xl bg-white/[0.04] border border-white/10 group-hover:border-indigo-500/40 transition-colors">
              <InstituteLogo logoUrl={instituteLogoUrl} name={instituteName} size={34} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white uppercase truncate max-w-[170px] sm:max-w-xs">
                  {instituteName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">
                Academic &amp; Student Workspace
              </p>
            </div>
          </Link>

          {/* Center / Right: Desktop Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Student Profile & Logout */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/portal/profile"
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {studentInitial}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
                  {student?.name || "Student"}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 block">
                  {student?.studentId || "ID: Pending"}
                </span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign Out"
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Right: Profile Avatar & Quick Action trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/portal/profile"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-600/30 border border-white/10"
              title="My Profile"
            >
              {studentInitial}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Secondary backup) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#090e18] px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between mb-3">
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
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5"
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
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-zinc-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area (Extra bottom padding on mobile for floating dock) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-28 lg:pb-8">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION DOCK ── */}
      <nav
        aria-label="Mobile Navigation Dock"
        className="fixed bottom-3 inset-x-3 sm:inset-x-6 max-w-md mx-auto z-40 lg:hidden"
      >
        <div className="rounded-2xl bg-[#0c111e]/90 backdrop-blur-2xl border border-white/15 px-1.5 py-1.5 shadow-2xl shadow-black/90 flex items-center justify-around">
          {/* Home */}
          <Link
            href="/portal"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              pathname === "/portal"
                ? "text-indigo-400 font-bold bg-white/[0.06]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Home</span>
          </Link>

          {/* Attendance */}
          <Link
            href="/portal/attendance"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              pathname.startsWith("/portal/attendance")
                ? "text-indigo-400 font-bold bg-white/[0.06]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <CalendarCheck2 className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Attendance</span>
          </Link>

          {/* ⚡ CENTER MENU / SERVICES BUTTON */}
          <button
            onClick={() => setQuickSheetOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              quickSheetOpen
                ? "text-indigo-400 bg-white/[0.08]"
                : "text-zinc-400 hover:text-white active:scale-95"
            }`}
            title="All Services & Quick Menu"
            aria-label="All Services"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <LayoutGrid className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] mt-1 tracking-tight font-medium">Menu</span>
          </button>

          {/* Batches (Replaced Notes with Batches as requested) */}
          <Link
            href="/portal#batches"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              pathname.startsWith("/portal/batches")
                ? "text-indigo-400 font-bold bg-white/[0.06]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Batches</span>
          </Link>

          {/* Profile */}
          <Link
            href="/portal/profile"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              pathname.startsWith("/portal/profile")
                ? "text-indigo-400 font-bold bg-white/[0.06]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      {/* ── iOS QUICK ACTION SHEET MODAL (Speed Dial) ── */}
      {quickSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop blur */}
          <div
            onClick={() => setQuickSheetOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
          />

          {/* Bottom Sheet Card */}
          <div className="relative z-10 w-full max-w-lg mx-auto bg-[#0d1220] border-t border-white/15 rounded-t-3xl p-5 pb-8 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            {/* iOS Drag Handle Bar */}
            <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Student Action Hub
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Instant mobile access to all academic services
                </p>
              </div>
              <button
                onClick={() => setQuickSheetOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 8 iOS Squircle App Shortcuts */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                const isCurrent =
                  action.href === "/portal"
                    ? pathname === "/portal"
                    : pathname.startsWith(action.href);

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    onClick={() => setQuickSheetOpen(false)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 text-left ${
                      isCurrent
                        ? "bg-indigo-950/40 border-indigo-500/40"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${action.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block leading-snug truncate">
                        {action.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 block truncate">
                        {action.sub}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bottom Dismiss Button */}
            <div className="pt-2">
              <button
                onClick={() => setQuickSheetOpen(false)}
                className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-bold transition-all border border-white/10"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500 hidden lg:block">
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
