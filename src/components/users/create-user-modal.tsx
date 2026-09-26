"use client";

import { useState, useTransition } from "react";
import { createUser } from "@/server/actions/users";
import { Role } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, UserPlus, AlertCircle, Eye, EyeOff, BookOpen, Check } from "lucide-react";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  actorRole: Role;
  availableSubjects?: any[];
  availableRoles?: any[];
  availableCampuses?: any[];
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
  actorRole,
  availableSubjects = [],
  availableRoles = [],
  availableCampuses = [],
}: CreateUserModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [qualification, setQualification] = useState("");

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  // Filter available roles according to logged-in user permission
  const defaultRoles: { value: Role; label: string }[] =
    actorRole === "SUPER_ADMIN"
      ? [
          { value: "SUPER_ADMIN", label: "Super Administrator" },
          { value: "ADMIN", label: "Administrator" },
          { value: "ACCOUNTANT", label: "Accountant / Finance" },
          { value: "TEACHER", label: "Faculty Instructor" },
          { value: "PARENT", label: "Parent / Guardian" },
        ]
      : [
          { value: "ADMIN", label: "Administrator" },
          { value: "ACCOUNTANT", label: "Accountant / Finance" },
          { value: "TEACHER", label: "Faculty Instructor" },
          { value: "PARENT", label: "Parent / Guardian" },
        ];

  const roleOptions: { value: string; label: string }[] =
    availableRoles && availableRoles.length > 0
      ? availableRoles
          .filter((r) => r.name !== "STUDENT" && (actorRole === "SUPER_ADMIN" || r.name !== "SUPER_ADMIN"))
          .map((r) => ({
            value: r.name,
            label: r.displayName || r.name,
          }))
      : defaultRoles;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: (actorRole === "SUPER_ADMIN" ? "ADMIN" : "TEACHER") as Role,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "SUSPENDED",
    instituteId: "GLOBAL",
    branch: "All Campuses (Central)",
    notes: "",
    password: "",
    confirmPassword: "",
    avatarUrl: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg("First name and last name are required.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMsg("Email address is required.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          status: formData.status,
          instituteId: formData.instituteId || undefined,
          branch: formData.branch,
          notes: formData.notes,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          avatarUrl: formData.avatarUrl,
          subjectIds: formData.role === "TEACHER" ? selectedSubjectIds : undefined,
          qualification: formData.role === "TEACHER" ? qualification : undefined,
        });

        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to create user.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Create New User Account</h3>
              <p className="text-xs text-muted-foreground">
                Provision new ERP account credentials and access roles. Create student accounts through Admissions or Students.
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

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Personal Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] border-b pb-1">
              1. Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">First Name *</label>
                <Input
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. John"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Last Name *</label>
                <Input
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Doe"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Email Address *</label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@futurexlearning.com"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Phone Number</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Account & Role Configuration */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] border-b pb-1">
              2. Role & Access Level
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold block mb-1">Assign Role *</label>
                <select
                  value={formData.role}
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
                  <option value="ACTIVE">Active (Can Sign In)</option>
                  <option value="INACTIVE">Inactive (Access Blocked)</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Allotted Campus *</label>
                <select
                  value={formData.instituteId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const selectedCamp = availableCampuses.find((c: any) => c.id === selId);
                    setFormData({
                      ...formData,
                      instituteId: selId,
                      branch: selectedCamp ? selectedCamp.name : (selId === "GLOBAL" ? "All Campuses (Central)" : "Main Campus"),
                    });
                  }}
                  className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-foreground text-xs font-medium"
                >
                  <option value="GLOBAL">🌐 All Campuses / Central Access</option>
                  {availableCampuses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      🏢 {c.name} ({c.code}){c.city ? ` — ${c.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Faculty Academic Subjects & Specialization (Shown when Role is TEACHER) */}
            {formData.role === "TEACHER" && (
              <div className="space-y-3 p-3.5 rounded-lg border border-primary/25 bg-primary/5 animate-in fade-in">
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
                              <span className="text-[10px] opacity-75 font-mono">
                                {s.code}{!s.instituteId ? " — Global" : ""}
                              </span>
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
                    Academic Qualification (Optional)
                  </label>
                  <Input
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. M.Sc Physics, B.Ed / Ph.D"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Password Credentials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                3. Security Credentials
              </h4>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span>{showPassword ? "Hide" : "Show"} Passwords</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Password * (Min 6 chars)</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Confirm Password *</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold block mb-1">Administrative Notes (Optional)</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Admitted via scholarship test or faculty onboarding batch 2026"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating Account..." : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
