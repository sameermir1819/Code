"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/permissions";
import { logoutUser } from "@/server/actions/auth";
import {
  Bell,
  Search,
  LogOut,
  Moon,
  Sun,
  Shield,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentRole: Role;
  userName: string;
  unreadCount?: number;
}

export function Header({ currentRole, userName, unreadCount = 0 }: HeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDark, setIsDark] = useState(false);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser();
      router.push("/login");
      router.refresh();
    });
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students, batches, courses, receipts..."
            className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-muted/40 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Active User Role Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border bg-muted/50 text-xs font-semibold text-foreground">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span>{currentRole.replace("_", " ")}</span>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Toggle Dark / Light Mode"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications Bell */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/notifications")}
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 px-2"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
