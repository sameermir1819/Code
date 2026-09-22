"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime exception for diagnostics
    console.error("Unhandled ERP runtime exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background font-sans selection:bg-primary/20 selection:text-primary">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Glow & Warning Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-destructive/20 blur-xl animate-pulse"></div>
          <div className="relative w-20 h-20 rounded-2xl bg-card border border-destructive/30 flex items-center justify-center text-destructive shadow-lg">
            <AlertTriangle className="w-10 h-10" />
          </div>
        </div>

        {/* Title & Diagnostic Info */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-xs font-semibold text-destructive border border-destructive/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>RUNTIME EXCEPTION CAUGHT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Something Went Wrong
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred during request processing. Our security safeguards isolated this operation to protect data integrity.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-muted-foreground/80 bg-muted/40 px-2 py-1 rounded border border-border inline-block mt-2">
              Trace Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full border-border hover:bg-accent text-foreground flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Return to Hub
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

