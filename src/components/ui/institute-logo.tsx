"use client";

import React, { useState } from "react";

interface InstituteLogoProps {
  logoUrl?: string | null;
  name?: string;
  /** Size in pixels (width = height). Default: 36 */
  size?: number;
  /** Extra className on the wrapper div */
  className?: string;
}

/**
 * Shows the institute logo image.
 * Defaults to the institute logo (/logo.png).
 * Falls back gracefully to the initials box if no image is available.
 */
export function InstituteLogo({
  logoUrl,
  name = "Futurex Learning",
  size = 36,
  className = "",
}: InstituteLogoProps) {
  const [hasError, setHasError] = useState(false);
  const src = logoUrl?.trim() ? logoUrl.trim() : "/logo.png";

  const initials = name
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "FL";

  if (hasError) {
    return (
      <div
        style={{ width: size, height: size, fontSize: Math.max(11, size * 0.35) }}
        className={`rounded-xl bg-primary flex items-center justify-center font-black text-white shadow-sm shrink-0 select-none ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-white border border-border/40 shadow-xs select-none ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- supports dynamic uploaded URLs and an onError fallback */}
      <img
        src={src}
        alt={`${name} logo`}
        className="w-full h-full object-contain p-1"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
