"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

interface StudentQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export function StudentQrCode({
  value,
  size = 56,
  className = "",
  darkColor = "#0f2b5c",
  lightColor = "#ffffff",
}: StudentQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: Math.max(size * 3, 180), // High DPI for crisp printing and scanning
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error("Student QR generation error:", err));
  }, [value, size, darkColor, lightColor]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 ${className}`}
      >
        <span className="text-[7px] font-mono text-zinc-400 animate-pulse">QR...</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- generated QR codes are data URLs
    <img
      src={dataUrl}
      alt={`QR Code for ${value}`}
      style={{ width: size, height: size }}
      className={`object-contain block shrink-0 ${className}`}
    />
  );
}

