"use client";

import React, { useState } from "react";
import {
  Printer,
  ShieldCheck,
  RotateCw,
  Sparkles,
  Phone,
  MapPin,
  QrCode,
  FileCheck,
  CheckCircle2,
  Sliders,
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

/** Realistic Golden EMV Smart Chip */
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

/** Contactless NFC Wave Graphic */
function ContactlessIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="text-white/80" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M7 16a6 6 0 0 1 0-8" />
      <path d="M11 19a10 10 0 0 0 0-14" />
      <path d="M15 22a14 14 0 0 0 0-20" />
    </svg>
  );
}

import { StudentQrCode } from "@/components/ui/student-qr-code";

/** Verifiable QR Code with Anti-Tamper Frame */
function CardQrWrapper({ studentId }: { studentId: string }) {
  return (
    <div className="p-1.5 bg-white rounded-lg border border-zinc-300 shadow-xs inline-block">
      <StudentQrCode value={studentId} size={54} darkColor="#0f2b5c" lightColor="#ffffff" />
    </div>
  );
}

/** Official Stamp & Signature Block */
function AuthorizedSignatory({ instituteName }: { instituteName: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-10 w-10 rounded-full border border-red-600/70 p-0.5 flex items-center justify-center rotate-[-12deg] shrink-0 opacity-90">
        <div className="h-full w-full rounded-full border border-dashed border-red-600/60 flex flex-col items-center justify-center text-[5px] font-black uppercase text-red-700 leading-tight">
          <span>* AUTH *</span>
          <span className="text-[6px] font-black text-red-800">SEAL</span>
          <span className="text-[4.5px]">VERIFIED</span>
        </div>
      </div>
      <div className="text-right">
        <svg width="70" height="22" viewBox="0 0 90 28" className="inline-block text-blue-900 fill-none stroke-current stroke-[1.6]">
          <path d="M 6 20 C 18 5, 26 24, 38 12 C 48 2, 54 22, 65 14 C 74 8, 80 18, 86 11" strokeLinecap="round" />
          <path d="M 22 23 C 38 25, 58 24, 76 22" strokeLinecap="round" strokeWidth="1.2" />
        </svg>
        <div className="w-18 border-b border-zinc-400 mt-[-2px] mb-0.5 ml-auto"></div>
        <span className="text-[7px] font-bold text-zinc-800 uppercase block tracking-wider">
          Registrar / Director
        </span>
      </div>
    </div>
  );
}

