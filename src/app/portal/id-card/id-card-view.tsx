"use client";

import React, { useRef } from "react";
import { InstituteLogo } from "@/components/ui/institute-logo";
import {
  Printer,
  ShieldCheck,
  QrCode,
  Download,
  Sparkles,
  Phone,
  GraduationCap,
  Calendar,
} from "lucide-react";
import { StudentQrCode } from "@/components/ui/student-qr-code";

interface StudentIDProps {
  student: {
    name: string;
    studentId: string;
    admissionNo: string;
    phone?: string | null;
    emergencyContact?: string | null;
    gradeClass?: string | null;
    photoUrl?: string | null;
    admissionDate?: Date | string;
    enrollmentCourse?: string;
    enrollmentBatch?: string;
  };
  institute: {
    name: string;
    code: string;
    logoUrl?: string | null;
    address?: string | null;
    phone?: string | null;
  };
}

export function StudentIDCardView({ student, institute }: StudentIDProps) {
  const handlePrint = () => {
    window.print();
  };

  const issueDateStr = student.admissionDate
    ? new Date(student.admissionDate).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "2026-27";

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-white">Digital Smart Student ID</h1>
          <p className="text-xs text-zinc-400">
            Cryptographically verifiable CR-80 digital credential for campus admission and library access.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.99]"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official ID Card</span>
        </button>
      </div>

      {/* ID Card Presentation Canvas */}
      <div className="flex flex-col items-center justify-center py-6 sm:py-10">
        {/* Printable Card Container */}
        <div
          id="id-card-element"
          className="w-full max-w-[420px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#050811] border-2 border-white/20 shadow-2xl relative text-white font-poppins selection:bg-none"
        >
          {/* Top Brand Banner */}
          <div className="p-5 pb-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-md">
                  <InstituteLogo
                    logoUrl={institute.logoUrl}
                    name={institute.name}
                    size={38}
                  />
                </div>
                <div>
                  <h2 className="font-black text-xs sm:text-sm tracking-wider uppercase leading-tight">
                    {institute.name}
                  </h2>
                  <span className="text-[10px] text-white/80 font-mono">
                    CAMPUS: {institute.code || "FL-SRINAGAR"}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30 uppercase tracking-widest">
                  STUDENT
                </span>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-5">
            {/* Student Photo & Primary Info */}
            <div className="flex items-center gap-4">
              {/* Photo Box */}
              <div className="relative shrink-0">
                <div className="w-24 h-28 rounded-2xl overflow-hidden bg-white/10 border-2 border-white/20 flex items-center justify-center shadow-inner">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <GraduationCap className="w-10 h-10 text-zinc-400 mx-auto opacity-70" />
                      <span className="text-[9px] text-zinc-400 font-mono mt-1 block">
                        VERIFIED
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              </div>

              {/* Core Details */}
              <div className="space-y-1 overflow-hidden">
                <h3 className="font-black text-lg text-white leading-tight truncate">
                  {student.name}
                </h3>
                <div className="space-y-0.5 text-xs text-zinc-300">
                  <div className="font-mono text-primary font-bold">
                    ID: {student.studentId}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    ADM: {student.admissionNo}
                  </div>
                  <div className="text-[11px] font-medium text-white truncate">
                    {student.enrollmentCourse || "Academic Scholar"}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Batch: {student.enrollmentBatch || "Main Cohort"}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification QR & Emergency Metadata */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
              <div className="space-y-1 text-[11px]">
                <div className="text-zinc-400">
                  <span className="text-[9px] uppercase tracking-wider block text-zinc-500 font-semibold">
                    Emergency Contact
                  </span>
                  <span className="font-mono text-zinc-200">
                    {student.emergencyContact || student.phone || "+91 Contact Admin"}
                  </span>
                </div>
                <div className="text-zinc-400">
                  <span className="text-[9px] uppercase tracking-wider block text-zinc-500 font-semibold">
                    Issued Session
                  </span>
                  <span className="font-mono text-zinc-200">{issueDateStr}</span>
                </div>
              </div>

              {/* QR Verification Visual */}
              <div className="p-1.5 rounded-xl bg-white text-black shrink-0 shadow-lg border border-white/20">
                <StudentQrCode
                  value={student.studentId || student.admissionNo}
                  size={48}
                  darkColor="#0f172a"
                  lightColor="#ffffff"
                />
              </div>
            </div>

            {/* Bottom Security Barcode Strip */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-zinc-400">
              <span>SCAN-ID: {student.studentId}</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-2.5 h-2.5" /> SECURE SMART CARD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

