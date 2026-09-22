"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getUserProfile,
  updateUserProfile,
  getInstituteProfile,
  updateInstituteProfile,
} from "@/server/actions/auth";
import {
  getAllCampuses,
  getActiveCampus,
  switchActiveCampus,
  createNewCampus,
  deleteCampus,
  CampusItem,
} from "@/server/actions/campus";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Building2,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Camera,
  Shield,
  Globe,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Plus,
  Check,
  RefreshCw,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";

export default function SettingsAndProfilePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // User Profile State
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",
    role: "SUPER_ADMIN",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Institute Profile State (Futurex Learning)
  const [instForm, setInstForm] = useState({
    name: "Futurex Learning",
    tagline: "Excellence in Academic Coaching & Competitive Entry Test Prep",
    code: "FL-CAMPUS-01",
    phone: "+91 98765 43210",
    email: "admissions@futurexlearning.com",
    website: "https://futurexlearning.com",
    address: "Plot 42, Knowledge Park, Central Avenue",
    city: "New Delhi",
    state: "Delhi",
    currency: "INR",
    currencySymbol: "₹",
    logoUrl: "/logo.png",
  });

  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [activeCampus, setActiveCampus] = useState<CampusItem | null>(null);
  const [showAddCampus, setShowAddCampus] = useState(false);
  const [deletingCampus, setDeletingCampus] = useState<CampusItem | null>(null);
  const [newCampusForm, setNewCampusForm] = useState({
    name: "",
    code: "",
    city: "Srinagar",
    address: "",
    phone: "",
    email: "",
    tagline: "Academic Coaching & Test Prep Campus",
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    async function loadProfiles() {
      const [u, inst, allC, activeC] = await Promise.all([
        getUserProfile(),
        getInstituteProfile(),
        getAllCampuses(),
        getActiveCampus(),
      ]);

      if (u) {
        setUserForm((prev) => ({
          ...prev,
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          avatarUrl: u.avatarUrl || "",
          role: u.role || "SUPER_ADMIN",
        }));
      }

      if (allC) {
        setCampuses(allC);
      }

      if (activeC) {
        setActiveCampus(activeC);
      }

      const activeInst = activeC || inst;
      if (activeInst) {
        setInstForm({
          name: activeInst.name || "Futurex Learning",
          tagline: activeInst.tagline || "",
          code: activeInst.code || "FL-CAMPUS-01",
          phone: activeInst.phone || "",
          email: activeInst.email || "",
          website: (activeInst as any).website || "",
          address: activeInst.address || "",
          city: activeInst.city || "New Delhi",
          state: (activeInst as any).state || "Delhi",
          currency: (activeInst as any).currency || "INR",
          currencySymbol: (activeInst as any).currencySymbol || "₹",
          logoUrl: activeInst.logoUrl || "/logo.png",
        });
      }
    }
    loadProfiles();
  }, []);

  const handleSwitchCampus = (campusId: string) => {
    startTransition(async () => {
      const res = await switchActiveCampus(campusId);
      if (res.success) {
        setFeedback({ type: "success", message: "Active campus switched successfully!" });
        const [updatedActive, allC] = await Promise.all([getActiveCampus(), getAllCampuses()]);
        setActiveCampus(updatedActive);
        setCampuses(allC);
        if (updatedActive) {
          setInstForm((prev) => ({
            ...prev,
            name: updatedActive.name,
            tagline: updatedActive.tagline || "",
            code: updatedActive.code,
            phone: updatedActive.phone || "",
            email: updatedActive.email || "",
            website: (updatedActive as any).website || "",
            address: updatedActive.address || "",
            city: updatedActive.city || "",
            state: (updatedActive as any).state || "",
            currency: (updatedActive as any).currency || "INR",
            currencySymbol: (updatedActive as any).currencySymbol || "₹",
            logoUrl: updatedActive.logoUrl || "/logo.png",
          }));
        }
        router.refresh();
      }
    });
  };

  const handleCreateCampus = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!newCampusForm.name.trim() || !newCampusForm.code.trim()) {
      return setFeedback({ type: "error", message: "Campus Name and Campus Code are required" });
    }

    startTransition(async () => {
      const res = await createNewCampus(newCampusForm);
      if (res.success && res.campus) {
        setFeedback({
          type: "success",
          message: `New campus "${res.campus.name}" registered successfully! You can select it anytime.`,
        });
        setShowAddCampus(false);
        setNewCampusForm({
          name: "",
          code: "",
          city: "Srinagar",
          address: "",
          phone: "",
          email: "",
          tagline: "Academic Coaching & Test Prep Campus",
        });
        const updatedList = await getAllCampuses();
        setCampuses(updatedList);
        window.dispatchEvent(new CustomEvent("erp-campus-changed"));
        window.dispatchEvent(new CustomEvent("erp-data-refresh"));
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to create campus." });
      }
    });
  };

  const handleDeleteCampusConfirm = () => {
    if (!deletingCampus) return;
    startTransition(async () => {
      try {
        const res = await deleteCampus(deletingCampus.id);
        if (res.success) {
          setFeedback({ type: "success", message: res.message || "Campus deleted successfully!" });
          const [allC, activeC] = await Promise.all([getAllCampuses(), getActiveCampus()]);
          setCampuses(allC);
          setActiveCampus(activeC);
          setDeletingCampus(null);
          window.dispatchEvent(new CustomEvent("erp-campus-changed"));
          window.dispatchEvent(new CustomEvent("erp-data-refresh"));
          router.refresh();
        } else {
          setFeedback({ type: "error", message: res.error || "Failed to delete campus." });
          setDeletingCampus(null);
        }
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Error deleting campus." });
        setDeletingCampus(null);
      }
    });
  };

  const handleUserSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!userForm.name.trim()) {
      return setFeedback({ type: "error", message: "Name is required" });
    }
    if (!userForm.email.trim()) {
      return setFeedback({ type: "error", message: "Email is required" });
    }
    if (userForm.newPassword) {
      if (userForm.newPassword !== userForm.confirmPassword) {
        return setFeedback({ type: "error", message: "New passwords do not match" });
      }
      if (!userForm.currentPassword) {
        return setFeedback({
          type: "error",
          message: "Current password is required to change password",
        });
      }
    }

    startTransition(async () => {
      try {
        const res = await updateUserProfile({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          avatarUrl: userForm.avatarUrl,
          currentPassword: userForm.currentPassword || undefined,
          newPassword: userForm.newPassword || undefined,
        });

        if (res.success) {
          setFeedback({
            type: "success",
            message: "Your profile details have been saved successfully!",
          });
          setUserForm((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
          router.refresh();
        }
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to update user profile" });
      }
    });
  };

  const handleInstituteSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!instForm.name.trim()) {
      return setFeedback({ type: "error", message: "Academy name is required" });
    }

    startTransition(async () => {
      try {
        const res = await updateInstituteProfile(instForm);
        if (res.success) {
          setFeedback({
            type: "success",
            message: "Institute configuration & Academy profile saved successfully!",
          });
          router.refresh();
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "Failed to update institute profile",
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile & Academy Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customize your personal administrator profile, security credentials, and Futurex Learning academy branding.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "error"
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <Tabs defaultValue="institute-profile">
        <TabsList className="w-full justify-start border-b">
          <TabsTrigger value="institute-profile" className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>Campuses &amp; Branches ({campuses.length})</span>
          </TabsTrigger>
          <TabsTrigger value="my-profile" className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            <span>My Profile</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. USER PROFILE TAB */}
        <TabsContent value="my-profile" className="space-y-6">
          <form onSubmit={handleUserSave} className="space-y-6">
            {/* Personal Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
                    <CardDescription className="text-xs">
                      Update your account name, contact details, and avatar
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Role: {userForm.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Avatar Preview */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border">
                  <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary text-primary font-black text-2xl flex items-center justify-center">
                    {userForm.name ? userForm.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-sm text-foreground">{userForm.name || "User"}</p>
                    <p className="text-muted-foreground">{userForm.email}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Active Session: {userForm.role.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Full Legal Name *</label>
                    <Input
                      required
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      placeholder="e.g. Dr. S. K. Mehta"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Email Address *</label>
                    <Input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="user@futurexlearning.com"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Contact Phone</label>
                    <Input
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      placeholder="+91 98..."
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Profile Photo / Avatar URL</label>
                    <Input
                      value={userForm.avatarUrl}
                      onChange={(e) => setUserForm({ ...userForm, avatarUrl: e.target.value })}
                      placeholder="https://... (Optional)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Security & Change Password</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Leave blank if you do not wish to change your password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Current Password</label>
                    <Input
                      type="password"
                      value={userForm.currentPassword}
                      onChange={(e) => setUserForm({ ...userForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">New Password</label>
                    <Input
                      type="password"
                      value={userForm.newPassword}
                      onChange={(e) => setUserForm({ ...userForm, newPassword: e.target.value })}
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Confirm New Password</label>
                    <Input
                      type="password"
                      value={userForm.confirmPassword}
                      onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="text-xs flex items-center gap-2 px-6">
                <Save className="h-4 w-4" />
                <span>{isPending ? "Saving Profile..." : "Save Profile Changes"}</span>
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* 2. CAMPUSES & ACADEMY PROFILE TAB */}
        <TabsContent value="institute-profile" className="space-y-6">
          {/* Campuses & Branches Directory Card */}
          <Card className="rounded-2xl border bg-card/60 shadow-2xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Campuses &amp; Branches Directory</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Manage multiple coaching branches, centers, and choose which campus is active across the ERP.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowAddCampus(!showAddCampus)}
                className="text-xs flex items-center gap-1.5 rounded-xl font-bold shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{showAddCampus ? "Close Form" : "+ Add Campus"}</span>
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Add New Campus Form (Collapsible) */}
              {showAddCampus && (
                <form
                  onSubmit={handleCreateCampus}
                  className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                    <span className="text-xs font-bold text-foreground">Register New Campus / Branch</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Multi-Campus System
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold block mb-1">Campus Name *</label>
                      <Input
                        required
                        value={newCampusForm.name}
                        onChange={(e) =>
                          setNewCampusForm({ ...newCampusForm, name: e.target.value })
                        }
                        placeholder="e.g. Futurex Learning - Rajbagh Branch"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Campus Code * (Unique)</label>
                      <Input
                        required
                        value={newCampusForm.code}
                        onChange={(e) =>
                          setNewCampusForm({ ...newCampusForm, code: e.target.value })
                        }
                        placeholder="e.g. FL-RAJ-02"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">City / Region</label>
                      <Input
                        value={newCampusForm.city}
                        onChange={(e) =>
                          setNewCampusForm({ ...newCampusForm, city: e.target.value })
                        }
                        placeholder="e.g. Srinagar"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Contact Phone</label>
                      <Input
                        value={newCampusForm.phone}
                        onChange={(e) =>
                          setNewCampusForm({ ...newCampusForm, phone: e.target.value })
                        }
                        placeholder="+91 98..."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-semibold block mb-1">Physical Address</label>
                      <Input
                        value={newCampusForm.address}
                        onChange={(e) =>
                          setNewCampusForm({ ...newCampusForm, address: e.target.value })
                        }
                        placeholder="e.g. Near Zero Bridge, Rajbagh Commercial Complex"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Admissions Email</label>
                      <Input
                        type="email"
                        value={newCampusForm.email}
                        onChange={(e) =>
                          setNewCampusForm({ ...newCampusForm, email: e.target.value })
                        }
                        placeholder="branch@futurexlearning.com"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Tagline</label>
                      <Input
                        value={newCampusForm.tagline}
                        onChange={(e) =>
                          setNewCampusForm({ ...newCampusForm, tagline: e.target.value })
                        }
                        placeholder="Academic Coaching Center"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddCampus(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      size="sm"
                      className="text-xs flex items-center gap-1.5 font-bold"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{isPending ? "Registering..." : "Save Campus"}</span>
                    </Button>
                  </div>
                </form>
              )}

              {/* Campuses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {campuses.map((c) => {
                  const isCurrent = activeCampus?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? "bg-primary/5 border-primary/40 shadow-xs"
                          : "bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isCurrent
                                ? "bg-primary text-white shadow-xs"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm leading-tight">
                              {c.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="font-mono text-[9px] font-bold">
                                {c.code}
                              </Badge>
                              {c.city && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {c.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCurrent ? (
                            <Badge variant="default" className="text-[9px] tracking-wide shrink-0">
                              Active Campus
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleSwitchCampus(c.id)}
                              disabled={isPending}
                              className="text-[11px] h-7 px-2.5 shrink-0 font-medium"
                            >
                              Switch to this
                            </Button>
                          )}

                          {campuses.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingCampus(c)}
                              disabled={isPending}
                              title={`Delete ${c.name}`}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 h-7 w-7 p-0 shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground border-t pt-2 flex items-center justify-between gap-2">
                        <div className="space-y-0.5 truncate">
                          <p className="truncate">{c.address || "Address not specified"}</p>
                          <p className="font-mono text-[10px]">{c.phone || c.email || ""}</p>
                        </div>
                        {c._count && (
                          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border">
                            <span>{c._count.students} Students</span>
                            <span>•</span>
                            <span>{c._count.batches} Batches</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleInstituteSave} className="space-y-6">
            {/* Live Branding Preview Card */}
            <Card className="bg-gradient-to-r from-primary/10 via-card to-card border-2 border-primary/30">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {instForm.logoUrl ? (
                    <img
                      src={instForm.logoUrl}
                      alt={instForm.name}
                      className="h-16 w-16 rounded-xl object-cover border-2 border-primary shadow-md bg-white"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-primary text-white font-black text-xl flex items-center justify-center shadow-md">
                      {instForm.name ? instForm.name.slice(0, 2).toUpperCase() : "FL"}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black tracking-tight text-foreground">
                        {instForm.name || "Futurex Learning"}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {instForm.code}
                      </Badge>
                    </div>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      {instForm.tagline || "Institute Management ERP"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {instForm.address}, {instForm.city} • Currency: {instForm.currencySymbol} ({instForm.currency})
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 block">
                    ✓ Live Institute Branding
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Institute Logo / Profile Photo Upload Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <span>Institute Logo & Profile Image</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload an image file or paste a web URL link for your official institute logo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-muted/20 border">
                  {instForm.logoUrl ? (
                    <img
                      src={instForm.logoUrl}
                      alt="Institute Logo Preview"
                      className="h-20 w-20 rounded-xl object-cover border-2 border-primary/50 shadow"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-muted border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground">
                      <Building2 className="h-8 w-8 mb-1 opacity-50" />
                      <span className="text-[10px]">No Logo</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <label className="font-semibold block mb-1">Logo Image Web URL Link</label>
                      <Input
                        value={instForm.logoUrl}
                        onChange={(e) => setInstForm({ ...instForm, logoUrl: e.target.value })}
                        placeholder="https://example.com/institute-logo.png"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold border">
                        <Camera className="h-3.5 w-3.5" />
                        <span>Upload Logo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append("file", file);
                            try {
                              const res = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              });
                              const data = await res.json();
                              if (data.success && data.fileUrl) {
                                setInstForm((prev) => ({ ...prev, logoUrl: data.fileUrl }));
                                await updateInstituteProfile({
                                  ...instForm,
                                  logoUrl: data.fileUrl,
                                });
                                setFeedback({
                                  type: "success",
                                  message: "Logo uploaded and saved successfully across all pages!",
                                });
                                router.refresh();
                              } else {
                                setFeedback({
                                  type: "error",
                                  message: data.message || "Failed to upload logo image.",
                                });
                              }
                            } catch (err: any) {
                              setFeedback({ type: "error", message: err.message || "Upload failed" });
                            }
                          }}
                        />
                      </label>
                      {instForm.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => setInstForm({ ...instForm, logoUrl: "" })}
                        >
                          Remove Logo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Institute Particulars */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Institute Branding Particulars</CardTitle>
                <CardDescription className="text-xs">
                  These details appear on student ID cards, progress report cards, and fee receipts.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Academy / Institute Name *</label>
                  <Input
                    required
                    value={instForm.name}
                    onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                    placeholder="Futurex Learning"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Tagline / Motto</label>
                  <Input
                    value={instForm.tagline}
                    onChange={(e) => setInstForm({ ...instForm, tagline: e.target.value })}
                    placeholder="Excellence in Academic Coaching & Competitive Entry Test Prep"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Campus / Center Code</label>
                  <Input
                    value={instForm.code}
                    onChange={(e) => setInstForm({ ...instForm, code: e.target.value })}
                    placeholder="FL-CAMPUS-01"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Contact Phone</label>
                  <Input
                    value={instForm.phone}
                    onChange={(e) => setInstForm({ ...instForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Official Admissions Email</label>
                  <Input
                    type="email"
                    value={instForm.email}
                    onChange={(e) => setInstForm({ ...instForm, email: e.target.value })}
                    placeholder="admissions@futurexlearning.com"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Website URL</label>
                  <Input
                    value={instForm.website}
                    onChange={(e) => setInstForm({ ...instForm, website: e.target.value })}
                    placeholder="https://futurexlearning.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Campus Physical Address</label>
                  <Input
                    value={instForm.address}
                    onChange={(e) => setInstForm({ ...instForm, address: e.target.value })}
                    placeholder="Main Academic Boulevard, Campus Block 4"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">City</label>
                  <Input
                    value={instForm.city}
                    onChange={(e) => setInstForm({ ...instForm, city: e.target.value })}
                    placeholder="New Delhi"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">State / Region</label>
                  <Input
                    value={instForm.state}
                    onChange={(e) => setInstForm({ ...instForm, state: e.target.value })}
                    placeholder="Delhi"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Currency Code</label>
                  <Input
                    value={instForm.currency}
                    onChange={(e) => setInstForm({ ...instForm, currency: e.target.value })}
                    placeholder="INR"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Currency Symbol</label>
                  <Input
                    value={instForm.currencySymbol}
                    onChange={(e) => setInstForm({ ...instForm, currencySymbol: e.target.value })}
                    placeholder="₹"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="text-xs flex items-center gap-2 px-6">
                <Save className="h-4 w-4" />
                <span>{isPending ? "Updating Academy Profile..." : "Save Academy Profile"}</span>
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* Delete Campus Confirmation Modal */}
      {deletingCampus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-destructive/30 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5 text-destructive">
                <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Delete Campus</h3>
                  <p className="text-xs text-muted-foreground font-mono">{deletingCampus.code}</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingCampus(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-foreground">
              <p>
                Are you sure you want to permanently delete <strong>{deletingCampus.name}</strong>?
              </p>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1.5 text-[11px]">
                <p className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Important Notice:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
                  <li>Classrooms, batches, and records registered under this campus will be removed.</li>
                  <li>Assigned staff and teachers will be reverted to Central HQ access.</li>
                  <li>If this campus is currently active, your session will automatically switch to the main campus.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingCampus(null)}
                disabled={isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteCampusConfirm}
                disabled={isPending}
                className="text-xs flex items-center gap-1.5 font-bold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isPending ? "Deleting..." : "Confirm & Delete"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

