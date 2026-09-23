"use client";

import React, { useState } from "react";
import { formatCurrency, formatDate, numberToWords } from "@/lib/utils";
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Building2,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface OfficialReceiptViewProps {
  payment: {
    id: string;
    receiptNo: string;
    amount: number;
    paymentMethod: string;
    paymentDate: Date;
    collectedBy: string;
    referenceNo: string | null;
    notes: string | null;
    status: string;
    student: {
      id: string;
      name: string;
      studentId: string;
      admissionNo: string;
      phone: string | null;
      email: string | null;
      gradeClass: string | null;
      city: string | null;
      state: string | null;
      parent: {
        name: string;
        phone: string | null;
        relation: string | null;
      } | null;
      enrollments: {
        course: { name: string; code: string };
        batch: { name: string; code: string };
      }[];
    };
    feePlan: {
      id: string;
      title: string;
      admissionFee: number;
      tuitionFee: number;
      materialFee: number;
      examFee: number;
      otherCharges: number;
      totalAmount: number;
      discountAmount: number;
      discountReason: string | null;
      finalAmount: number;
      paidAmount: number;
      balanceAmount: number;
      status: string;
    };
    installment: {
      id: string;
      title: string;
      dueDate: Date;
      amount: number;
      paidAmount: number;
      remainingAmount: number;
      status: string;
    } | null;
  };
  institute: {
    name: string;
    tagline: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    logoUrl?: string | null;
  } | null;
}

// ─── SVG Vectors & Security Graphics ─────────────────────────────────────────

function BarcodeSvg({ code, color = "#0f2b5c" }: { code: string; color?: string }) {
  const bars = [
    3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2, 1, 1,
    2, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 3,
  ];

  return (
    <div className="flex flex-col items-end">
      <svg width="138" height="26" viewBox="0 0 138 26" className="overflow-visible">
        {bars.map((w, idx) => {
          const x = idx * 2.6;
          const isBlack = idx % 2 === 0;
          return isBlack ? (
            <rect key={idx} x={x} y="0" width={w * 0.75} height="22" fill={color} />
          ) : null;
        })}
      </svg>
      <span className="font-mono text-[7.5px] tracking-widest text-zinc-600 uppercase mt-0.5">
        *{code}*
      </span>
    </div>
  );
}

function SecurityQrCode({ receiptNo, studentId, color = "#0f2b5c" }: { receiptNo: string; studentId: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 border border-zinc-300 p-1.5 rounded-lg bg-zinc-50/80">
      <svg width="46" height="46" viewBox="0 0 44 44" className="shrink-0">
        <rect width="44" height="44" fill="#ffffff" />
        <rect x="2" y="2" width="12" height="12" fill={color} rx="1" />
        <rect x="4" y="4" width="8" height="8" fill="#ffffff" />
        <rect x="6" y="6" width="4" height="4" fill={color} />
        <rect x="30" y="2" width="12" height="12" fill={color} rx="1" />
        <rect x="32" y="4" width="8" height="8" fill="#ffffff" />
        <rect x="34" y="6" width="4" height="4" fill={color} />
        <rect x="2" y="30" width="12" height="12" fill={color} rx="1" />
        <rect x="4" y="32" width="8" height="8" fill="#ffffff" />
        <rect x="6" y="34" width="4" height="4" fill={color} />
        <rect x="18" y="4" width="3" height="3" fill={color} />
        <rect x="24" y="4" width="3" height="3" fill={color} />
        <rect x="16" y="16" width="12" height="12" fill={color} />
        <rect x="18" y="18" width="8" height="8" fill="#ffffff" />
        <rect x="20" y="20" width="4" height="4" fill={color} />
        <rect x="4" y="18" width="3" height="3" fill={color} />
        <rect x="10" y="22" width="3" height="3" fill={color} />
        <rect x="18" y="32" width="3" height="3" fill={color} />
        <rect x="24" y="36" width="3" height="3" fill={color} />
        <rect x="32" y="18" width="3" height="3" fill={color} />
        <rect x="36" y="24" width="3" height="3" fill={color} />
        <rect x="32" y="32" width="4" height="4" fill={color} />
        <rect x="38" y="38" width="3" height="3" fill={color} />
      </svg>
      <div className="text-[7.5px] leading-tight text-zinc-600">
        <p className="font-bold text-zinc-900 uppercase">Scan to Verify</p>
        <p className="font-mono text-zinc-500">ID: {receiptNo.slice(-6)}</p>
        <p className="text-[6.5px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
          <ShieldCheck className="h-2.5 w-2.5" /> Cryptographic Sign
        </p>
      </div>
    </div>
  );
}

