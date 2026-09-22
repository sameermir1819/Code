"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/permissions";
import { switchDevRole, logoutUser } from "@/server/actions/auth";
import {
  Bell,
  Search,
  LogOut,
  Moon,
  Sun,
  Shield,
  GraduationCap,
  Briefcase,
  Users,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentRole: Role;
  userName: string;
  unreadCount?: number;
}

const ROLES_LIST: { role: Role; label: string; icon: React.ReactNode; badge: string }[] = [
  { role: "SUPER_ADMIN", label: "Super Admin", icon: <Shield className="h-3.5 w-3.5" />, badge: "Full Access" },
  { role: "ADMIN", label: "Admin", icon: <Shield className="h-3.5 w-3.5" />, badge: "Operations" },
  { role: "ACCOUNTANT", label: "Accountant", icon: <Briefcase className="h-3.5 w-3.5" />, badge: "Finance" },
  { role: "TEACHER", label: "Teacher / Faculty", icon: <GraduationCap className="h-3.5 w-3.5" />, badge: "Academic" },
];

export function Header({ currentRole, userName, unreadCount = 0 }: HeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const handleRoleSwitch = (newRole: Role) => {
    setIsRoleDropdownOpen(false);
    startTransition(async () => {
      const res = await switchDevRole(newRole);
      if (res.success) {
        router.refresh();
      }
    });
  };

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
        {/* Live Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            disabled={isPending}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-primary transition-all shadow-xs cursor-pointer"
            title="Switch user role for live testing and preview"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden sm:inline text-muted-foreground font-normal">Role:</span>
            <span>{currentRole.replace("_", " ")}</span>
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card text-card-foreground shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b mb-1">
                Switch Live Role (RBAC)
              </div>
              {ROLES_LIST.map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleRoleSwitch(item.role)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-accent text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {currentRole === item.role ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
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
