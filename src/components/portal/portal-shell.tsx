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
  LayoutGrid,
  Clock,
  GraduationCap,
  Bell,
  Search,
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
  { href: "/portal/batches", label: "My Batches & Schedule", icon: GraduationCap },
  { href: "/portal/attendance", label: "Attendance Ledger", icon: CalendarCheck2 },
  { href: "/portal/results", label: "Exams & Results", icon: Award },
  { href: "/portal/test-series", label: "Offline Test Series", icon: Layers },
  { href: "/portal/fees", label: "Fees & Receipts", icon: Receipt },
  { href: "/portal/materials", label: "Study Materials", icon: BookOpen },
  { href: "/portal/id-card", label: "Digital Smart ID", icon: QrCode },
  { href: "/portal/profile", label: "Profile & Security", icon: User },
];

// Quick Action Sheet items for mobile speed-dial
const QUICK_ACTIONS = [
  {
    href: "/portal/batches",
    label: "Batches & Timetable",
    sub: "Classes & weekly schedule",
    icon: GraduationCap,
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
    router.push("/student-login");
    router.refresh();
  };

  const studentInitial = student?.name ? student.name[0].toUpperCase() : "S";

  // Current Active Page Title for breadcrumbs
  const currentNav = NAV_ITEMS.find((item) =>
    item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href)
  );
  const pageTitle = currentNav?.label || "Student Workspace";

  return (
    <div className="flex h-screen overflow-hidden bg-[#07090e] text-zinc-100 font-sans selection:bg-indigo-500/25 selection:text-white">
      {/* ── DESKTOP FIXED SIDEBAR (Visible on lg screens and up) ── */}
      <aside className="hidden lg:flex w-64 xl:w-72 flex-col justify-between border-r border-white/10 bg-[#090d16] p-4 shrink-0 relative z-30 select-none">
        {/* Top: Institute Brand */}
        <div className="space-y-4">
          <Link href="/portal" className="flex items-center gap-3 px-2 py-1.5 group">
            <div className="p-1 rounded-xl bg-white/[0.04] border border-white/10 group-hover:border-indigo-500/40 transition-colors shrink-0">
              <InstituteLogo logoUrl={instituteLogoUrl} name={instituteName} size={36} />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-white uppercase truncate block">
                {instituteName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                  STUDENT PORTAL
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links List */}
          <nav className="space-y-1 pt-2">
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? "text-white" : "text-zinc-400 group-hover:text-indigo-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Student Identity Card & Logout */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <Link
            href="/portal/profile"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0 overflow-hidden">
                {student?.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{studentInitial}</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block leading-tight truncate group-hover:text-indigo-300 transition-colors">
                  {student?.name || "Student"}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 block truncate">
                  {student?.studentId || "ID: Pending"}
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-2 px-3 rounded-xl bg-white/[0.02] hover:bg-rose-500/10 text-zinc-400 hover:text-rose-300 border border-white/5 hover:border-rose-500/20 text-xs font-medium flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* ── RIGHT MAIN WORKSPACE (Scrollable Canvas) ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 relative">
        {/* Admin Preview Bar (if active) */}
        {isPreview && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs font-medium text-amber-300 flex items-center justify-between shrink-0 z-40">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span>
                <strong>Staff Preview Mode:</strong> Viewing Student Portal as{" "}
                <span className="font-semibold text-white underline">{student?.name || "Student"}</span> ({student?.studentId}).
              </span>
            </div>
            <a
              href="/dashboard"
              className="flex items-center gap-1 text-xs text-amber-200 hover:text-white underline"
            >
              <span>Return to Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#070a12]/90 backdrop-blur-xl shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Desktop Left: Breadcrumb Page Title */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <span className="text-zinc-500">Student Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-white font-bold text-sm tracking-tight">{pageTitle}</span>
            </div>

            {/* Mobile Left: Brand Logo */}
            <Link href="/portal" className="flex items-center gap-2.5 lg:hidden group">
              <div className="p-1 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
                <InstituteLogo logoUrl={instituteLogoUrl} name={instituteName} size={30} />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-white uppercase truncate block max-w-[170px]">
                  {instituteName}
                </span>
                <span className="text-[9px] text-indigo-400 font-bold block -mt-0.5 uppercase tracking-wider">
                  STUDENT PORTAL
                </span>
              </div>
            </Link>

            {/* Desktop Right Quick Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/portal/id-card"
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <QrCode className="w-3.5 h-3.5 text-pink-400" />
                <span>Smart ID Card</span>
              </Link>

              <div className="px-3 py-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-300 font-mono text-[11px] font-semibold">
                  {student?.admissionNo || "Roll: Active"}
                </span>
              </div>
            </div>

            {/* Mobile Right: Profile Avatar & Menu Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href="/portal/profile"
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-600/30 border border-white/10"
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

          {/* Mobile Slide-down Menu */}
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

        {/* Main Content Area (Scrollable canvas, padded bottom for mobile dock) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-28 lg:pb-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* ── ULTRA-PREMIUM IPHONE FLOATING DOCK (Mobile only, < lg) ── */}
      <nav
        aria-label="Mobile Navigation Dock"
        className="fixed bottom-5 inset-x-4 max-w-[360px] mx-auto z-40 lg:hidden"
      >
        <div className="rounded-full bg-[#111625]/85 backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.18] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-between">
          {/* Home */}
          <Link
            href="/portal"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-90 ${
              pathname === "/portal"
                ? "text-white font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-[18px] h-[18px]" strokeWidth={2.2} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Home</span>
            {pathname === "/portal" && (
              <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />
            )}
          </Link>

          {/* Attendance */}
          <Link
            href="/portal/attendance"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-90 ${
              pathname.startsWith("/portal/attendance")
                ? "text-white font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <CalendarCheck2 className="w-[18px] h-[18px]" strokeWidth={2.2} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Attendance</span>
            {pathname.startsWith("/portal/attendance") && (
              <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />
            )}
          </Link>

          {/* ⚡ CENTER FROSTED MENU BUTTON */}
          <button
            onClick={() => setQuickSheetOpen(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center mx-1 transition-all active:scale-90 shadow-sm shrink-0 ${
              quickSheetOpen
                ? "bg-indigo-600 text-white shadow-indigo-600/50 scale-95"
                : "bg-gradient-to-b from-indigo-500/25 to-indigo-600/35 border border-indigo-400/35 text-indigo-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:border-indigo-400/50"
            }`}
            title="All Services & Apps"
            aria-label="All Services"
          >
            <LayoutGrid className="w-4 h-4" strokeWidth={2.4} />
          </button>

          {/* Batches */}
          <Link
            href="/portal/batches"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-90 ${
              pathname.startsWith("/portal/batches")
                ? "text-white font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-[18px] h-[18px]" strokeWidth={2.2} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Batches</span>
            {pathname.startsWith("/portal/batches") && (
              <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />
            )}
          </Link>

          {/* Profile */}
          <Link
            href="/portal/profile"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-90 ${
              pathname.startsWith("/portal/profile")
                ? "text-white font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Profile</span>
            {pathname.startsWith("/portal/profile") && (
              <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />
            )}
          </Link>
        </div>
      </nav>

      {/* ── iOS QUICK ACTION SHEET MODAL (Mobile Speed Dial) ── */}
      {quickSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            onClick={() => setQuickSheetOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
          />

          <div className="relative z-10 w-full max-w-lg mx-auto bg-[#0d1220]/95 backdrop-blur-2xl border-t border-white/[0.18] rounded-t-[32px] p-6 pb-9 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-white/25 mx-auto" />

            <div className="flex items-center justify-between pt-1">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Student Services Hub
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Instant mobile access to all academic departments
                </p>
              </div>
              <button
                onClick={() => setQuickSheetOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
    </div>
  );
}
