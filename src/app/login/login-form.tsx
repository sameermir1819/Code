"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/server/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstituteLogo } from "@/components/ui/institute-logo";
import { Lock, Mail } from "lucide-react";

interface LoginFormProps {
  logoUrl: string | null;
  instituteName: string;
  tagline: string;
}

export function LoginForm({ logoUrl, instituteName, tagline }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <InstituteLogo logoUrl={logoUrl} name={instituteName} size={56} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {instituteName.toUpperCase()}
          </h1>
          <p className="text-xs text-muted-foreground">{tagline}</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter your registered credentials to access your account
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
                    placeholder="name@example.com"
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
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isPending} className="w-full h-9 text-xs font-semibold">
                {isPending ? "Authenticating..." : `Sign In to ${instituteName}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
