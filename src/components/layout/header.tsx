"use client";

import { useState, useTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Role } from "@/lib/permissions";
import { logoutUser } from "@/server/actions/auth";
import { GlobalSearchModal } from "./global-search-modal";
import {
  Bell,
  LogOut,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentRole: Role;
  userName: string;
  unreadCount?: number;
}

export function Header({
  currentRole,
  userName,
  unreadCount = 0,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser();
      router.push("/login");
      router.refresh();
    });
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const routeMeta = [
    ["/dashboard/batches", "Batches", "Academic operations"],
    ["/dashboard/users", "Users & Roles", "Access management"],
    ["/finance", "Finance", "Payments and collections"],
    ["/students", "Students", "Student lifecycle"],
    ["/faculty", "Faculty", "Teaching team"],
    ["/attendance", "Attendance", "Daily attendance"],
    ["/test-series", "Test Series", "Assessments"],
    ["/exams", "Exams", "Exams and marks"],
    ["/results", "Results", "Academic performance"],
    ["/materials", "Study Materials", "Learning resources"],
    ["/leads", "Leads & CRM", "Admissions pipeline"],
    ["/announcements", "Announcements", "Institute communication"],
    ["/notifications", "Notifications", "Activity inbox"],
    ["/settings", "Settings", "Institute configuration"],
    ["/dashboard", "Dashboard", "ERP overview"],
  ].find(([path]) => pathname === path || pathname.startsWith(`${path}/`)) || ["", "Workspace", "Futurex ERP"];

  return (
    <header className="h-[4.5rem] shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-xl pl-14 pr-2 sm:pr-4 lg:px-7 flex items-center justify-between gap-3 lg:gap-6 sticky top-0 z-30 font-poppins print:hidden shadow-[0_1px_0_hsl(var(--border)/0.4)]">
      <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
        <div className="hidden min-w-36 lg:block">
          <p className="truncate text-sm font-extrabold tracking-tight text-foreground">{routeMeta[1]}</p>
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{routeMeta[2]}</p>
        </div>
        <div className="w-full max-w-xl">
          <GlobalSearchModal />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-2.5">
        {/* Active User Role Badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-muted/40 text-xs font-semibold text-foreground shadow-2xs">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="tracking-wide text-[11px] font-bold">{currentRole.replace("_", " ")}</span>
        </div>

        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="hidden sm:flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 py-1.5 pl-1.5 pr-3 text-left shadow-sm transition-all hover:border-primary/30 hover:bg-card"
          title="Open profile"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-extrabold text-primary-foreground">
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden 2xl:block max-w-28 truncate text-[11px] font-bold text-foreground">{userName}</span>
        </button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Toggle Dark / Light Mode"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications Bell */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/notifications")}
          className="relative h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
          )}
        </Button>

        <div className="hidden sm:block h-5 w-px bg-border/60 mx-1" />

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl flex items-center gap-1.5 px-3 h-9 transition-colors"
          title="Sign out of ERP"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline font-semibold">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
