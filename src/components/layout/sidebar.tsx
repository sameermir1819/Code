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
  ClipboardCheck,
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
  PhoneCall,
  Download,
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
        label: "Offline Test Series",
        href: "/test-series",
        icon: ClipboardCheck,
        altHrefs: ["/dashboard/test-series"],
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
      {
        label: "Leads & CRM",
        href: "/leads",
        icon: PhoneCall,
        altHrefs: ["/inquiries"],
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
        label: "Data Export",
        href: "/data-export",
        icon: Download,
        altHrefs: ["/export"],
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
  "/students": ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER", "COUNSELOR", "STAFF"],
  "/admissions": ["SUPER_ADMIN", "ADMIN"],
  "/leads": ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER", "COUNSELOR", "STAFF"],
  "/dashboard/batches": ["SUPER_ADMIN", "ADMIN", "TEACHER"],
  "/teachers": ["SUPER_ADMIN", "ADMIN"],
  "/test-series": ["SUPER_ADMIN", "ADMIN", "TEACHER"],
  "/announcements": ["SUPER_ADMIN", "ADMIN", "TEACHER"],
  "/data-export": ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
};

/** Returns true if the given role can see the nav item at `href`. */
function canSeeItem(href: string, role: Role): boolean {
  if (role === "SUPER_ADMIN") return true;
  const allowed = ITEM_ROLES[href];
  if (!allowed) return true; // no restriction → visible to all
  return allowed.includes(role);
}

/** Returns true if the given role can see the nav group. */
function canSeeGroup(group: NavGroup, role: Role): boolean {
  if (role === "SUPER_ADMIN") return true;
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
    <aside className="w-64 bg-[#090d16] border-r border-white/[0.08] flex flex-col h-screen text-zinc-300 select-none shrink-0 font-sans">
      {/* ── Brand Header ────────────────────────────── */}
      <div className="h-16 flex items-center px-5 border-b border-white/[0.08] gap-3 shrink-0 bg-[#070a12]">
        <InstituteLogo logoUrl={logoUrl ?? null} name={instituteName} size={36} />
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-sm tracking-tight text-white truncate">
            {instituteName.toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
              Institute ERP
            </span>
            <span className="text-zinc-600 text-[10px]">•</span>
            <span className="text-[9px] text-zinc-400 font-mono">v2.4</span>
          </div>
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
              <p className="px-3 mb-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
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
                        "flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all relative group",
                        active
                          ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-105", active ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")} />
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-xs shrink-0" />
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
        className="p-3.5 border-t border-white/[0.08] bg-[#070a12] flex items-center gap-2.5 hover:bg-white/[0.03] transition-colors group cursor-pointer shrink-0"
        title="Customize My Profile & Settings"
      >
        <div className="relative shrink-0">
          <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#070a12]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{userName}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide flex items-center justify-between">
            <span>{userRole.replace("_", " ")}</span>
            <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
              Settings →
            </span>
          </p>
        </div>
      </Link>
    </aside>
  );
}
