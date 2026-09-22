"use client";

import { useState, useEffect, useTransition } from "react";
import { getUser, getUserPermissions, updateUserPermissions } from "@/server/actions/users";
import { Role, ROLE_PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  X,
  User,
  Shield,
  Clock,
  Key,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Building,
  Calendar,
  Layers,
  History,
  BookOpen,
  Edit3,
} from "lucide-react";

interface UserDetailsDrawerProps {
  userId: string | null;
  onClose: () => void;
  onEdit: (user: any) => void;
  onStatusChange: (user: any) => void;
  onRoleChange: (user: any) => void;
  onArchive: (user: any) => void;
  actorRole: Role;
  availableSubjects?: any[];
}

export function UserDetailsDrawer({
  userId,
  onClose,
  onEdit,
  onStatusChange,
  onRoleChange,
  onArchive,
  actorRole,
}: UserDetailsDrawerProps) {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [permissionsData, setPermissionsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSavingPerms, startPermTransition] = useTransition();

  // Permission override state (permissionId -> "DEFAULT" | "GRANTED" | "REVOKED")
  const [permOverrides, setPermOverrides] = useState<Record<string, "DEFAULT" | "GRANTED" | "REVOKED">>({});

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg("");

    async function fetchData() {
      try {
        const [resUser, resPerms] = await Promise.all([
          getUser(userId!),
          actorRole === "SUPER_ADMIN" ? getUserPermissions(userId!) : Promise.resolve(null),
        ]);

        if (isMounted) {
          if (resUser.success) {
            setUserDetails(resUser.user);
          }
          if (resPerms && resPerms.success) {
            setPermissionsData(resPerms.permissions);
            const initialMap: Record<string, "DEFAULT" | "GRANTED" | "REVOKED"> = {};
            resPerms.permissions.forEach((p: any) => {
              initialMap[p.id] = p.overrideState;
            });
            setPermOverrides(initialMap);
          }
        }
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || "Failed to load user details.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [userId, actorRole]);

  if (!userId) return null;

  const handleTogglePermOverride = (permId: string, currentEffective: boolean) => {
    setPermOverrides((prev) => {
      const current = prev[permId] || "DEFAULT";
      let next: "DEFAULT" | "GRANTED" | "REVOKED" = "DEFAULT";
      if (current === "DEFAULT") {
        next = currentEffective ? "REVOKED" : "GRANTED";
      } else {
        next = "DEFAULT";
      }
      return { ...prev, [permId]: next };
    });
  };

  const handleSavePermissions = () => {
    if (!permissionsData) return;
    setErrorMsg("");
    setSuccessMsg("");

    const overridesList = Object.entries(permOverrides).map(([permissionId, overrideState]) => ({
      permissionId,
      overrideState,
    }));

    startPermTransition(async () => {
      try {
        await updateUserPermissions(userId, overridesList);
        setSuccessMsg("Custom permissions updated successfully!");
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to save permissions.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="bg-card border-l w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-base border">
              {userDetails?.name ? userDetails.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {userDetails?.name || "Loading User..."}
                </h2>
                {userDetails?.status && (
                  <Badge
                    variant={
                      userDetails.status === "ACTIVE"
                        ? "success"
                        : userDetails.status === "SUSPENDED"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {userDetails.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {userDetails?.email} • Role:{" "}
                <strong className="text-foreground font-mono">{userDetails?.role}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4 py-8 text-center text-xs text-muted-foreground">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p>Loading full profile and permissions...</p>
            </div>
          ) : userDetails ? (
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="account" className="text-xs">
                  Account
                </TabsTrigger>
                <TabsTrigger value="permissions" className="text-xs">
                  RBAC & Rights
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-xs">
                  Audit History
                </TabsTrigger>
                <TabsTrigger value="security" className="text-xs">
                  Security
                </TabsTrigger>
              </TabsList>

              {/* 1. Account Information Tab */}
              <TabsContent value="account" className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </span>
                    <strong className="text-foreground block text-sm font-semibold">{userDetails.email}</strong>
                  </div>

                  <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Phone className="h-3.5 w-3.5" /> Contact Phone
                    </span>
                    <strong className="text-foreground block text-sm font-semibold">
                      {userDetails.phone || "Not Provided"}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Building className="h-3.5 w-3.5" /> Allotted Campus / Branch
                    </span>
                    <strong className="text-foreground block text-sm font-semibold">
                      {userDetails.institute?.name || userDetails.branch || "All Campuses"}
                    </strong>
                    {userDetails.institute?.code ? (
                      <span className="text-[10px] font-mono text-muted-foreground block">
                        Code: {userDetails.institute.code} {userDetails.institute.city ? `• ${userDetails.institute.city}` : ""}
                      </span>
                    ) : !userDetails.instituteId ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                        🌐 Global / Central Access
                      </span>
                    ) : null}
                  </div>

                  <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Clock className="h-3.5 w-3.5" /> Last Login Timestamp
                    </span>
                    <strong className="text-foreground block text-sm font-semibold">
                      {userDetails.lastLoginAt ? formatDate(userDetails.lastLoginAt) : "Never Logged In"}
                    </strong>
                  </div>
                </div>

                {/* Linked Profile metadata */}
                {userDetails.teacher && (
                  <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-300 text-xs">
                        Linked Faculty Record: <span className="font-mono">{userDetails.teacher.teacherId}</span>
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(userDetails)}
                        className="text-[11px] h-6 px-2 text-amber-900 dark:text-amber-300 hover:bg-amber-500/10"
                      >
                        <Edit3 className="h-3 w-3 mr-1" /> Edit Subjects
                      </Button>
                    </div>

                    <p className="text-muted-foreground text-xs">
                      Qualification: <strong className="text-foreground">{userDetails.teacher.qualification || "Not specified"}</strong>
                    </p>

                    <div>
                      <span className="font-semibold text-foreground block mb-1 text-xs">Assigned Academic Subjects:</span>
                      {userDetails.teacher.subjects && userDetails.teacher.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {userDetails.teacher.subjects.map((ts: any) => (
                            <Badge
                              key={ts.id || ts.subjectId}
                              variant="secondary"
                              className="text-[11px] flex items-center gap-1 font-medium bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30 py-0.5"
                            >
                              <BookOpen className="h-3 w-3" />
                              <span>{ts.subject?.name}</span>
                              <span className="font-mono opacity-70 text-[10px]">({ts.subject?.code})</span>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No subjects assigned yet. Click "Edit Subjects" to assign.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {userDetails.student && (
                  <div className="p-4 rounded-lg border bg-blue-500/5 space-y-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300">
                      Linked Student Record: {userDetails.student.studentId}
                    </h4>
                    <p className="text-muted-foreground">Admission No: {userDetails.student.admissionNo}</p>
                  </div>
                )}

                {userDetails.notes && (
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-1">
                    <span className="font-semibold block text-foreground">Administrative Notes:</span>
                    <p className="text-muted-foreground leading-relaxed">{userDetails.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-muted-foreground pt-2 border-t text-[11px]">
                  <span>Account Created: {formatDate(userDetails.createdAt)}</span>
                  <span>ID: {userDetails.id}</span>
                </div>
              </TabsContent>

              {/* 2. RBAC & Rights Tab */}
              <TabsContent value="permissions" className="space-y-4 text-xs">
                <div className="p-4 rounded-xl border bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <h4 className="font-bold text-foreground">Assigned Role: {userDetails.role}</h4>
                    </div>
                    {actorRole === "SUPER_ADMIN" && (
                      <Button size="sm" variant="outline" onClick={() => onRoleChange(userDetails)}>
                        Change Role
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Role provides baseline permissions across ERP modules. Super Administrators can configure
                    granular grant/revoke overrides below.
                  </p>
                </div>

                {actorRole === "SUPER_ADMIN" && permissionsData ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                        Granular Permission Overrides
                      </h4>
                      <Button size="sm" onClick={handleSavePermissions} disabled={isSavingPerms}>
                        {isSavingPerms ? "Saving..." : "Save Overrides"}
                      </Button>
                    </div>

                    <div className="border rounded-xl divide-y max-h-96 overflow-y-auto">
                      {permissionsData.map((p: any) => {
                        const overrideState = permOverrides[p.id] || "DEFAULT";
                        const isGranted = overrideState === "GRANTED" || (overrideState === "DEFAULT" && p.isDefaultByRole);

                        return (
                          <div key={p.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/20">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{p.name}</span>
                                <Badge variant="outline" className="text-[9px] font-mono">
                                  {p.code}
                                </Badge>
                                {overrideState !== "DEFAULT" && (
                                  <Badge
                                    variant={overrideState === "GRANTED" ? "success" : "destructive"}
                                    className="text-[9px]"
                                  >
                                    {overrideState === "GRANTED" ? "Custom Grant" : "Custom Revoke"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{p.description}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleTogglePermOverride(p.id, isGranted)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                                  isGranted
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                    : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                                }`}
                              >
                                {isGranted ? "Active (Granted)" : "Denied"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                      Effective Permissions
                    </h4>
                    <div className="border rounded-xl p-3 max-h-64 overflow-y-auto flex flex-wrap gap-1.5">
                      {userDetails.role === "SUPER_ADMIN" ? (
                        <Badge variant="default" className="text-xs">
                          Full Universal Access (All ERP Rights)
                        </Badge>
                      ) : (
                        ROLE_PERMISSIONS[userDetails.role as Role]?.map((code) => (
                          <Badge key={code} variant="outline" className="text-[10px] font-mono">
                            {code}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* 3. Activity Log Tab */}
              <TabsContent value="activity" className="space-y-3 text-xs">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Recent Audit Events
                </h4>

                {userDetails.auditLogs && userDetails.auditLogs.length > 0 ? (
                  <div className="border rounded-xl divide-y">
                    {userDetails.auditLogs.map((log: any) => (
                      <div key={log.id} className="p-3 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-foreground font-mono text-[11px]">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(log.createdAt)}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{log.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8 italic">No audit records found for this user.</p>
                )}
              </TabsContent>

              {/* 4. Security Tab */}
              <TabsContent value="security" className="space-y-4 text-xs">
                <div className="p-4 rounded-xl border space-y-3 bg-muted/20">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    <span>Account Security Controls</span>
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Manage authentication status and role credentials. Actions are recorded in the system audit trail.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" onClick={() => onEdit(userDetails)}>
                      Edit Profile Details
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onRoleChange(userDetails)}>
                      Change Role
                    </Button>
                    <Button
                      size="sm"
                      variant={userDetails.status === "ACTIVE" ? "destructive" : "default"}
                      onClick={() => onStatusChange(userDetails)}
                    >
                      {userDetails.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}
                    </Button>
                    {userDetails.role !== "SUPER_ADMIN" && (
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => onArchive(userDetails)}>
                        Archive Account
                      </Button>
                    )}
                  </div>
                </div>

                {userDetails.role === "SUPER_ADMIN" && (
                  <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 flex items-center gap-2.5">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <span>
                      This is a Super Administrator account. It is protected against deletion and normal administrative modification.
                    </span>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </div>
    </div>
  );
}