function OfficialAccountsSeal({ receiptDate, color = "#1e3a8a" }: { receiptDate: string; color?: string }) {
  return (
    <div className="relative select-none pointer-events-none rotate-[-5deg] opacity-90 transition-transform">
      <svg width="112" height="112" viewBox="0 0 140 140" className="drop-shadow-xs">
        <circle cx="70" cy="70" r="66" stroke={color} strokeWidth="2.5" fill="none" strokeDasharray="6 2" />
        <circle cx="70" cy="70" r="61" stroke={color} strokeWidth="1" fill="#f8faff" fillOpacity="0.4" />
        <path id="circleTextPath" d="M 70,70 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" fill="none" />
        <text fontSize="7.5" fontWeight="bold" fill={color} letterSpacing="2.2">
          <textPath href="#circleTextPath" startOffset="5%">
            ★ FUTUREX LEARNING CENTRAL ACCOUNTS ★
          </textPath>
        </text>
        <circle cx="70" cy="70" r="38" stroke={color} strokeWidth="1.5" fill="none" />
        <circle cx="70" cy="70" r="35" stroke="#b45309" strokeWidth="0.8" strokeDasharray="2 1" fill="none" />
        <text x="70" y="58" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#b45309" letterSpacing="1">
          OFFICIALLY
        </text>
        <text x="70" y="72" textAnchor="middle" fontSize="13" fontWeight="900" fill={color} letterSpacing="1">
          REALIZED
        </text>
        <text x="70" y="82" textAnchor="middle" fontSize="5.5" fontWeight="semibold" fill={color} letterSpacing="0.8">
          {receiptDate}
        </text>
        <text x="70" y="90" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#047857" letterSpacing="1">
          ✓ AUDITED &amp; SETTLED
        </text>
      </svg>
    </div>
  );
}

function DigitizedSignature({ name, color = "#1e3a8a" }: { name: string; color?: string }) {
  return (
    <div className="flex flex-col items-end select-none">
      <svg width="120" height="34" viewBox="0 0 140 40" className="opacity-90">
        <path
          d="M 12 28 C 24 14, 38 6, 52 18 C 66 30, 78 8, 92 14 C 104 20, 114 12, 126 18"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 22 28 C 45 32, 85 29, 128 26"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="w-36 border-b border-zinc-800 -mt-1 mb-1"></div>
      <p className="font-bold text-zinc-900 text-[9.5px] uppercase tracking-wide">{name || "Accounts Officer"}</p>
      <p className="text-zinc-600 text-[8px] font-semibold">Authorized Signatory &amp; Cashier</p>
      <p className="text-[7px] text-zinc-400">Futurex Central Finance Division</p>
    </div>
  );
}

// ─── Main Official Receipt Component ─────────────────────────────────────────

