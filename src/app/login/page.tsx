"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/server/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Lock, Mail, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@futurexlearning.com");
  const [password, setPassword] = useState("Admin@123");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    startTransition(async () => {
      const res = await loginUser({ email, password });
      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Authentication failed");
      }
    });
  };

  const setPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("Admin@123");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="h-14 w-14 rounded-2xl bg-primary text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            FL
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">FUTUREX LEARNING ERP</h1>
          <p className="text-xs text-muted-foreground">Premier Institute Management &amp; Academic Portal</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter credentials or select a 1-click active system account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="user@futurexlearning.com"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isPending} className="w-full h-9 text-xs font-semibold">
                {isPending ? "Authenticating..." : "Sign In to Futurex ERP"}
              </Button>
            </form>

            {/* Quick 1-Click Role Presets */}
            <div className="pt-4 border-t space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                1-Click Active Accounts (Password: Admin@123):
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreset("superadmin@futurexlearning.com")}
                  className="p-1.5 rounded border text-left hover:bg-muted font-medium transition-colors"
                >
                  👑 Super Admin (Sameer Mir)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset("admin@futurexlearning.com")}
                  className="p-1.5 rounded border text-left hover:bg-muted font-medium transition-colors"
                >
                  🛡️ Admin Officer
                </button>
                <button
                  type="button"
                  onClick={() => setPreset("accountant@futurexlearning.com")}
                  className="p-1.5 rounded border text-left hover:bg-muted font-medium transition-colors"
                >
                  💼 Accountant Desk
                </button>
                <button
                  type="button"
                  onClick={() => setPreset("user1@futurex.com")}
                  className="p-1.5 rounded border text-left hover:bg-muted font-medium transition-colors"
                >
                  🎓 Faculty (Teacher 1)
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

