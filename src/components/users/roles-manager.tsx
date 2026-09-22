"use client";

import { useState, useTransition, useMemo } from "react";
import { createRole, updateRole, deleteRole } from "@/server/actions/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Edit3,
  Trash2,
  Users,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Check,
  Lock,
  Layers,
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  Sliders,
  Sparkles,
} from "lucide-react";

interface RolePermissionItem {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string | null;
}

interface RoleItem {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  isSystem: boolean;
  userCount: number;
  permissionsCount: number;
  permissions: RolePermissionItem[];
}

interface RolesManagerProps {
  initialRoles: RoleItem[];
  allPermissions: RolePermissionItem[];
  actorRole: string;
  onRoleChanged?: () => void;
}

// Module display metadata
const MODULE_CONFIG: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  users: { label: "Users & Staff", icon: Users, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  students: { label: "Students & Admissions", icon: BookOpen, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  teachers: { label: "Faculty & Instructors", icon: Users, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  academics: { label: "Academics & Batches", icon: Layers, color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  attendance: { label: "Classroom Attendance", icon: Calendar, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  finance: { label: "Fees & Collections", icon: CreditCard, color: "text-emerald-600 bg-emerald-600/10 border-emerald-600/20" },
  exams: { label: "Exams & Results", icon: FileText, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  reports: { label: "Reports & Analytics", icon: Sliders, color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" },
  settings: { label: "System & Audit Logs", icon: Lock, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
};

export function RolesManager({
  initialRoles,
  allPermissions,
  actorRole,
  onRoleChanged,
}: RolesManagerProps) {
  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);

  // Form states
  const [createFormData, setCreateFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    permissionCodes: [] as string[],
  });

  const [editFormData, setEditFormData] = useState({
    displayName: "",
    description: "",
    permissionCodes: [] as string[],
  });

  // Group all available permissions by module
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, RolePermissionItem[]> = {};
    for (const p of allPermissions) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }
    return grouped;
  }, [allPermissions]);

  // Filtered roles
  const filteredRoles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [roles, searchQuery]);

  // Overall KPI
  const totalRoles = roles.length;
  const customRolesCount = roles.filter((r) => !r.isSystem).length;
  const systemRolesCount = roles.filter((r) => r.isSystem).length;
  const totalPermissionsCount = allPermissions.length;

  // Handlers for Create
  const handleOpenCreate = () => {
    setCreateFormData({
      name: "",
      displayName: "",
      description: "",
      permissionCodes: [],
    });
    setErrorMsg("");
    setIsCreateModalOpen(true);
  };

  const handleToggleCreatePerm = (code: string) => {
    setCreateFormData((prev) => ({
      ...prev,
      permissionCodes: prev.permissionCodes.includes(code)
        ? prev.permissionCodes.filter((c) => c !== code)
        : [...prev.permissionCodes, code],
    }));
  };

  const handleToggleModuleInCreate = (moduleName: string) => {
    const modulePerms = permissionsByModule[moduleName] || [];
    const moduleCodes = modulePerms.map((p) => p.code);
    const allSelected = moduleCodes.every((c) => createFormData.permissionCodes.includes(c));

    setCreateFormData((prev) => ({
      ...prev,
      permissionCodes: allSelected
        ? prev.permissionCodes.filter((c) => !moduleCodes.includes(c))
        : Array.from(new Set([...prev.permissionCodes, ...moduleCodes])),
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!createFormData.displayName.trim()) {
      setErrorMsg("Role display title is required.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createRole({
          name: createFormData.name || createFormData.displayName,
          displayName: createFormData.displayName,
          description: createFormData.description,
          permissionCodes: createFormData.permissionCodes,
        });

        if (res.success && res.role) {
          const newRoleItem: RoleItem = {
            id: res.role.id,
            name: res.role.name,
            displayName: res.role.displayName,
            description: res.role.description,
            isSystem: res.role.isSystem,
            userCount: 0,
            permissionsCount: createFormData.permissionCodes.length,
            permissions: allPermissions.filter((p) =>
              createFormData.permissionCodes.includes(p.code)
            ),
          };
          setRoles((prev) => [...prev, newRoleItem]);
          setSuccessMsg(`Role "${res.role.displayName}" created successfully.`);
          setIsCreateModalOpen(false);
          if (onRoleChanged) onRoleChanged();
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to create role.");
      }
    });
  };

  // Handlers for Edit
  const handleOpenEdit = (r: RoleItem) => {
    setEditingRole(r);
    setEditFormData({
      displayName: r.displayName,
      description: r.description || "",
      permissionCodes: r.permissions.map((p) => p.code),
    });
    setErrorMsg("");
  };

  const handleToggleEditPerm = (code: string) => {
    setEditFormData((prev) => ({
      ...prev,
      permissionCodes: prev.permissionCodes.includes(code)
        ? prev.permissionCodes.filter((c) => c !== code)
        : [...prev.permissionCodes, code],
    }));
  };

  const handleToggleModuleInEdit = (moduleName: string) => {
    const modulePerms = permissionsByModule[moduleName] || [];
    const moduleCodes = modulePerms.map((p) => p.code);
    const allSelected = moduleCodes.every((c) => editFormData.permissionCodes.includes(c));

    setEditFormData((prev) => ({
      ...prev,
      permissionCodes: allSelected
        ? prev.permissionCodes.filter((c) => !moduleCodes.includes(c))
        : Array.from(new Set([...prev.permissionCodes, ...moduleCodes])),
    }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    setErrorMsg("");

    startTransition(async () => {
      try {
        const res = await updateRole(editingRole.id, {
          displayName: editFormData.displayName,
          description: editFormData.description,
          permissionCodes: editFormData.permissionCodes,
        });

        if (res.success) {
          setRoles((prev) =>
            prev.map((r) => {
              if (r.id === editingRole.id) {
                return {
                  ...r,
                  displayName: editFormData.displayName,
                  description: editFormData.description,
                  permissionsCount: editFormData.permissionCodes.length,
                  permissions: allPermissions.filter((p) =>
                    editFormData.permissionCodes.includes(p.code)
                  ),
                };
              }
              return r;
            })
          );
          setSuccessMsg(`Role "${editFormData.displayName}" updated successfully.`);
          setEditingRole(null);
          if (onRoleChanged) onRoleChanged();
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to update role.");
      }
    });
  };

  // Handlers for Delete
  const handleDeleteConfirm = () => {
    if (!deletingRole) return;
    setErrorMsg("");

    startTransition(async () => {
      try {
        const res = await deleteRole(deletingRole.id);
        if (res.success) {
          setRoles((prev) => prev.filter((r) => r.id !== deletingRole.id));
          setSuccessMsg(`Custom role "${deletingRole.displayName}" deleted successfully.`);
          setDeletingRole(null);
          if (onRoleChanged) onRoleChanged();
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to delete role.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Roles & Permissions Matrix
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              RBAC v2
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure system access levels, create custom administrative designations, and manage granular module rights.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 text-xs font-semibold shadow shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Custom Role</span>
        </Button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Roles</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2">{totalRoles}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            <strong className="text-foreground">{customRolesCount} Custom</strong> designations active
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Custom Roles</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {customRolesCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Customizable institute roles</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">System Protected</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2">{systemRolesCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Core operational roles</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Permissions Pool</span>
            <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/50 flex items-center justify-center">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2">{totalPermissionsCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Granular security capabilities</p>
        </Card>
      </div>

      {/* Search Toolbar */}
      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles by title, identifier code, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </Card>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRoles.map((r) => {
          const coveragePercent = Math.round(
            (r.permissionsCount / Math.max(1, totalPermissionsCount)) * 100
          );

          return (
            <Card
              key={r.id}
              className={`flex flex-col justify-between transition-all hover:shadow-md ${
                !r.isSystem ? "border-emerald-500/30 bg-emerald-500/[0.02]" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">
                        {r.displayName}
                      </CardTitle>
                      {r.isSystem ? (
                        <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5">
                          System
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] font-semibold">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      CODE: <strong>{r.name}</strong>
                    </p>
                  </div>

                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed min-h-8">
                  {r.description || "No specific administrative duties described."}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 pt-0 text-xs">
                {/* Metrics Pill & Coverage */}
                <div className="p-3 rounded-lg bg-muted/40 border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px] font-medium">
                      Permission Coverage
                    </span>
                    <span className="font-semibold text-foreground text-[11px]">
                      {r.permissionsCount} / {totalPermissionsCount} ({coveragePercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        coveragePercent >= 90
                          ? "bg-primary"
                          : coveragePercent >= 40
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${coveragePercent}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Staff Count */}
                <div className="flex items-center justify-between text-muted-foreground pt-1 border-t">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>Assigned Accounts:</span>
                    <strong className="text-foreground">{r.userCount}</strong>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(r)}
                    className="text-xs h-8 flex-1"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                    <span>Edit Rights</span>
                  </Button>

                  {!r.isSystem ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingRole(r)}
                      className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5"
                      title="Delete Custom Role"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <span
                      title="Built-in system roles cannot be deleted to protect security integrity."
                      className="text-[10px] text-muted-foreground p-1 px-2 border rounded bg-muted/30 cursor-not-allowed flex items-center gap-1"
                    >
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CREATE CUSTOM ROLE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-card border rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Create Custom Role</h3>
                  <p className="text-xs text-muted-foreground">
                    Define an institute designation and configure its modular permission matrix.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Role Display Title *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Academic Coordinator / Counselor"
                    value={createFormData.displayName}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title
                        .toUpperCase()
                        .replace(/[^A-Z0-9 ]/g, "")
                        .trim()
                        .replace(/\s+/g, "_");
                      setCreateFormData({
                        ...createFormData,
                        displayName: title,
                        name: createFormData.name ? createFormData.name : slug,
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Role Identifier Code *
                  </label>
                  <Input
                    required
                    placeholder="e.g. ACADEMIC_COORDINATOR"
                    value={createFormData.name}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
                      })
                    }
                    className="font-mono uppercase"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Unique uppercase code used for security assertions.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-foreground">
                    Role Scope & Description
                  </label>
                  <Input
                    placeholder="e.g. Oversees student admissions, batch scheduling, and teacher assignments."
                    value={createFormData.description}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Modular Permissions Matrix */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Key className="h-4 w-4 text-primary" /> Permission Matrix Assignment
                  </h4>
                  <span className="text-xs font-semibold text-primary">
                    {createFormData.permissionCodes.length} of {totalPermissionsCount} Selected
                  </span>
                </div>

                <div className="space-y-3">
                  {Object.entries(permissionsByModule).map(([modName, perms]) => {
                    const modConfig = MODULE_CONFIG[modName] || {
                      label: modName.toUpperCase(),
                      icon: Layers,
                      color: "text-primary bg-primary/10",
                    };
                    const ModIcon = modConfig.icon;
                    const allSelected = perms.every((p) =>
                      createFormData.permissionCodes.includes(p.code)
                    );

                    return (
                      <div
                        key={modName}
                        className="border rounded-lg p-3 bg-muted/20 space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md border ${modConfig.color}`}>
                              <ModIcon className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold text-xs text-foreground">
                              {modConfig.label}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleModuleInCreate(modName)}
                            className="text-[11px] h-6 px-2 text-primary"
                          >
                            {allSelected ? "Deselect Module" : "Select All in Module"}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((p) => {
                            const isSelected = createFormData.permissionCodes.includes(p.code);
                            return (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => handleToggleCreatePerm(p.code)}
                                className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary/15 text-primary font-semibold"
                                    : "border-input bg-card hover:bg-muted text-muted-foreground"
                                }`}
                              >
                                <div className="flex flex-col min-w-0 pr-1">
                                  <span className="text-xs truncate">{p.name}</span>
                                  <span className="text-[10px] opacity-75 font-mono">{p.code}</span>
                                </div>
                                <div
                                  className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                                    isSelected
                                      ? "bg-primary border-primary text-white"
                                      : "border-muted-foreground/40"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Save New Role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editingRole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-card border rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Configure Role: {editingRole.displayName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Update role title, administrative duties, and granular permissions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRole(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Role Display Title *
                  </label>
                  <Input
                    required
                    value={editFormData.displayName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, displayName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">
                    Role Identifier Code
                  </label>
                  <Input
                    disabled
                    value={editingRole.name}
                    className="font-mono uppercase bg-muted text-muted-foreground"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-foreground">
                    Role Description
                  </label>
                  <Input
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Modular Permissions Matrix */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Key className="h-4 w-4 text-primary" /> Active Permissions
                  </h4>
                  <span className="text-xs font-semibold text-primary">
                    {editFormData.permissionCodes.length} of {totalPermissionsCount} Assigned
                  </span>
                </div>

                <div className="space-y-3">
                  {Object.entries(permissionsByModule).map(([modName, perms]) => {
                    const modConfig = MODULE_CONFIG[modName] || {
                      label: modName.toUpperCase(),
                      icon: Layers,
                      color: "text-primary bg-primary/10",
                    };
                    const ModIcon = modConfig.icon;
                    const allSelected = perms.every((p) =>
                      editFormData.permissionCodes.includes(p.code)
                    );

                    return (
                      <div
                        key={modName}
                        className="border rounded-lg p-3 bg-muted/20 space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md border ${modConfig.color}`}>
                              <ModIcon className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold text-xs text-foreground">
                              {modConfig.label}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleModuleInEdit(modName)}
                            className="text-[11px] h-6 px-2 text-primary"
                          >
                            {allSelected ? "Deselect Module" : "Select All in Module"}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((p) => {
                            const isSelected = editFormData.permissionCodes.includes(p.code);
                            return (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => handleToggleEditPerm(p.code)}
                                className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary/15 text-primary font-semibold"
                                    : "border-input bg-card hover:bg-muted text-muted-foreground"
                                }`}
                              >
                                <div className="flex flex-col min-w-0 pr-1">
                                  <span className="text-xs truncate">{p.name}</span>
                                  <span className="text-[10px] opacity-75 font-mono">{p.code}</span>
                                </div>
                                <div
                                  className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                                    isSelected
                                      ? "bg-primary border-primary text-white"
                                      : "border-muted-foreground/40"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingRole(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CUSTOM ROLE MODAL */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Delete Role "{deletingRole.displayName}"?
              </h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to permanently delete this custom role ({deletingRole.name})?
                This action cannot be undone.
              </p>
              {deletingRole.userCount > 0 && (
                <p className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-semibold mt-2">
                  Warning: There are currently {deletingRole.userCount} active account(s) assigned to this role. You must reassign them before deleting.
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingRole(null)}
                disabled={isPending}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isPending || deletingRole.userCount > 0}
                className="flex-1 text-xs"
              >
                {isPending ? "Deleting..." : "Yes, Delete Role"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