export function StudentIdCard({
  student,
  activeEnrollment,
  institute,
}: StudentIdCardProps) {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [isFlipped, setIsFlipped] = useState(false);
  const [printLayout, setPrintLayout] = useState<"both" | "front" | "back">("both");

  const instName = institute?.name || "FUTUREX LEARNING";
  const logoUrl = institute?.logoUrl || "/logo.png";
  const batchName = activeEnrollment?.batch?.name || "Regular Batch";
  const courseName = activeEnrollment?.course?.name || "Academic Coaching Program";
  const bloodGroup = student.bloodGroup || "O+ve";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Senior UI/UX Control Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card border rounded-2xl shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-foreground">Official PVC Smart Student Identity Card</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              ISO/IEC 7810 CR-80
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ultra-realistic CR-80 PVC card with smart chip, security guilloche patterns, contactless NFC, and verifiable QR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Orientation Toggle */}
          <div className="inline-flex rounded-xl border bg-muted/40 p-1 text-xs">
            <button
              onClick={() => {
                setOrientation("portrait");
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                orientation === "portrait"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Portrait Lanyard
            </button>
            <button
              onClick={() => {
                setOrientation("landscape");
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                orientation === "landscape"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Landscape Wallet
            </button>
          </div>

          {/* Interactive 3D Flip Button */}
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-background text-xs font-semibold hover:bg-muted/50 transition-all shadow-xs"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>{isFlipped ? "Flip to Front" : "Flip to Back"}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
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
                visibility: hidden !important;
              }
              .id-card-print-stage, .id-card-print-stage * {
                visibility: visible !important;
              }
              .id-card-print-stage {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: wrap !important;
                gap: 24px !important;
                justify-content: center !important;
                align-items: center !important;
                padding: 24px !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `,
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════
          CARD VIEWPORT CONTAINER
      ══════════════════════════════════════════════════════════════════ */}
      <div className="id-card-print-stage flex flex-col items-center justify-center py-6 min-h-[460px]">
        {/* ================================================================
            OPTION A: PORTRAIT LANYARD BADGE (54mm × 85.6mm / 240px × 380px)
        ================================================================ */}
        {orientation === "portrait" && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            {/* ── PORTRAIT FRONT ── */}
            <div className={`w-[240px] h-[380px] rounded-3xl border-2 border-zinc-800 bg-white text-zinc-950 shadow-2xl overflow-hidden flex flex-col justify-between relative shrink-0 select-none print:shadow-none print:border-zinc-800 transition-all duration-500 ${isFlipped ? "hidden md:flex" : "flex"}`}>
              {/* Lanyard Hole Clip Guide */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-9 h-1.5 rounded-full bg-zinc-300/50 z-20"></div>

              {/* Security Guilloche Wave Overlay */}
              <div className="absolute inset-0 opacity-[0.035] pointer-events-none overflow-hidden">
                <svg width="240" height="380" viewBox="0 0 240 380" fill="none">
                  <path d="M-20,40 Q90,180 200,60 T380,120" stroke="#000" strokeWidth="1.5" />
                  <path d="M-20,120 Q90,260 200,140 T380,200" stroke="#000" strokeWidth="1.5" />
                  <path d="M-20,200 Q90,340 200,220 T380,280" stroke="#000" strokeWidth="1.5" />
                </svg>
              </div>

              {/* ── Portrait Header ── */}
              <div className="bg-gradient-to-br from-[#0a192f] via-[#0f2b5c] to-[#1e3a8a] text-white pt-4 pb-2.5 px-3 flex flex-col items-center text-center relative z-10 border-b border-amber-400/40">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-white p-0.5 shadow-sm border border-white/40 mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- printable cards need unmodified image sources */}
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h3 className="font-black text-xs tracking-wider uppercase text-white font-serif leading-tight">
                  {instName}
                </h3>
                <span className="text-[7.5px] font-bold text-amber-300 uppercase tracking-widest block">
                  Campus Identity Pass • 2026–27
                </span>
              </div>

              {/* ── Portrait Photo & Details ── */}
              <div className="px-3.5 py-2 flex-1 flex flex-col items-center justify-around relative z-10 text-center">
                {/* Photo with Gold Seal */}
                <div className="relative">
                  <div className="h-[96px] w-[86px] rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 border-2 border-[#0f2b5c] shadow-md flex items-center justify-center font-black text-3xl text-[#0f2b5c] overflow-hidden">
                    {student.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- printable cards need unmodified image sources
                      <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{student.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 text-[#0f2b5c] flex items-center justify-center text-[8px] font-black shadow-xs border border-white">
                    ★
                  </div>
                </div>

                {/* Candidate Name */}
                <div className="space-y-0.5 pt-1">
                  <h4 className="font-black text-sm text-zinc-950 uppercase tracking-tight leading-tight">
                    {student.name}
                  </h4>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-300">
                    {batchName}
                  </span>
                </div>

                {/* Specifics Grid */}
                <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2 text-[9px] text-zinc-700 space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Roll No:</span>
                    <strong className="font-mono text-zinc-950 font-black">{student.studentId}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Adm No:</span>
                    <strong className="font-mono text-zinc-900">{student.admissionNo}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Class:</span>
                    <strong className="text-zinc-900">{student.gradeClass || "Class 11"}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Blood Group:</span>
                    <strong className="text-red-700 font-black">{bloodGroup}</strong>
                  </div>
                </div>

                {/* Smart Chip & NFC */}
                <div className="w-full flex items-center justify-between px-1">
                  <SmartChip />
                  <div className="flex items-center gap-1 text-[8px] font-bold text-zinc-500">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span>EMV Secured</span>
                  </div>
                </div>
              </div>

              {/* ── Portrait Footer ── */}
              <div className="bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 border-t border-zinc-200 px-3 py-1.5 flex items-center justify-between text-[7.5px]">
                <span className="font-bold text-zinc-600">VALID THRU: 31/03/2026</span>
                <span className="font-mono font-bold text-zinc-500">CR80 PVC</span>
              </div>
            </div>

            {/* ── PORTRAIT BACK ── */}
            <div className={`w-[240px] h-[380px] rounded-3xl border-2 border-zinc-800 bg-white text-zinc-950 shadow-2xl overflow-hidden flex flex-col justify-between relative shrink-0 select-none print:shadow-none print:border-zinc-800 transition-all duration-500 ${!isFlipped ? "hidden md:flex" : "flex"}`}>
              {/* Top Magnetic Stripe */}
              <div className="w-full h-8 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 flex items-center px-3 relative shrink-0">
                <div className="w-full h-1 bg-white/10 rounded-full"></div>
                <span className="absolute right-2 text-[5.5px] font-mono text-zinc-500 uppercase tracking-widest">
                  TRACK 1 &amp; 2 ENCODED
                </span>
              </div>

              {/* Body Content */}
              <div className="px-3.5 py-2 flex-1 flex flex-col items-center justify-around text-center space-y-1.5">
                <CardQrWrapper studentId={student.studentId || student.admissionNo || student.id} />
                <span className="text-[7.5px] font-mono font-bold text-zinc-500 uppercase">
                  Scan to Verify Campus Entry
                </span>

                {/* Emergency Contact Block */}
                <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2 text-[8px] text-zinc-700 text-left space-y-0.5">
                  <span className="text-[6.5px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Emergency Guardian Information
                  </span>
                  <p className="truncate">
                    <span className="text-zinc-500">Guardian:</span>{" "}
                    <strong className="text-zinc-950">{student.parent?.name || "Parent Record"}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-500">Helpline:</span>{" "}
                    <strong className="text-zinc-950 font-mono">{student.parent?.phone || student.phone || "+91 98765 43210"}</strong>
                  </p>
                  <p className="truncate">
                    <span className="text-zinc-500">Address:</span>{" "}
                    <span className="text-zinc-700">{student.address || institute?.address || "New Delhi NCR"}</span>
                  </p>
                </div>

                <p className="text-[6.5px] text-zinc-500 italic leading-tight px-1">
                  Property of Futurex Learning. If found, please return to campus administrative office.
                </p>

                {/* Signatory */}
                <div className="w-full flex justify-end pt-1">
                  <AuthorizedSignatory instituteName={instName} />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-zinc-100 border-t border-zinc-200 px-3 py-1 flex items-center justify-between text-[7px] text-zinc-500">
                <span>Helpline: {institute?.phone || "+91 98765 43210"}</span>
                <span>www.futurexlearning.com</span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            OPTION B: LANDSCAPE WALLET CARD (85.6mm × 54mm / 344px × 216px)
        ================================================================ */}
        {orientation === "landscape" && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* ── LANDSCAPE FRONT ── */}
            <div className={`w-[344px] h-[216px] rounded-2xl border-2 border-zinc-800 bg-white text-zinc-950 shadow-2xl overflow-hidden flex flex-col justify-between relative shrink-0 select-none print:shadow-none print:border-zinc-800 transition-all duration-500 ${isFlipped ? "hidden md:flex" : "flex"}`}>
              {/* Header Ribbon */}
              <div className="bg-gradient-to-r from-[#0a192f] via-[#0f2b5c] to-[#1e3a8a] text-white px-3.5 py-2 flex items-center justify-between shrink-0 border-b border-amber-400/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg overflow-hidden bg-white p-0.5 shadow-sm border border-white/40 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element -- printable cards need unmodified image sources */}
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
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
                  <span className="text-[7px] font-mono font-bold text-amber-300 mt-0.5">2026–27</span>
                </div>
              </div>

              {/* Body */}
              <div className="px-3.5 py-2 flex-1 flex gap-3.5 items-center">
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-[84px] w-[74px] rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 border-2 border-[#0f2b5c] shadow-md flex items-center justify-center font-black text-2xl text-[#0f2b5c] relative overflow-hidden">
                    {student.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- printable cards need unmodified image sources
                      <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{student.name.charAt(0).toUpperCase()}</span>
                    )}
                    <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 text-[#0f2b5c] flex items-center justify-center text-[7px] font-black shadow-xs border border-white/50">
                      ★
                    </div>
                  </div>
                  <span className="text-[8.5px] font-mono font-black text-[#0f2b5c] mt-1 tracking-wider uppercase">
                    {student.studentId}
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between pb-0.5">
                    <SmartChip />
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                      STUDENT CARD
                    </span>
                  </div>
                  <h4 className="font-black text-sm text-zinc-950 uppercase tracking-tight truncate leading-tight">
                    {student.name}
                  </h4>
                  <div className="text-[9px] space-y-0.5 text-zinc-700 leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-500 w-12 font-medium">Adm No:</span>
                      <strong className="font-mono text-zinc-900">{student.admissionNo}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-zinc-500 w-12 font-medium">Batch:</span>
                      <strong className="text-zinc-900 truncate">{batchName}</strong>
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

              {/* Footer */}
              <div className="bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 border-t border-zinc-200 px-3 py-1 flex items-center justify-between text-[8px]">
                <span className="flex items-center gap-1 text-emerald-700 font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  <span>Verified Campus PVC</span>
                </span>
                <span className="font-mono font-bold text-zinc-600">
                  VALID THRU: <strong>31/03/2026</strong>
                </span>
              </div>
            </div>

            {/* ── LANDSCAPE BACK ── */}
            <div className={`w-[344px] h-[216px] rounded-2xl border-2 border-zinc-800 bg-white text-zinc-950 shadow-2xl overflow-hidden flex flex-col justify-between relative shrink-0 select-none print:shadow-none print:border-zinc-800 transition-all duration-500 ${!isFlipped ? "hidden md:flex" : "flex"}`}>
              {/* Magnetic Stripe */}
              <div className="w-full h-8 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 flex items-center px-4 relative shrink-0">
                <div className="w-full h-1 bg-white/10 rounded-full"></div>
                <span className="absolute right-3 text-[6px] font-mono text-zinc-500 uppercase tracking-widest">
                  MAGNETIC ENCODED TRACK 1 &amp; 2
                </span>
              </div>

              {/* Body */}
              <div className="px-3.5 py-1.5 flex-1 flex gap-3 items-center">
                <div className="flex flex-col items-center shrink-0 space-y-1">
                  <CardQrWrapper studentId={student.studentId || student.admissionNo || student.id} />
                  <span className="text-[6.5px] font-mono font-bold text-zinc-500 uppercase">
                    Scan to Verify
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-1 text-left text-[8.5px] leading-tight">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-md p-1.5 space-y-0.5">
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
                  </div>
                  <p className="text-[6.8px] text-zinc-500 leading-tight italic">
                    Property of Futurex Learning. If found, please return to campus admin desk.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-zinc-50 border-t border-zinc-200 px-3 py-1 flex items-center justify-between text-[7.5px] text-zinc-600">
                <div className="space-y-0.5">
                  <span className="font-black text-[#0f2b5c] block text-[8px] uppercase tracking-wide">
                    {instName}
                  </span>
                  <span className="text-[7px] text-zinc-500 block">
                    Campus: {institute?.phone || "+91 98765 43210"}
                  </span>
                </div>
                <AuthorizedSignatory instituteName={instName} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Printing & Physical Card Tips ── */}
      <div className="text-center text-xs text-muted-foreground no-print space-y-1">
        <p>
          💡 <strong>Printing Advice:</strong> Use standard CR80 PVC blank cards (85.6mm × 54mm) on card printers like Zebra, Fargo, or Evolis.
        </p>
        <p className="text-[11px] text-zinc-500">
          Use the <strong>&quot;Flip 3D&quot;</strong> button to inspect the card sides or switch between Portrait Lanyard and Landscape Wallet formats.
        </p>
      </div>
    </div>
  );
}
