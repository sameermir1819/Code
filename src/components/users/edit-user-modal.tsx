"use client";

import { useState, useEffect, useTransition } from "react";
import { updateUser } from "@/server/actions/users";
import { Role } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit3, AlertCircle, BookOpen, Check } from "lucide-react";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
  user: any;
  actorRole: Role;
  availableSubjects?: any[];
  availableRoles?: any[];
}

export function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  actorRole,
  availableSubjects = [],
  availableRoles = [],
}: EditUserModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const isTargetSuperAdmin = user?.role === "SUPER_ADMIN";
  const canEditSuperAdmin = actorRole === "SUPER_ADMIN";

  const defaultRoles: { value: Role; label: string }[] =
    actorRole === "SUPER_ADMIN"
      ? [
          { value: "SUPER_ADMIN", label: "Super Administrator" },
          { value: "ADMIN", label: "Administrator" },
          { value: "ACCOUNTANT", label: "Accountant / Finance" },
          { value: "TEACHER", label: "Faculty Instructor" },
          { value: "STUDENT", label: "Student" },
          { value: "PARENT", label: "Parent / Guardian" },
        ]
      : [
          { value: "ADMIN", label: "Administrator" },
          { value: "ACCOUNTANT", label: "Accountant / Finance" },
          { value: "TEACHER", label: "Faculty Instructor" },
          { value: "STUDENT", label: "Student" },
          { value: "PARENT", label: "Parent / Guardian" },
        ];

  const roleOptions: { value: string; label: string }[] =
    availableRoles && availableRoles.length > 0
      ? availableRoles
          .filter((r) => actorRole === "SUPER_ADMIN" || r.name !== "SUPER_ADMIN")
          .map((r) => ({
            value: r.name,
            label: r.displayName || r.name,
          }))
      : defaultRoles;

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: (user?.role || "STUDENT") as Role,
    status: (user?.status || "ACTIVE") as "ACTIVE" | "INACTIVE" | "SUSPENDED",
    branch: user?.branch || "Main Campus",
    notes: user?.notes || "",
    newPassword: "",
  });

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [qualification, setQualification] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: (user.role || "STUDENT") as Role,
        status: (user.status || "ACTIVE") as "ACTIVE" | "INACTIVE" | "SUSPENDED",
        branch: user.branch || "Main Campus",
        notes: user.notes || "",
        newPassword: "",
      });

      const currentSubjectIds =
        user.teacher?.subjects?.map((ts: any) => ts.subjectId || ts.subject?.id).filter(Boolean) || [];
      setSelectedSubjectIds(currentSubjectIds);
      setQualification(user.teacher?.qualification || "");
    }
  }, [user]);

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMsg("Email address is required.");
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateUser(user.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          status: formData.status,
          branch: formData.branch,
          notes: formData.notes,
          newPassword: formData.newPassword || undefined,
          subjectIds: formData.role === "TEACHER" ? selectedSubjectIds : undefined,
          qualification: formData.role === "TEACHER" ? qualification : undefined,
        });

        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to update user.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Edit User Profile</h3>
              <p className="text-xs text-muted-foreground">
                Update account details, role assignments, and campus branch.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isTargetSuperAdmin && !canEditSuperAdmin ? (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs">
            <strong>Access Restricted:</strong> Super Administrator accounts cannot be modified by normal Administrators.
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Full Name *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Email Address *</label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Phone Number</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Role Assignment</label>
                  <select
                    value={formData.role}
                    disabled={isTargetSuperAdmin && !canEditSuperAdmin}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" | "SUSPENDED" })
                    }
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive (No Login)</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Branch / Campus</label>
                  <Input
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  />
                </div>

                {/* Faculty Academic Subjects & Specialization (Shown when Role is TEACHER) */}
                {formData.role === "TEACHER" && (
                  <div className="sm:col-span-2 space-y-3 p-3.5 rounded-lg border border-primary/25 bg-primary/5 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-primary/15 pb-1.5">
                      <h5 className="font-semibold text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Faculty Academic Subjects & Specialization
                      </h5>
                      <span className="text-[10px] text-muted-foreground">Select subjects this instructor teaches</span>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1.5 text-foreground">
                        Assigned Subject(s)
                      </label>
                      {availableSubjects.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No subjects configured in the system yet.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {availableSubjects.map((s: any) => {
                            const isSelected = selectedSubjectIds.includes(s.id);
                            return (
                              <button
                                type="button"
                                key={s.id}
                                onClick={() => toggleSubject(s.id)}
                                className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary/15 text-primary font-semibold shadow-xs"
                                    : "border-input bg-background hover:bg-muted text-muted-foreground"
                                }`}
                              >
                                <div className="flex flex-col min-w-0 pr-1">
                                  <span className="text-xs truncate">{s.name}</span>
                                  <span className="text-[10px] opacity-75 font-mono">{s.code}</span>
                                </div>
                                <div
                                  className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                                    isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/40"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-foreground">
                        Academic Qualification
                      </label>
                      <Input
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        placeholder="e.g. M.Sc Physics, B.Ed / Ph.D"
                      />
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">
                    Reset Password (Optional — leave blank to keep existing password)
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password (min 6 chars)..."
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

