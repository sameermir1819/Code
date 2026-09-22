"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-background text-xs font-semibold hover:bg-muted transition-colors"
    >
      <Printer className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}
