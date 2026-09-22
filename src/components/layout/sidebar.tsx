"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/permissions";
import { InstituteLogo } from "@/components/ui/institute-logo";
import {
  LayoutDashboard,
  Users,
  Layers,
  CheckSquare,
  ClipboardList,
  Award,
  CreditCard,
  AlertCircle,
  Megaphone,
  Bell,
  Shield,
  FileSearch,
  Settings,
  GraduationCap,
  FileText,
  QrCode,
} from "lucide-react";

interface SidebarProps {
  userRole: Role;
  userName: string;
  logoUrl?: string | null;
  instituteName?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Additional hrefs that should also trigger active state */
  altHrefs?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
  /** Roles that can see this group; empty = all roles */
  roles?: Role[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "ACADEMICS",
    items: [
      {
        label: "Students",
        href: "/students",
        icon: Users,
        altHrefs: ["/admissions"],
      },
      {
        label: "Batches",
        href: "/dashboard/batches",
        icon: Layers,
        altHrefs: ["/batches"],
      },
      {
        label: "Faculty",
        href: "/teachers",
        icon: GraduationCap,
      },
      {
        label: "Attendance (QR)",
        href: "/attendance",
        icon: QrCode,
      },
      {
        label: "Exams & Tests",
        href: "/exams",
        icon: ClipboardList,
      },
      {
        label: "Results",
        href: "/results",
        icon: Award,
      },
      {
        label: "Study Materials",
        href: "/materials",
        icon: FileText,
      },
    ],
  },
  {
    title: "FINANCE",
    roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
    items: [
      {
        label: "Fee Collection",
        href: "/finance/payments",
        icon: CreditCard,
        altHrefs: ["/finance"],
      },
      {
        label: "Outstanding Dues",
        href: "/finance/outstanding",
        icon: AlertCircle,
      },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      {
        label: "Announcements",
        href: "/announcements",
        icon: Megaphone,
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
    ],
  },
  {
    title: "ADMINISTRATION",
    roles: ["SUPER_ADMIN", "ADMIN"],
    items: [
      {
        label: "Users & Roles",
        href: "/dashboard/users",
        icon: Shield,
        altHrefs: ["/users"],
      },
      {
        label: "Audit Log",
        href: "/audit",
        icon: FileSearch,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

/**
 * Per-item visibility map for fine-grained role control.
 * Keys match `href` values. If absent, item is visible to all in its group.
 */
const ITEM_ROLES: Record<string, Role[]> = {
  "/students": ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"],
  "/admissions": ["SUPER_ADMIN", "ADMIN"],
  "/dashboard/batches": ["SUPER_ADMIN", "ADMIN", "TEACHER"],
  "/teachers": ["SUPER_ADMIN", "ADMIN"],
  "/announcements": ["SUPER_ADMIN", "ADMIN", "TEACHER"],
};

/** Returns true if the given role can see the nav item at `href`. */
function canSeeItem(href: string, role: Role): boolean {
  const allowed = ITEM_ROLES[href];
  if (!allowed) return true; // no restriction → visible to all
  return allowed.includes(role);
}

/** Returns true if the given role can see the nav group. */
function canSeeGroup(group: NavGroup, role: Role): boolean {
  if (!group.roles || group.roles.length === 0) return true;
  return group.roles.includes(role);
}

export function Sidebar({ userRole, userName, logoUrl, instituteName = "Futurex Learning" }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem): boolean => {
    const hrefs = [item.href, ...(item.altHrefs ?? [])];
    return hrefs.some((h) => {
      if (h === "/dashboard") return pathname === "/dashboard";
      return pathname === h || pathname.startsWith(h + "/");
    });
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen text-sidebar-foreground select-none shrink-0">
      {/* ── Brand Header ────────────────────────────── */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border gap-3 shrink-0">
        <InstituteLogo logoUrl={logoUrl ?? null} name={instituteName} size={36} />
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-white">
            {instituteName.toUpperCase()}
          </span>
          <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">
            Institute ERP
          </span>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 text-xs">
        {NAV_GROUPS.map((group) => {
          if (!canSeeGroup(group, userRole)) return null;

          const visibleItems = group.items.filter((item) =>
            canSeeItem(item.href, userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-3">
              {/* Section Label */}
              <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                {group.title}
              </p>

              {/* Items */}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-white font-semibold shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-sidebar-accent"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {/* Active indicator dot */}
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User Footer ─────────────────────────────── */}
      <Link
        href="/settings"
        className="p-3 border-t border-sidebar-border bg-black/20 flex items-center gap-2.5 hover:bg-sidebar-accent transition-colors group cursor-pointer shrink-0"
        title="Customize My Profile & Settings"
      >
        <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-xs text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{userName}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide flex items-center justify-between">
            <span>{userRole.replace("_", " ")}</span>
            <span className="text-[9px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Edit →
            </span>
          </p>
        </div>
      </Link>
    </aside>
  );
}
