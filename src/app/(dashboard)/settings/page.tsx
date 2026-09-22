"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getUserProfile,
  updateUserProfile,
  getInstituteProfile,
  updateInstituteProfile,
} from "@/server/actions/auth";
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
    logoUrl: "",
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    async function loadProfiles() {
      const [u, inst] = await Promise.all([getUserProfile(), getInstituteProfile()]);
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
      if (inst) {
        setInstForm({
          name: inst.name || "Futurex Learning",
          tagline: inst.tagline || "",
          code: inst.code || "FL-CAMPUS-01",
          phone: inst.phone || "",
          email: inst.email || "",
          website: inst.website || "",
          address: inst.address || "",
          city: inst.city || "New Delhi",
          state: inst.state || "Delhi",
          currency: inst.currency || "INR",
          currencySymbol: inst.currencySymbol || "₹",
          logoUrl: inst.logoUrl || "",
        });
      }
    }
    loadProfiles();
  }, []);

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

      <Tabs defaultValue="my-profile">
        <TabsList className="w-full justify-start border-b">
          <TabsTrigger value="my-profile" className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            <span>My Profile</span>
          </TabsTrigger>
          <TabsTrigger value="institute-profile" className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>Academy Profile (Futurex Learning)</span>
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

        {/* 2. INSTITUTE PROFILE TAB */}
        <TabsContent value="institute-profile" className="space-y-6">
          <form onSubmit={handleInstituteSave} className="space-y-6">
            {/* Live Branding Preview Card */}
            <Card className="bg-gradient-to-r from-primary/10 via-card to-card border-2 border-primary/30">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary text-white font-black text-xl flex items-center justify-center shadow-md">
                    FL
                  </div>
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
    </div>
  );
}

