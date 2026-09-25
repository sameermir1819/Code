"use client";

import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { NAV_PERMISSIONS } from "@/lib/navigation-permissions";

const PermissionContext = createContext<readonly string[]>([]);
export function usePermissions() { return useContext(PermissionContext); }

export function PermissionProvider({ permissions, children }: { permissions: string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const prefix = Object.keys(NAV_PERMISSIONS).sort((a, b) => b.length - a.length).find((path) => pathname === path || pathname.startsWith(path + "/"));
  const code = prefix && NAV_PERMISSIONS[prefix];
  // Settings also hosts the user's own profile; its institute tab is gated separately.
  const allowed = pathname === "/settings" || !code || permissions.includes(code);
  return <PermissionContext.Provider value={permissions}>{allowed ? children : <div role="status" className="rounded-xl border bg-card p-6"><h1 className="text-lg font-semibold">Access restricted</h1><p className="mt-2 text-sm text-muted-foreground">This module is not available for your account. Choose an available item from navigation.</p></div>}</PermissionContext.Provider>;
}
