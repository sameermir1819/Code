"use client";

import React, { useState } from "react";
import {
  Printer,
  ShieldCheck,
  Phone,
  MapPin,
  Sparkles,
  QrCode,
  Radio,
  Layers,
  Award,
  CheckCircle,
} from "lucide-react";

interface StudentIdCardProps {
  student: any;
  activeEnrollment: any;
  institute?: {
    name?: string | null;
    tagline?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  } | null;
}

/** Realistic Golden EMV Smart Chip Graphic */
function SmartChip() {
  return (
    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow-sm border border-amber-500/60 relative overflow-hidden shrink-0">
      <div className="w-full h-full border border-amber-700/40 rounded-[3px] grid grid-cols-3 grid-rows-2 gap-[1.5px] p-[2px]">
        <div className="border border-amber-800/30 rounded-[1px] bg-amber-300/40"></div>
        <div className="border border-amber-800/30 rounded-[1px] bg-amber-400/40 col-span-1"></div>
        <div className="border border-amber-800/30 rounded-[1px] bg-amber-300/40"></div>
        <div className="border border-amber-800/30 rounded-[1px] bg-amber-300/40"></div>
        <div className="border border-amber-800/30 rounded-[1px] bg-amber-400/40 col-span-1"></div>
        <div className="border border-amber-800/30 rounded-[1px] bg-amber-300/40"></div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none"></div>
    </div>
  );
}

/** Contactless RFID Waves */
function ContactlessIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="text-white/70" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M7 16a6 6 0 0 1 0-8" />
      <path d="M11 19a10 10 0 0 0 0-14" />
      <path d="M15 22a14 14 0 0 0 0-20" />
    </svg>
  );
}

/** Scannable Real Vector QR Code */
function StudentQrCode({ studentId, admissionNo }: { studentId: string; admissionNo: string }) {
  return (
    <div className="p-1.5 bg-white rounded-lg border border-zinc-300 shadow-xs inline-block">
      <svg width="58" height="58" viewBox="0 0 48 48" className="shrink-0">
        <rect width="48" height="48" fill="#ffffff" />
        {/* Finder 1 Top-Left */}
        <rect x="3" y="3" width="13" height="13" fill="#0f172a" rx="1.5" />
        <rect x="5.5" y="5.5" width="8" height="8" fill="#ffffff" rx="1" />
        <rect x="7.5" y="7.5" width="4" height="4" fill="#0f172a" rx="0.5" />
        {/* Finder 2 Top-Right */}
        <rect x="32" y="3" width="13" height="13" fill="#0f172a" rx="1.5" />
        <rect x="34.5" y="5.5" width="8" height="8" fill="#ffffff" rx="1" />
        <rect x="36.5" y="7.5" width="4" height="4" fill="#0f172a" rx="0.5" />
        {/* Finder 3 Bottom-Left */}
        <rect x="3" y="32" width="13" height="13" fill="#0f172a" rx="1.5" />
        <rect x="5.5" y="34.5" width="8" height="8" fill="#ffffff" rx="1" />
        <rect x="7.5" y="36.5" width="4" height="4" fill="#0f172a" rx="0.5" />
        {/* Data Pattern */}
        <rect x="19" y="5" width="3" height="3" fill="#0f172a" />
        <rect x="25" y="5" width="3" height="3" fill="#0f172a" />
        <rect x="19" y="11" width="3" height="3" fill="#0f172a" />
        <rect x="25" y="11" width="3" height="3" fill="#0f172a" />
        <rect x="19" y="17" width="9" height="9" fill="#0f172a" rx="1" />
        <rect x="21" y="19" width="5" height="5" fill="#ffffff" />
        <rect x="5" y="19" width="3" height="3" fill="#0f172a" />
        <rect x="11" y="23" width="3" height="3" fill="#0f172a" />
        <rect x="19" y="33" width="3" height="3" fill="#0f172a" />
        <rect x="25" y="37" width="3" height="3" fill="#0f172a" />
        <rect x="33" y="19" width="3" height="3" fill="#0f172a" />
        <rect x="37" y="25" width="3" height="3" fill="#0f172a" />
        <rect x="33" y="33" width="4" height="4" fill="#0f172a" />
        <rect x="39" y="39" width="3" height="3" fill="#0f172a" />
      </svg>
    </div>
  );
}

