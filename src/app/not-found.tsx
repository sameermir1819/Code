import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileQuestion,
  LayoutDashboard,
  Users,
  ArrowLeft,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background font-sans selection:bg-primary/20 selection:text-primary">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Glow & Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl animate-pulse"></div>
          <div className="relative w-20 h-20 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-primary shadow-lg">
            <FileQuestion className="w-10 h-10" />
          </div>
        </div>

        {/* 404 Title & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-xs font-semibold text-muted-foreground border border-border">
            <span>HTTP ERROR 404</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Resource Not Found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The student record, academic batch, or endpoint you are looking for does not exist or may have been archived.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Executive Hub
            </Button>
          </Link>
          <Link href="/students" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full border-border hover:bg-accent text-foreground flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Student Directory
            </Button>
          </Link>
        </div>

        {/* Bottom Security / Status Footer */}
        <div className="pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Futurex Learning ERP</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>System Operational</span>
          </span>
        </div>
      </div>
    </div>
  );
}

