"use client";

import { Printer, ShieldCheck, QrCode, Phone, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StudentIdCardProps {
  student: any;
  activeEnrollment: any;
}

export function StudentIdCard({ student, activeEnrollment }: StudentIdCardProps) {
  const batchName = activeEnrollment?.batch?.name || "Classroom Batch";
  const courseName = activeEnrollment?.course?.name || "Academic Coaching";

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b pb-4 no-print">
        <div>
          <h4 className="text-sm font-bold text-foreground">Official PVC Student Identity Card</h4>
          <p className="text-xs text-muted-foreground">
            Standard CR80 dimensions (85.6mm × 54mm) formatted with front &amp; back verification cards.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrintCard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Printer className="h-4 w-4" />
          <span>Print ID Card</span>
        </button>
      </div>

      {/* Cards Display Grid (Centered for screen, printable for paper) */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
        {/* ── CARD FRONT ── */}
        <div className="w-[340px] h-[215px] rounded-2xl border-2 border-zinc-800 bg-white text-zinc-900 shadow-xl overflow-hidden flex flex-col justify-between relative print:shadow-none print:border-zinc-800 shrink-0">
          {/* Card Header Strip */}
          <div className="bg-primary text-white px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-white text-primary flex items-center justify-center font-black text-xs shadow-xs">
                FL
              </div>
              <div className="leading-tight">
                <span className="font-black text-xs tracking-wider block">FUTUREX LEARNING</span>
                <span className="text-[8px] font-semibold text-blue-100 uppercase tracking-widest block">
                  Student Identity Card
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded text-white font-mono">
              2025-26
            </span>
          </div>

          {/* Card Body */}
          <div className="px-4 py-2 flex-1 flex gap-3 items-center">
            {/* Photo Box */}
            <div className="flex flex-col items-center shrink-0">
              <div className="h-20 w-20 rounded-xl bg-zinc-100 border-2 border-primary/30 flex items-center justify-center font-black text-2xl text-primary shadow-inner relative overflow-hidden">
                {student.name.charAt(0)}
                {/* Hologram Badge */}
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[7px] font-bold shadow-xs">
                  ★
                </div>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 mt-1 uppercase font-semibold">
                {student.studentId}
              </span>
            </div>

            {/* Particulars */}
            <div className="min-w-0 text-left space-y-1">
              <p className="font-black text-sm text-zinc-900 truncate">{student.name}</p>
              <div className="text-[10px] space-y-0.5 text-zinc-700">
                <p>
                  <span className="text-zinc-500">Roll No:</span>{" "}
                  <strong className="font-mono text-zinc-900">{student.studentId}</strong>
                </p>
                <p>
                  <span className="text-zinc-500">Adm No:</span>{" "}
                  <strong className="font-mono text-zinc-900">{student.admissionNo}</strong>
                </p>
                <p className="truncate">
                  <span className="text-zinc-500">Batch:</span>{" "}
                  <strong className="text-zinc-900">{batchName}</strong>
                </p>
                <p>
                  <span className="text-zinc-500">Class:</span>{" "}
                  <strong>{student.gradeClass || "Class 11"}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Card Footer Bar */}
          <div className="bg-zinc-100 border-t border-zinc-200 px-4 py-1.5 flex items-center justify-between text-[9px] text-zinc-600 font-medium">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="h-3 w-3" /> Verified Student
            </span>
            <span className="font-mono text-[8px] text-zinc-500">Expires: 31/03/2026</span>
          </div>
        </div>

        {/* ── CARD BACK ── */}
        <div className="w-[340px] h-[215px] rounded-2xl border-2 border-zinc-800 bg-white text-zinc-900 shadow-xl overflow-hidden flex flex-col justify-between relative print:shadow-none print:border-zinc-800 shrink-0">
          {/* Card Header Strip */}
          <div className="bg-zinc-800 text-white px-4 py-1.5 flex items-center justify-between shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300">
              Emergency &amp; Guardian Info
            </span>
            <span className="text-[9px] font-mono text-zinc-400">Futurex Campus Card</span>
          </div>

          {/* Details Body */}
          <div className="px-4 py-2 flex-1 text-left space-y-1.5 text-[10px]">
            <div className="space-y-0.5 border-b border-zinc-100 pb-1">
              <p>
                <span className="text-zinc-500">Father/Guardian:</span>{" "}
                <strong className="text-zinc-900">{student.parent?.name || "Registered Guardian"}</strong>
              </p>
              <p>
                <span className="text-zinc-500">Guardian Contact:</span>{" "}
                <strong className="text-zinc-900">{student.parent?.phone || student.phone || "+91 98765 43210"}</strong>
              </p>
              <p className="truncate">
                <span className="text-zinc-500">Address:</span>{" "}
                <span className="text-zinc-700">{student.address || "New Delhi NCR, India"}</span>
              </p>
            </div>

            {/* Stylized Barcode */}
            <div className="text-center pt-0.5">
              <div className="font-mono text-sm tracking-widest text-zinc-900 font-bold select-none">
                ||| | |||| | || | |||| ||| | |||
              </div>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">
                *{student.studentId}*
              </span>
            </div>
          </div>

          {/* Card Footer Bar */}
          <div className="bg-zinc-100 border-t border-zinc-200 px-4 py-1.5 flex items-center justify-between text-[9px] text-zinc-600">
            <div>
              <span className="font-semibold text-zinc-800 block text-[8px]">
                Futurex Learning Central Campus
              </span>
              <span className="text-[8px] text-zinc-500">Helpline: +91 98765 43210</span>
            </div>
            <div className="text-right">
              <div className="w-16 border-b border-zinc-400 mb-0.5"></div>
              <span className="text-[7px] text-zinc-500 uppercase font-semibold block">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