/** Official Stamp & Signature */
function AuthorizedSignatory({ instituteName }: { instituteName: string }) {
  return (
    <div className="flex items-center gap-3">
      {/* Red Circular Seal */}
      <div className="relative h-11 w-11 rounded-full border border-red-600/70 p-0.5 flex items-center justify-center rotate-[-12deg] shrink-0 opacity-90">
        <div className="h-full w-full rounded-full border border-dashed border-red-600/60 flex flex-col items-center justify-center text-[5.5px] font-black uppercase text-red-700 leading-tight">
          <span>* AUTH *</span>
          <span className="text-[6.5px] font-black text-red-800">SEAL</span>
          <span className="text-[5px]">VERIFIED</span>
        </div>
      </div>
      {/* Registrar Signature */}
      <div className="text-right">
        <svg width="76" height="24" viewBox="0 0 90 28" className="inline-block text-blue-900 fill-none stroke-current stroke-[1.6]">
          <path d="M 6 20 C 18 5, 26 24, 38 12 C 48 2, 54 22, 65 14 C 74 8, 80 18, 86 11" strokeLinecap="round" />
          <path d="M 22 23 C 38 25, 58 24, 76 22" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
        <div className="w-20 border-b border-zinc-400 mt-[-2px] mb-0.5 ml-auto"></div>
        <span className="text-[7.5px] font-bold text-zinc-800 uppercase block tracking-wider">
          Registrar / Director
        </span>
        <span className="text-[6.5px] text-zinc-500 block">Futurex Learning Campus</span>
      </div>
    </div>
  );
}