export function OfficialReceiptView({ payment, institute }: OfficialReceiptViewProps) {
  const [copyType, setCopyType] = useState<"STUDENT" | "OFFICE" | "AUDIT">("STUDENT");
  const [isCopied, setIsCopied] = useState(false);

  const amountInWords = numberToWords(payment.amount);
  const activeEnrollment = payment.student.enrollments?.[0];
  const batchName = activeEnrollment?.batch?.name || payment.student.gradeClass || "Classroom Batch";
  const courseName = activeEnrollment?.course?.name || "Academic Coaching & Competition Program";
  const formattedDate = formatDate(payment.paymentDate);
  const logoUrl = institute?.logoUrl || "/logo.png";
  const instName = institute?.name || "FUTUREX LEARNING";

  const copyConfig = {
    STUDENT: {
      label: "ORIGINAL — STUDENT / PARENT COPY",
      watermark: "STUDENT COPY",
      ribbonBg: "bg-gradient-to-r from-[#0a192f] via-[#0f2b5c] to-[#1e3a8a]",
      borderColor: "border-[#0f2b5c]",
      textColor: "text-[#0f2b5c]",
      themeColor: "#0f2b5c",
    },
    OFFICE: {
      label: "DUPLICATE — INSTITUTE ACCOUNTS COPY",
      watermark: "OFFICE RECORD",
      ribbonBg: "bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#059669]",
      borderColor: "border-[#047857]",
      textColor: "text-[#047857]",
      themeColor: "#047857",
    },
    AUDIT: {
      label: "TRIPLICATE — STATUTORY & AUDIT COPY",
      watermark: "AUDIT COPY",
      ribbonBg: "bg-gradient-to-r from-[#450a0a] via-[#881337] to-[#9f1239]",
      borderColor: "border-[#881337]",
      textColor: "text-[#881337]",
      themeColor: "#881337",
    },
  };

  const currentCopy = copyConfig[copyType];

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">
      {/* ── Action Toolbar (Hidden during print) ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-card border rounded-2xl shadow-xs no-print">
        <Link
          href="/finance/payments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Fee Ledger</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Selector */}
          <div className="inline-flex items-center rounded-xl border bg-muted/40 p-1 text-xs">
            {(["STUDENT", "OFFICE", "AUDIT"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setCopyType(type)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  copyType === type
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {type === "STUDENT" ? "Student Copy" : type === "OFFICE" ? "Office Copy" : "Audit Copy"}
              </button>
            ))}
          </div>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-background text-xs font-semibold hover:bg-muted/50 transition-all shadow-xs"
            title="Copy Receipt Web Link"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{isCopied ? "Link Copied!" : "Copy Link"}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print Voucher</span>
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
              .receipt-sheet-container, .receipt-sheet-container * {
                visibility: visible !important;
              }
              .receipt-sheet-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                border: 2px solid ${currentCopy.themeColor} !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                margin: 0 !important;
                padding: 14px 18px !important;
                page-break-inside: avoid !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `,
        }}
      />

      {/* ── THE OFFICIAL A4 VOUCHER SHEET ── */}
      <div className={`receipt-sheet-container bg-white text-zinc-950 border-2 ${currentCopy.borderColor} rounded-2xl p-6 sm:p-8 space-y-3 relative shadow-2xl overflow-hidden print:p-3 print:space-y-2.5 transition-colors duration-300`}>
        
        {/* Diagonal Security Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] rotate-[-28deg] z-0">
          <span className="text-8xl sm:text-9xl font-black font-serif tracking-widest text-zinc-950 uppercase">
            {currentCopy.watermark}
          </span>
        </div>

        {/* Security Micro-Header */}
        <div className="border-b border-zinc-200 pb-1 flex justify-between items-center text-[7.5px] font-mono uppercase tracking-widest text-zinc-600 relative z-10">
          <span>★ OFFICIAL FINANCIAL INSTRUMENT • COMPLIANT UNDER EDUCATION STATUTE</span>
          <span>GOVT. REG NO: REG/FL-2026/DEL • ISO 9001:2015 CERTIFIED ★</span>
        </div>

        {/* ── SECTION 1: MASTER LETTERHEAD ── */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-zinc-800 pb-3 print:pb-2 relative z-10">
          {/* Logo & Legal Header */}
          <div className="flex items-center gap-3.5">
            <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-white p-1 border-2 ${currentCopy.borderColor} shadow-sm shrink-0 flex items-center justify-center`}>
              <img
                src={logoUrl}
                alt="Institute Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${currentCopy.textColor} font-serif uppercase`}>
                  {instName}
                </h1>
              </div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                {institute?.tagline || "Premier Institute for JEE (Main + Adv), NEET-UG & Senior Academic Coaching"}
              </p>
              <p className="text-[8.5px] text-zinc-600">
                Central Campus: {institute?.address || "Plot 42, Institutional Area, Knowledge Park, New Delhi"} • Tel: {institute?.phone || "+91 98765 43210"}
              </p>
              <p className="text-[8px] font-mono text-zinc-600">
                GSTIN: <strong>07AAACF9876Q1Z2</strong> • PAN: <strong>AAACF9876Q</strong> • Email: {institute?.email || "accounts@futurexlearning.com"}
              </p>
            </div>
          </div>

          {/* Receipt Classification & Barcode Box */}
          <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
            <div className={`border ${currentCopy.borderColor} rounded-md px-2.5 py-0.5 bg-zinc-50 text-[8px] font-black tracking-wider ${currentCopy.textColor} uppercase`}>
              {currentCopy.label}
            </div>

            <BarcodeSvg code={payment.receiptNo} color={currentCopy.themeColor} />

            <div className="text-[9px] font-mono text-zinc-700">
              <span>Date: <strong>{formattedDate} {payment.paymentDate ? new Date(payment.paymentDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : ""}</strong></span>
              <span className="mx-1.5 text-zinc-400">|</span>
              <span>Session: <strong>2026–2027</strong></span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: TAX INVOICE & TITLE RIBBON ── */}
        <div className={`${currentCopy.ribbonBg} text-white px-3.5 py-1.5 rounded-lg flex justify-between items-center text-xs font-bold tracking-wider uppercase print:py-1 relative z-10 transition-colors`}>
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-amber-400" />
            <span className="text-[11px] print:text-[10px]">Official Fee Receipt &amp; Tax Invoice Voucher</span>
          </div>
          <span className="font-mono text-amber-300 font-black text-xs print:text-[10.5px]">
            Voucher No: {payment.receiptNo}
          </span>
        </div>

        {/* ── SECTION 3: CANDIDATE & PROGRAM PARTICULARS (Ruled Grid) ── */}
        <div className="border border-zinc-800 rounded-lg overflow-hidden text-[9.5px] relative z-10">
          <div className={`bg-zinc-100 border-b border-zinc-800 px-3 py-1 font-bold text-[9px] ${currentCopy.textColor} uppercase tracking-wider`}>
            Student Identification &amp; Enrollment Particulars
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-300">
            <div className="p-2 space-y-0.5">
              <span className="text-[8px] font-bold text-zinc-600 uppercase block">Candidate Name:</span>
              <p className="font-bold text-[11px] text-zinc-950 uppercase">{payment.student.name}</p>
              <p className="text-[8px] font-mono text-zinc-600">Student ID: <strong>{payment.student.studentId}</strong></p>
            </div>

            <div className="p-2 space-y-0.5">
              <span className="text-[8px] font-bold text-zinc-600 uppercase block">Parent / Guardian:</span>
              <p className="font-bold text-[10.5px] text-zinc-900">{payment.student.parent?.name || "Guardian Record"}</p>
              <p className="text-[8px] text-zinc-600">Relation: {payment.student.parent?.relation || "Father"}</p>
            </div>

            <div className="p-2 space-y-0.5">
              <span className="text-[8px] font-bold text-zinc-600 uppercase block">Batch Allotment:</span>
              <p className="font-bold text-[10.5px] text-zinc-900">{batchName}</p>
              <p className="text-[8px] text-zinc-600 font-medium">{courseName}</p>
            </div>

            <div className="p-2 space-y-0.5 bg-zinc-50/50">
              <span className="text-[8px] font-bold text-zinc-600 uppercase block">Enrollment &amp; Contact:</span>
              <p className="font-mono font-bold text-[10px] text-zinc-900">Adm: {payment.student.admissionNo}</p>
              <p className="text-[8px] text-zinc-600">Mobile: {payment.student.phone || "—"}</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: ITEMIZED FEE ACCOUNT & REALIZATION TABLE ── */}
        <div className="border border-zinc-800 rounded-lg overflow-hidden text-[9.5px] relative z-10">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-100 border-b border-zinc-800 text-[8.5px] font-bold uppercase text-zinc-800">
              <tr>
                <th className="py-1.5 px-2.5 border-r border-zinc-300 w-10 text-center">Sr.</th>
                <th className="py-1.5 px-3 border-r border-zinc-300">Fee Component &amp; Particulars Description</th>
                <th className="py-1.5 px-2 border-r border-zinc-300 w-24 text-center font-mono">SAC / Code</th>
                <th className="py-1.5 px-3 border-r border-zinc-300 w-28 text-right">Applicable Plan</th>
                <th className="py-1.5 px-3 pr-3 text-right w-36">Amount Realized (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td className="py-2.5 px-2.5 text-center font-mono font-bold border-r border-zinc-200">01</td>
                <td className="py-2.5 px-3 border-r border-zinc-200">
                  <span className="font-bold text-zinc-950 block text-[10px]">
                    {payment.feePlan.title}
                  </span>
                  <span className="text-[8.5px] text-zinc-600 block">
                    {payment.installment
                      ? `Realizing Installment: ${payment.installment.title} (Scheduled Due: ${formatDate(payment.installment.dueDate)})`
                      : "Tuition, Pedagogy, Test Series & Comprehensive Study Material"}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-[8.5px] text-zinc-600 border-r border-zinc-200">
                  999293
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-zinc-700 border-r border-zinc-200">
                  {formatCurrency(payment.feePlan.finalAmount)}
                </td>
                <td className={`py-2.5 px-3 pr-3 text-right font-black text-sm ${currentCopy.textColor}`}>
                  {formatCurrency(payment.amount)}
                </td>
              </tr>

              {/* Statutory Subtotal */}
              <tr className="bg-zinc-50/70 border-t border-zinc-300 text-[8.5px]">
                <td colSpan={3} className="py-1.5 px-3 pl-4 text-zinc-600 italic">
                  *Education Coaching Services: Eligible for Central GST Exemption / SAC 999293
                </td>
                <td className="py-1.5 px-3 text-right text-zinc-700 font-semibold border-r border-zinc-300">
                  Transaction Subtotal:
                </td>
                <td className="py-1.5 px-3 pr-3 text-right font-bold text-zinc-900">
                  {formatCurrency(payment.amount)}
                </td>
              </tr>

              {/* Net Grand Realized Total */}
              <tr className="bg-zinc-100 border-t-2 border-zinc-900 font-black">
                <td colSpan={4} className={`py-2 px-3 pl-4 text-right uppercase tracking-wider text-[9.5px] ${currentCopy.textColor}`}>
                  Total Amount Realized in This Receipt (INR):
                </td>
                <td className={`py-2 px-3 pr-3 text-right text-base font-black ${currentCopy.textColor}`}>
                  {formatCurrency(payment.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── SECTION 5: AMOUNT IN WORDS & TRANSACTION MODE STRIP ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[9px] relative z-10">
          <div className="sm:col-span-2 border border-zinc-300 rounded-lg p-2.5 bg-zinc-50 flex items-center justify-between">
            <div>
              <span className="font-bold text-zinc-600 uppercase text-[8px]">Amount in Words: </span>
              <strong className="text-zinc-950 font-bold block text-[10px]">
                Indian Rupees {amountInWords}
              </strong>
            </div>
            <span className="font-mono font-bold text-[8px] text-zinc-600 uppercase px-2 py-0.5 border rounded-md bg-white shrink-0">
              INR (₹)
            </span>
          </div>

          <div className="border border-zinc-300 rounded-lg p-2.5 bg-zinc-50 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 text-[8px] uppercase font-bold">Payment Mode:</span>
              <span className="font-bold text-emerald-800 text-[9px] px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200">
                {payment.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-center font-mono text-[8px]">
              <span className="text-zinc-600">Ref / UTR:</span>
              <strong className="text-zinc-900 truncate max-w-[120px]">{payment.referenceNo || "CASH-COUNTER"}</strong>
            </div>
          </div>
        </div>

        {/* ── SECTION 6: CUMULATIVE STATEMENT OF ACCOUNT ── */}
        <div className="border-2 border-zinc-800 rounded-lg overflow-hidden relative z-10">
          <div className="bg-zinc-800 text-white px-3 py-1 text-[8.5px] font-bold uppercase tracking-wider flex justify-between">
            <span>Cumulative Student Financial Ledger Summary</span>
            <span>Statement as on {formattedDate}</span>
          </div>
          <div className="grid grid-cols-4 divide-x divide-zinc-300 text-center p-2 bg-zinc-50 text-[9px]">
            <div>
              <span className="text-[7.5px] text-zinc-600 uppercase font-bold block">Gross Program Fee</span>
              <span className="font-bold text-zinc-900 text-[10.5px]">{formatCurrency(payment.feePlan.finalAmount)}</span>
            </div>
            <div>
              <span className="text-[7.5px] text-zinc-600 uppercase font-bold block">Paid Prior to This</span>
              <span className="font-bold text-zinc-700 text-[10.5px]">
                {formatCurrency(Math.max(0, payment.feePlan.paidAmount - payment.amount))}
              </span>
            </div>
            <div className="bg-emerald-50">
              <span className="text-[7.5px] text-emerald-800 uppercase font-bold block">Total Paid to Date</span>
              <span className="font-black text-emerald-700 text-[11px]">
                {formatCurrency(payment.feePlan.paidAmount)}
              </span>
            </div>
            <div className={payment.feePlan.balanceAmount > 0 ? "bg-amber-50" : "bg-emerald-50"}>
              <span className="text-[7.5px] text-zinc-700 uppercase font-bold block">Net Outstanding Due</span>
              <span className={`font-black text-[11px] ${payment.feePlan.balanceAmount > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                {payment.feePlan.balanceAmount > 0 ? formatCurrency(payment.feePlan.balanceAmount) : "NIL (FULLY CLEARED)"}
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 7: LEGAL DECLARATION & AUTHORIZED AUTHENTICATION ── */}
        <div className="grid grid-cols-12 gap-3 pt-2.5 items-center border-t border-zinc-300 print:pt-1 relative z-10">
          <div className="col-span-5 text-[7.5px] text-zinc-600 leading-tight space-y-1">
            <p className="font-bold text-zinc-900 uppercase text-[8px] tracking-wide">Terms &amp; Official Declarations:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-[7px] text-zinc-600">
              <li>Fees once deposited are strictly non-refundable and non-transferable under any circumstances.</li>
              <li>Cheque/draft realizations are subject to final bank clearance and realization.</li>
              <li>Always quote this voucher number for academic verification, library, and identity renewals.</li>
              <li>All claims and disputes are subject to New Delhi statutory jurisdiction only.</li>
            </ol>
          </div>

          <div className="col-span-3 flex justify-center items-center">
            <OfficialAccountsSeal receiptDate={formattedDate} color={currentCopy.themeColor} />
          </div>

          <div className="col-span-4 flex flex-col items-end text-right space-y-1">
            <SecurityQrCode receiptNo={payment.receiptNo} studentId={payment.student.studentId} color={currentCopy.themeColor} />
            <div className="pt-1 w-full flex justify-end">
              <DigitizedSignature name={payment.collectedBy} color={currentCopy.themeColor} />
            </div>
          </div>
        </div>

        {/* Bottom Micro-Security Border */}
        <div className="border-t border-dashed border-zinc-400 pt-1 flex justify-between items-center text-[7px] font-mono text-zinc-500 uppercase relative z-10">
          <span>Official System Document • {instName} Central ERP</span>
          <span>Security Hash: SHA256-FL-{payment.receiptNo.replace(/[^0-9]/g, "")}-DEL</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}
