"use client";

import { useState, useEffect, useTransition, useMemo, useRef } from "react";
import {
  getUsers,
  changeUserStatus,
  changeUserRole,
  archiveUser,
  bulkUpdateUsersStatus,
  exportUsersCSV,
  provisionStudentUserAccounts,
  deleteStudentUser,
} from "@/server/actions/users";
import { switchActiveCampus } from "@/server/actions/campus";
import { Role } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateUserModal } from "./create-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { UserDetailsDrawer } from "./user-details-drawer";
import { ConfirmModal } from "./user-modals";
import { RolesManager } from "./roles-manager";
import { getRoles } from "@/server/actions/roles";
import {
  User,
  Users,
  UserCheck,
  ShieldCheck,
  UserX,
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  Building,
  ShieldAlert,
  Shield,
} from "lucide-react";

interface UsersTableProps {
  initialData: any;
  actorRole: Role;
  availableSubjects?: any[];
  initialRoles?: any[];
  allPermissions?: any[];
  availableCampuses?: any[];
  initialCampusId?: string;
}

export function UsersTable({
  initialData,
  actorRole,
  availableSubjects = [],
  initialRoles = [],
  allPermissions = [],
  availableCampuses = [],
  initialCampusId = "ALL",
}: UsersTableProps) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  // Sync data when initialData prop changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    setCampusFilter(initialCampusId);
  }, [initialCampusId]);

  const refreshUsersRef = useRef<(newPage?: number, selectedCampusId?: string) => void>(() => {});
  useEffect(() => {
    refreshUsersRef.current = (newPage, selectedCampusId) => refreshUsers(newPage, selectedCampusId);
  });

  // Reactive auto-refresh when campus or data changes globally
  useEffect(() => {
    const handleReactiveRefresh = (event: Event) => {
      const campusId = (event as CustomEvent<{ campusId?: string }>).detail?.campusId;
      if (event.type === "erp-campus-changed" && campusId) {
        refreshUsersRef.current(1, campusId);
      } else {
        refreshUsersRef.current();
      }
    };
    window.addEventListener("erp-campus-changed", handleReactiveRefresh);
    window.addEventListener("erp-data-refresh", handleReactiveRefresh);
    return () => {
      window.removeEventListener("erp-campus-changed", handleReactiveRefresh);
      window.removeEventListener("erp-data-refresh", handleReactiveRefresh);
    };
  }, []);

  // Active View Tab: "directory" vs "roles"
  const [activeTab, setActiveTab] = useState<"directory" | "roles">("directory");
  const [rolesList, setRolesList] = useState<any[]>(initialRoles);

  // Callback when roles are modified/created/deleted in RolesManager
  const handleRolesChanged = async () => {
    try {
      const freshRoles = await getRoles();
      setRolesList(freshRoles);
      refreshUsers();
    } catch (err) {
      console.error("Failed to refresh roles:", err);
    }
  };

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [campusFilter, setCampusFilter] = useState(initialCampusId);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "lastLoginAt" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modals & Drawers State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  // Confirmation Modals State
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "destructive" | "default";
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    variant: "default",
    action: async () => {},
  });

  const canCreateUsers = ["SUPER_ADMIN", "ADMIN"].includes(actorRole);

  // Fetch updated users list
  const refreshUsers = (newPage = page, selectedCampusId = campusFilter) => {
    startTransition(async () => {
      try {
        const res = await getUsers({
          search,
          role: roleFilter,
          status: statusFilter,
          branch: branchFilter,
          campusId: selectedCampusId,
          page: newPage,
          limit,
          sortBy,
          sortOrder,
        });
        if (res.success) {
          setData(res);
          setSelectedIds([]);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load users.");
      }
    });
  };

  const handleCampusChange = (selectedCampusId: string) => {
    setErrorMsg("");
    setPage(1);
    startTransition(async () => {
      try {
        if (selectedCampusId !== "ALL" && selectedCampusId !== "GLOBAL") {
          const result = await switchActiveCampus(selectedCampusId);
          if (!result.success) throw new Error(result.error || "Failed to switch centre.");
          setCampusFilter(selectedCampusId);
          window.dispatchEvent(
            new CustomEvent("erp-campus-changed", {
              detail: { campusId: selectedCampusId, campus: result.campus },
            })
          );
          return;
        }

        const result = await getUsers({
          search,
          role: roleFilter,
          status: statusFilter,
          branch: branchFilter,
          campusId: selectedCampusId,
          page: 1,
          limit,
          sortBy,
          sortOrder,
        });
        if (result.success) {
          setCampusFilter(selectedCampusId);
          setData(result);
          setSelectedIds([]);
        } else {
          throw new Error("Failed to load users for the selected centre.");
        }
      } catch (error: unknown) {
        setErrorMsg(error instanceof Error ? error.message : "Failed to load users for the selected centre.");
      }
    });
  };

  // Trigger search / filter update
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refreshUsers(1);
  };

  // Sort toggle
  const toggleSort = (field: "name" | "createdAt" | "lastLoginAt" | "status") => {
    const nextOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(nextOrder);
    startTransition(async () => {
      const res = await getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        branch: branchFilter,
        campusId: campusFilter,
        page: 1,
        limit,
        sortBy: field,
        sortOrder: nextOrder,
      });
      if (res.success) setData(res);
    });
  };

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(data.users.map((u: any) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Action: Deactivate User
  const promptDeactivate = (user: any) => {
    const isActivating = user.status !== "ACTIVE";
    setConfirmModalConfig({
      isOpen: true,
      title: isActivating ? `Activate ${user.name}?` : `Deactivate ${user.name}?`,
      description: isActivating
        ? `${user.name} will regain full sign-in access to the ERP platform.`
        : `${user.name} will be immediately barred from signing in to the platform. Historical student, academic, and financial records will remain completely preserved.`,
      confirmLabel: isActivating ? "Activate User" : "Deactivate User",
      variant: isActivating ? "default" : "destructive",
      action: async () => {
        const nextStatus = isActivating ? "ACTIVE" : "INACTIVE";
        await changeUserStatus(user.id, nextStatus);
        setSuccessMsg(`User status updated to ${nextStatus}.`);
        refreshUsers();
      },
    });
  };

  // Action: Archive User
  const promptArchive = (user: any) => {
    if (user.role === "STUDENT" && user.student) {
      setConfirmModalConfig({
        isOpen: true,
        title: `Delete ${user.name} and student record?`,
        description:
          "This permanently deletes the student's login and student record, including linked academic, attendance, fee, payment, and exam records. This cannot be undone.",
        confirmLabel: "Delete Student & User",
        variant: "destructive",
        action: async () => {
          await deleteStudentUser(user.id);
          setSuccessMsg(`Student ${user.name} and linked records deleted.`);
          refreshUsers();
        },
      });
      return;
    }

    setConfirmModalConfig({
      isOpen: true,
      title: `Archive Account for ${user.name}?`,
      description: `This account will be archived and hidden from the standard directory. Access credentials will be disabled while preserving relational integrity across all modules.`,
      confirmLabel: "Archive User",
      variant: "destructive",
      action: async () => {
        await archiveUser(user.id);
        setSuccessMsg(`User ${user.name} archived.`);
        refreshUsers();
      },
    });
  };

  // Action: Bulk Status Update
  const handleBulkStatus = (newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED") => {
    if (selectedIds.length === 0) return;

    setConfirmModalConfig({
      isOpen: true,
      title: `Bulk Update ${selectedIds.length} Users?`,
      description: `Set status to "${newStatus}" for ${selectedIds.length} selected accounts. Protected Super Admin accounts will not be affected.`,
      confirmLabel: `Set ${newStatus}`,
      variant: newStatus === "ACTIVE" ? "default" : "destructive",
      action: async () => {
        const res = await bulkUpdateUsersStatus(selectedIds, newStatus);
        setSuccessMsg(`Successfully updated ${res.count} users to ${newStatus}.`);
        refreshUsers();
      },
    });
  };

  // Action: Export CSV
  const handleExportCSV = async () => {
    try {
      const res = await exportUsersCSV();
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", res.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to export CSV.");
    }
  };

  const handleProvisionStudentAccounts = () => {
    setErrorMsg("");
    startTransition(async () => {
      try {
        const result = await provisionStudentUserAccounts();
        setSuccessMsg(
          result.createdCount > 0
            ? `Created ${result.createdCount} student login account${result.createdCount === 1 ? "" : "s"}. Their first-time password is their Student ID.`
            : "All existing students already have login accounts."
        );
        refreshUsers();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to create student login accounts.");
      }
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "default";
      case "ADMIN":
        return "secondary";
      case "ACCOUNTANT":
        return "outline";
      case "TEACHER":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Users & Role Management</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {activeTab === "directory" ? `${data.total} Accounts` : `${rolesList.length} Roles`}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeTab === "directory"
              ? "Enterprise RBAC directory, role provisioning, status controls, and granular permission overrides."
              : "Define custom roles, configure granular permissions matrix, and control access across ERP modules."}
          </p>
        </div>
        {activeTab === "directory" && availableCampuses.length > 0 && (
          <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>Centre</span>
            <select
              aria-label="Filter users by centre"
              value={campusFilter}
              onChange={(event) => handleCampusChange(event.target.value)}
              disabled={isPending}
              className="h-9 min-w-52 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground"
            >
              <option value="ALL">All Centres</option>
              <option value="GLOBAL">Central / Global (No Centre)</option>
              {availableCampuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name} ({campus.code})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* View Switcher Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-1 p-1 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border/60 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "directory"
                ? "bg-background text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>User Directory</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
              {data.total}
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "roles"
                ? "bg-background text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Roles & Permissions</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
              {rolesList.length}
            </Badge>
          </button>
        </div>

        {activeTab === "directory" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>

            {canCreateUsers && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleProvisionStudentAccounts}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>{isPending ? "Adding Students..." : "Add Existing Students"}</span>
              </Button>
            )}

            {canCreateUsers && (
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold shadow"
              >
                <Plus className="h-4 w-4" />
                <span>Create User</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Content: Directory vs Roles */}
      {activeTab === "roles" ? (
        <RolesManager
          initialRoles={rolesList}
          allPermissions={allPermissions}
          actorRole={actorRole}
          onRoleChanged={handleRolesChanged}
        />
      ) : (
        <>
          {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Total Directory</span>
            <span className="text-xl font-bold">{data.stats?.totalUsers || 0}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Active Users</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {data.stats?.activeUsers || 0}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Administrators</span>
            <span className="text-xl font-bold">{data.stats?.adminUsers || 0}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 flex items-center justify-center shrink-0">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Inactive / Suspended</span>
            <span className="text-xl font-bold text-red-600 dark:text-red-400">
              {data.stats?.inactiveUsers || 0}
            </span>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
          <div className="flex-1 w-full md:w-auto relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name, email, phone, or ID..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
                setTimeout(() => refreshUsers(1), 50);
              }}
              className="h-9 px-2.5 rounded-md border border-input bg-background text-xs text-foreground"
            >
              <option value="ALL">All Roles</option>
              {rolesList.length > 0 ? (
                rolesList.map((r) => (
                  <option key={r.id || r.name} value={r.name}>
                    {r.displayName || r.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent</option>
                </>
              )}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
                setTimeout(() => refreshUsers(1), 50);
              }}
              className="h-9 px-2.5 rounded-md border border-input bg-background text-xs text-foreground"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <Button type="submit" size="sm" variant="default" className="h-9">
              Apply
            </Button>

            {(search || roleFilter !== "ALL" || statusFilter !== "ALL" || campusFilter !== "ALL") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                  setCampusFilter("ALL");
                  setPage(1);
                  startTransition(async () => {
                    const res = await getUsers({ page: 1, limit, sortBy, sortOrder });
                    if (res.success) setData(res);
                  });
                }}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && canCreateUsers && (
          <div className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs bg-muted/40 p-2.5 rounded-lg animate-in fade-in">
            <span className="font-semibold text-primary">
              {selectedIds.length} user{selectedIds.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatus("ACTIVE")}
                className="h-7 text-xs text-emerald-600 hover:bg-emerald-50"
              >
                Activate Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatus("INACTIVE")}
                className="h-7 text-xs text-amber-600 hover:bg-amber-50"
              >
                Deactivate Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatus("SUSPENDED")}
                className="h-7 text-xs text-red-600 hover:bg-red-50"
              >
                Suspend Selected
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Main Table / Grid */}
      <Card className="overflow-hidden border">
        {data.users?.length === 0 ? (
          <div className="p-12 text-center text-xs space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-sm text-foreground">No Users Found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              No user records match your search or filter parameters. Try adjusting filters or create a new user.
            </p>
            {canCreateUsers && (
              <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="mt-2">
                + Create User
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                  <th className="p-3 pl-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === data.users.length && data.users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-input text-primary"
                    />
                  </th>
                  <th
                    onClick={() => toggleSort("name")}
                    className="p-3 cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>User</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3">Role</th>
                  <th
                    onClick={() => toggleSort("status")}
                    className="p-3 cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3">Allotted Campus</th>
                  <th
                    onClick={() => toggleSort("lastLoginAt")}
                    className="p-3 cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Last Login</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("createdAt")}
                    className="p-3 cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Created</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.users.map((u: any) => {
                  const isSuperAdmin = u.role === "SUPER_ADMIN";
                  const isAdmin = u.role === "ADMIN";
                  const canEditThisUser =
                    actorRole === "SUPER_ADMIN" ||
                    (actorRole === "ADMIN" && !isSuperAdmin);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-muted/25 transition-colors ${
                        selectedIds.includes(u.id) ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-3 pl-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(u.id)}
                          onChange={() => handleSelectOne(u.id)}
                          className="rounded border-input text-primary"
                        />
                      </td>

                      {/* User Info Column */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
                          </div>
                          <div>
                            <span
                              onClick={() => setViewingUserId(u.id)}
                              className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors block"
                            >
                              {u.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-3">
                        <div className="flex flex-col items-start gap-0.5">
                          <Badge variant={getRoleBadgeVariant(u.role)} className="font-mono text-[10px]">
                            {rolesList.find((r) => r.name === u.role)?.displayName || u.role}
                          </Badge>
                          {rolesList.some((r) => r.name === u.role && r.displayName && r.displayName !== u.role) && (
                            <span className="text-[9px] font-mono text-muted-foreground uppercase">{u.role}</span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3">
                        <Badge
                          variant={
                            u.status === "ACTIVE"
                               ? "success"
                              : u.status === "SUSPENDED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {u.status}
                        </Badge>
                      </td>

                      {/* Allotted Campus */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-md bg-muted/70 flex items-center justify-center shrink-0 text-muted-foreground border">
                            <Building className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-xs">
                              {u.institute?.name || u.branch || "All Campuses"}
                            </span>
                            {u.institute?.code ? (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {u.institute.code} {u.institute.city ? `• ${u.institute.city}` : ""}
                              </span>
                            ) : !u.instituteId ? (
                              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                Global / Central Admin
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="p-3 text-muted-foreground">
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : <span className="italic">Never</span>}
                      </td>

                      {/* Created Date */}
                      <td className="p-3 text-muted-foreground">{formatDate(u.createdAt)}</td>

                      {/* Action Buttons */}
                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingUserId(u.id)}
                            title="View Full Profile & Permissions"
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {canEditThisUser && (
                            <button
                              onClick={() => setEditingUser(u)}
                              title="Edit User"
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {canEditThisUser && !isSuperAdmin && (
                            <button
                              onClick={() => promptDeactivate(u)}
                              title={u.status === "ACTIVE" ? "Deactivate User" : "Activate User"}
                              className={`p-1.5 rounded transition-colors ${
                                u.status === "ACTIVE"
                                  ? "hover:bg-amber-100 text-amber-600 dark:hover:bg-amber-950/50"
                                  : "hover:bg-emerald-100 text-emerald-600 dark:hover:bg-emerald-950/50"
                              }`}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {canEditThisUser &&
                            !isSuperAdmin &&
                            (u.role !== "STUDENT" || actorRole === "SUPER_ADMIN") && (
                            <button
                              onClick={() => promptArchive(u)}
                              title={
                                u.role === "STUDENT" && u.student
                                  ? "Delete Student and User"
                                  : "Archive User"
                              }
                              className="p-1.5 rounded hover:bg-red-100 text-red-600 dark:hover:bg-red-950/50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Showing {data.users.length > 0 ? (data.page - 1) * data.limit + 1 : 0} to{" "}
              {Math.min(data.page * data.limit, data.total)} of {data.total} users
            </span>
            <span className="hidden sm:inline">•</span>
            <div className="hidden sm:flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setLimit(newLimit);
                  setPage(1);
                  startTransition(async () => {
                    const res = await getUsers({
                      search,
                      role: roleFilter,
                      status: statusFilter,
                      branch: branchFilter,
                      page: 1,
                      limit: newLimit,
                      sortBy,
                      sortOrder,
                    });
                    if (res.success) setData(res);
                  });
                }}
                className="h-7 px-1 rounded border border-input bg-background text-foreground"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prevPage = Math.max(1, page - 1);
                setPage(prevPage);
                refreshUsers(prevPage);
              }}
              disabled={page <= 1 || isPending}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>

            <span className="px-2 font-medium text-foreground">
              {page} of {data.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextPage = Math.min(data.totalPages, page + 1);
                setPage(nextPage);
                refreshUsers(nextPage);
              }}
              disabled={page >= data.totalPages || isPending}
              className="h-8 px-2"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
        </>
      )}

      {/* Modals & Drawers */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newUser) => {
          setSuccessMsg(`Account for "${newUser.name}" created successfully.`);
          refreshUsers();
        }}
        actorRole={actorRole}
        availableSubjects={availableSubjects}
        availableRoles={rolesList}
        availableCampuses={availableCampuses}
      />

      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={(updated) => {
          setSuccessMsg(`Account for "${updated.name}" updated successfully.`);
          refreshUsers();
        }}
        actorRole={actorRole}
        availableSubjects={availableSubjects}
        availableRoles={rolesList}
        availableCampuses={availableCampuses}
      />

      <UserDetailsDrawer
        userId={viewingUserId}
        onClose={() => setViewingUserId(null)}
        onEdit={(u) => {
          setViewingUserId(null);
          setEditingUser(u);
        }}
        onStatusChange={(u) => promptDeactivate(u)}
        onRoleChange={(u) => {
          setViewingUserId(null);
          setEditingUser(u);
        }}
        onArchive={(u) => promptArchive(u)}
        actorRole={actorRole}
        availableSubjects={availableSubjects}
      />

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        description={confirmModalConfig.description}
        confirmLabel={confirmModalConfig.confirmLabel}
        variant={confirmModalConfig.variant}
        isLoading={isPending}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          try {
            await confirmModalConfig.action();
          } catch (err: any) {
            setErrorMsg(err.message || "Action failed.");
          } finally {
            setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
          }
        }}
      />
    </div>
  );
}