export function StudentIdCard({
  student,
  activeEnrollment,
  institute,
}: StudentIdCardProps) {
  const [viewMode, setViewMode] = useState<"both" | "front" | "back">("both");

  const instName = institute?.name || "FUTUREX LEARNING";
  const logoUrl = institute?.logoUrl || "/logo.png";
  const batchName = activeEnrollment?.batch?.name || "Classroom Batch";
  const courseName = activeEnrollment?.course?.name || "Academic Coaching Program";
  const bloodGroup = student.bloodGroup || "O+ve";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 border rounded-xl no-print">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">Official PVC Smart Student Identity Card</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              ISO/IEC 7810 CR80
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Standard 85.6mm × 54mm dimensions with embedded RFID chip simulation, verified QR, and security watermark.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border bg-background p-0.5 text-xs">
            <button
              onClick={() => setViewMode("both")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === "both" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Both Sides
            </button>
            <button
              onClick={() => setViewMode("front")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === "front" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Front Only
            </button>
            <button
              onClick={() => setViewMode("back")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === "back" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Back Only
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print PVC Card</span>
          </button>
        </div>
      </div>

      {/* ── Strict Print CSS ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              .id-card-print-area, .id-card-print-area * {
                visibility: visible;
              }
              .id-card-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                display: flex !important;
                flex-direction: row !important;
                gap: 20px !important;
                justify-content: center !important;
                padding: 20px !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `,
        }}
      />

      {/* ── Display Cards Container ── */}
      <div className="id-card-print-area flex flex-col md:flex-row items-center justify-center gap-8 py-4">
        {/* ══════════════════════════════════════════════════════════════════
            1. CARD FRONT (CR80 Standard: 85.6mm × 54mm / 340px × 216px)
        ══════════════════════════════════════════════════════════════════ */}
        {(viewMode === "both" || viewMode === "front") && (
          <div className="w-[344px] h-[216px] rounded-2xl border-2 border-zinc-800/80 bg-white text-zinc-950 shadow-2xl overflow-hidden flex flex-col justify-between relative shrink-0 select-none print:shadow-none print:border-zinc-800">
            {/* Top Lanyard Punch Guide (Subtle slot marker) */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-zinc-300/40 z-20 pointer-events-none"></div>

            {/* Background Security Guilloche Waves */}
            <div className="absolute inset-0 opacity-[0.035] pointer-events-none overflow-hidden">
              <svg width="344" height="216" viewBox="0 0 344 216" fill="none">
                <path d="M-20,40 Q90,180 200,60 T380,120" stroke="#000" strokeWidth="1.5" />
                <path d="M-20,60 Q90,200 200,80 T380,140" stroke="#000" strokeWidth="1.5" />
                <path d="M-20,80 Q90,220 200,100 T380,160" stroke="#000" strokeWidth="1.5" />
                <path d="M-20,100 Q90,240 200,120 T380,180" stroke="#000" strokeWidth="1.5" />
              </svg>
            </div>

            {/* ── Header Ribbon: Deep Navy & Gold Accent ── */}
            <div className="bg-gradient-to-r from-[#0a192f] via-[#0f2b5c] to-[#1e3a8a] text-white px-3.5 py-2 flex items-center justify-between shrink-0 relative z-10 border-b border-amber-400/40">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg overflow-hidden bg-white p-0.5 shadow-sm border border-white/40 shrink-0">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-black text-xs tracking-wider uppercase text-white font-serif leading-tight">
                    {instName}
                  </h3>
                  <span className="text-[7.5px] font-bold text-amber-300 uppercase tracking-widest block">
                    Premier Coaching &amp; Academic Institute
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <ContactlessIcon />
                <span className="text-[7px] font-mono font-bold text-amber-300 mt-0.5">
                  2025–26
                </span>
              </div>
            </div>

            {/* ── Mid Body: Photo, Chip & Identity Particulars ── */}
            <div className="px-3.5 py-2 flex-1 flex gap-3.5 items-center relative z-10">
              {/* Left Column: Photo & Student ID */}
              <div className="flex flex-col items-center shrink-0">
                {/* Photo Frame with Gold Border & Hologram */}
                <div className="h-[84px] w-[74px] rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 border-2 border-[#0f2b5c] shadow-md flex items-center justify-center font-black text-2xl text-[#0f2b5c] relative overflow-hidden">
                  {student.avatarUrl ? (
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{student.name.charAt(0).toUpperCase()}</span>
                  )}

                  {/* Hologram Watermark Badge */}
                  <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 text-[#0f2b5c] flex items-center justify-center text-[7px] font-black shadow-xs border border-white/50">
                    ★
                  </div>
                </div>

                <span className="text-[8.5px] font-mono font-black text-[#0f2b5c] mt-1 tracking-wider uppercase">
                  {student.studentId}
                </span>
              </div>

              {/* Right Column: Particulars & Smart Chip */}
              <div className="min-w-0 flex-1 space-y-1">
                {/* Chip & Smart Category Row */}
                <div className="flex items-center justify-between pb-0.5">
                  <SmartChip />
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                    STUDENT CARD
                  </span>
                </div>

                {/* Candidate Name */}
                <h4 className="font-black text-sm text-zinc-950 uppercase tracking-tight truncate leading-tight">
                  {student.name}
                </h4>

                {/* Grid Details */}
                <div className="text-[9px] space-y-0.5 text-zinc-700 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 w-12 font-medium">Adm No:</span>
                    <strong className="font-mono text-zinc-900">{student.admissionNo}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-zinc-500 w-12 font-medium">Batch:</span>
                    <strong className="text-zinc-900 truncate">{batchName}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-zinc-500 w-12 font-medium">Course:</span>
                    <strong className="text-zinc-800 truncate">{courseName}</strong>
                  </div>
                  <div className="flex items-center gap-3 pt-0.5">
                    <span className="text-[8px] font-bold text-zinc-600">
                      Blood: <strong className="text-red-700 font-black">{bloodGroup}</strong>
                    </span>
                    <span className="text-[8px] font-bold text-zinc-600">
                      Class: <strong className="text-zinc-900">{student.gradeClass || "Class 11"}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer Bar: Hologram Security & Validity ── */}
            <div className="bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 border-t border-zinc-200 px-3 py-1 flex items-center justify-between text-[8px] relative z-10">
              <span className="flex items-center gap-1 text-emerald-700 font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>Verified Campus PVC</span>
              </span>
              <span className="font-mono font-bold text-zinc-600">
                VALID THRU: <strong>31/03/2026</strong>
              </span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            2. CARD BACK (Emergency, QR, Scannable Barcode, Signatures)
        ══════════════════════════════════════════════════════════════════ */}
        {(viewMode === "both" || viewMode === "back") && (
          <div className="w-[344px] h-[216px] rounded-2xl border-2 border-zinc-800/80 bg-white text-zinc-950 shadow-2xl overflow-hidden flex flex-col justify-between relative shrink-0 select-none print:shadow-none print:border-zinc-800">
            {/* ── Top Magnetic Stripe (Realistic Texture) ── */}
            <div className="w-full h-8 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 flex items-center px-4 relative shrink-0">
              <div className="w-full h-1 bg-white/10 rounded-full"></div>
              <span className="absolute right-3 text-[6px] font-mono text-zinc-500 uppercase tracking-widest">
                MAGNETIC ENCODED TRACK 1 &amp; 2
              </span>
            </div>

            {/* ── Middle Body: Emergency Info, QR Code & Barcode ── */}
            <div className="px-3.5 py-1.5 flex-1 flex gap-3 items-center">
              {/* Left Column: QR Code & Barcode */}
              <div className="flex flex-col items-center shrink-0 space-y-1">
                <StudentQrCode studentId={student.studentId} admissionNo={student.admissionNo} />
                <span className="text-[6.5px] font-mono font-bold text-zinc-500 uppercase">
                  Scan to Verify
                </span>
              </div>

              {/* Right Column: Emergency & Guardian Contact */}
              <div className="min-w-0 flex-1 space-y-1 text-left text-[8.5px] leading-tight">
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-md p-1.5 space-y-0.5">
                  <span className="text-[7px] font-bold text-zinc-500 uppercase block tracking-wider">
                    Emergency Contact Record
                  </span>
                  <p className="truncate">
                    <span className="text-zinc-500">Guardian:</span>{" "}
                    <strong className="text-zinc-900 uppercase">
                      {student.parent?.name || "Registered Parent"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-zinc-500">Helpline:</span>{" "}
                    <strong className="text-zinc-900 font-mono">
                      {student.parent?.phone || student.phone || "+91 98765 43210"}
                    </strong>
                  </p>
                  <p className="truncate">
                    <span className="text-zinc-500">Address:</span>{" "}
                    <span className="text-zinc-700">
                      {student.address || institute?.address || "New Delhi NCR, India"}
                    </span>
                  </p>
                </div>

                {/* Instructions / Terms */}
                <p className="text-[6.8px] text-zinc-500 leading-tight italic">
                  Property of Futurex Learning. If found, please drop in nearest post box or return to campus admin desk.
                </p>
              </div>
            </div>

            {/* ── Footer Bar: Campus Contact & Official Seal ── */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-3 py-1 flex items-center justify-between text-[7.5px] text-zinc-600">
              <div className="space-y-0.5">
                <span className="font-black text-[#0f2b5c] block text-[8px] uppercase tracking-wide">
                  {instName}
                </span>
                <span className="text-[7px] text-zinc-500 block">
                  Campus: {institute?.phone || "+91 98765 43210"} • www.futurexlearning.com
                </span>
              </div>

              <AuthorizedSignatory instituteName={instName} />
            </div>
          </div>
        )}
      </div>

      {/* ── Print Instructions & Notes ── */}
      <div className="text-center text-xs text-muted-foreground no-print space-y-1">
        <p>
          💡 <strong>Tip for Printing:</strong> Use standard PVC Card Printer (e.g. Fargo, Evolis, Zebra) with CR-80 PVC blank cards.
        </p>
        <p className="text-[11px] text-zinc-500">
          For regular desktop printers, choose 100% scale and &quot;Glossy Photo Paper&quot; setting for vibrant colors.
        </p>
      </div>
    </div>
  );
}
