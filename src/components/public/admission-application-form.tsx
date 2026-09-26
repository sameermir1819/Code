"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { submitPublicAdmissionEnquiry } from "@/server/actions/leads";
import {
  GraduationCap,
  Sparkles,
  Phone,
  User,
  BookOpen,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Send,
  Building2,
  Clock,
  MessageCircle,
  HelpCircle,
} from "lucide-react";

interface BatchOption {
  id: string;
  instituteId: string;
  name: string;
  code: string;
  capacity: number;
}

interface TestSeriesOption {
  id: string;
  instituteId: string;
  title: string;
  code: string;
  targetExam: string;
  fee: number;
}

interface InstituteInfo {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  logoUrl?: string | null;
}

interface CampusItem {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  phone?: string | null;
}

interface AdmissionApplicationFormProps {
  institute: InstituteInfo | null;
  campuses: CampusItem[];
  batches: BatchOption[];
  testSeries: TestSeriesOption[];
}

const CLASS_OPTIONS = [
  "Class 8th / Pre-Foundation",
  "Class 9th Foundation",
  "Class 10th Board + Olympiad",
  "Class 11th (Medical - NEET)",
  "Class 11th (Engineering - JEE)",
  "Class 12th (Board + Competitive)",
  "Dropper / Repeater (NEET Target)",
  "Dropper / Repeater (JEE Advanced Target)",
  "General / Other",
];

export function AdmissionApplicationForm({
  institute,
  campuses = [],
  batches = [],
  testSeries = [],
}: AdmissionApplicationFormProps) {
  const [isPending, startTransition] = useTransition();

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    campusId: campuses.length > 0 ? campuses[0].id : (institute?.id || ""),
    parentName: "",
    parentPhone: "",
    interestType: "ADMISSION" as "ADMISSION" | "TEST_SERIES",
    batchId: batches.find((batch) => batch.instituteId === (campuses[0]?.id || institute?.id))?.id || "",
    testSeriesId: "",
    currentClass: "Class 11th (Medical - NEET)",
    currentSchool: "",
    city: institute?.city || "Srinagar",
    notes: "",
  });
  const campusBatches = batches.filter((batch) => batch.instituteId === formData.campusId);
  const campusTestSeries = testSeries.filter((series) => series.instituteId === formData.campusId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedInterest = params.get("interest")?.trim().toLowerCase();
    const requestedCampus = params.get("campus")?.trim().toLowerCase();
    const matchedSeries = requestedInterest
      ? testSeries.find((series) => series.title.toLowerCase() === requestedInterest)
      : undefined;
    const matchedCampus = requestedCampus
      ? campuses.find((campus) =>
          campus.id.toLowerCase() === requestedCampus || campus.code.toLowerCase() === requestedCampus
        )
      : undefined;

    if (matchedSeries) {
      setFormData((current) => ({
        ...current,
        campusId: matchedSeries.instituteId,
        interestType: "TEST_SERIES",
        batchId: "",
        testSeriesId: matchedSeries.id,
      }));
    } else if (matchedCampus) {
      setFormData((current) => ({
        ...current,
        campusId: matchedCampus.id,
        batchId: batches.find((batch) => batch.instituteId === matchedCampus.id)?.id || "",
        testSeriesId: "",
      }));
    }
  }, [batches, campuses, testSeries]);

  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<{
    leadId: string;
    name: string;
    phone: string;
    course: string | null;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Please enter the student's full name.");
      return;
    }

    const cleanPhone = formData.phone.trim().replace(/[^\d+]/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number for communication.");
      return;
    }
    if (formData.interestType === "ADMISSION" && !formData.batchId) {
      setErrorMsg("Please select an available batch.");
      return;
    }
    if (formData.interestType === "TEST_SERIES" && !formData.testSeriesId) {
      setErrorMsg("Please select an available Test Series.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await submitPublicAdmissionEnquiry(formData);
        if (res.success && res.leadId) {
          setSuccessData({
            leadId: res.leadId,
            name: res.name || formData.name,
            phone: res.phone || formData.phone,
            course: res.course || "Selected program",
          });
        } else {
          setErrorMsg(res.error || "Failed to submit application. Please try again.");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
      }
    });
  };

  const instituteName = institute?.name || "Futurex Learning Institute";
  const helplinePhone = institute?.phone || "+91 98765 43210";
  const cleanHelpline = helplinePhone.replace(/[^\d]/g, "");

  // ── Success State Screen ──
  if (successData) {
    return (
      <div className="max-w-xl mx-auto p-6 sm:p-10 rounded-3xl bg-[#0e1424]/90 border border-white/10 backdrop-blur-2xl shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-block">
            Application Received
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Thank You, {successData.name.split(" ")[0]}!
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
            Your admission application for{" "}
            <strong className="text-indigo-400">{successData.course}</strong> has been
            registered into our Academic CRM.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span className="text-zinc-400">Application Reference ID:</span>
            <span className="font-mono font-bold text-white uppercase">
              {successData.leadId.slice(0, 10)}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span className="text-zinc-400">Registered Mobile:</span>
            <span className="font-mono text-zinc-200">{successData.phone}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-zinc-400">Next Action:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" /> Counselor Call within 2 Hours
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <a
            href={`https://wa.me/${cleanHelpline}?text=Hello%20${encodeURIComponent(instituteName)},%20I%20have%20submitted%20my%20online%20admission%20application%20(Ref:%20${successData.leadId.slice(0, 8)}).%20Please%20guide%20me%20regarding%20batch%20timings.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Connect on WhatsApp Helpline</span>
          </a>

          <button
            onClick={() => {
              setSuccessData(null);
              setFormData({
                name: "",
                phone: "",
                email: "",
                campusId: campuses.length > 0 ? campuses[0].id : "",
                parentName: "",
                parentPhone: "",
                interestType: "ADMISSION",
                batchId: batches.find((batch) => batch.instituteId === campuses[0]?.id)?.id || "",
                testSeriesId: "",
                currentClass: "Class 11th (Medical - NEET)",
                currentSchool: "",
                city: institute?.city || "Srinagar",
                notes: "",
              });
            }}
            className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 text-xs font-semibold border border-white/10 transition-all"
          >
            Submit Another Application
          </button>
        </div>

        <p className="text-[11px] text-zinc-400">
          Already an enrolled student?{" "}
          <Link href="/login" className="text-indigo-400 hover:underline font-semibold">
            Login to Student Portal
          </Link>
        </p>
      </div>
    );
  }

  // ── Standard Application Form ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-[#0d1322] to-purple-950/50 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Admissions Open 2026-2027</span>
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline-block">
              {instituteName}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            Apply for Admission
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
            Register your inquiry below. Our academic counselors will schedule a personalized
            counseling session, share fee scholarship options, and reserve your seat.
          </p>

          <div className="flex items-center gap-4 pt-1 text-xs text-zinc-400 flex-wrap">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Free Academic Counseling</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fast Callback within 2 Hours</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-xl space-y-6"
      >
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Student Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-white/5">
            <User className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              1. Student Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Student Full Name *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sameer Mir"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Student Mobile (WhatsApp) *</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="student@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Current School / College
              </label>
              <input
                type="text"
                placeholder="e.g. Burn Hall School / DPS"
                value={formData.currentSchool}
                onChange={(e) => setFormData({ ...formData, currentSchool: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Program & Campus of Interest */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-white/5">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              2. Target Program &amp; Campus Branch
            </h3>
          </div>

          <div className="space-y-3">
            {/* Campus Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Preferred Campus / Branch *</span>
              </label>
              <select
                value={formData.campusId}
                onChange={(e) => {
                  const campusId = e.target.value;
                  setFormData({
                    ...formData,
                    campusId,
                    batchId: batches.find((batch) => batch.instituteId === campusId)?.id || "",
                    testSeriesId: testSeries.find((series) => series.instituteId === campusId)?.id || "",
                  });
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#111625] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
              >
                {campuses.length > 0 ? (
                  campuses.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#111625] text-white">
                      📍 {c.city || c.name} ({c.code}) — {c.name}
                    </option>
                  ))
                ) : (
                  <option value="" className="bg-[#111625] text-white">
                    📍 Main Campus
                  </option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Application Type *
                </label>
                <select
                  value={formData.interestType}
                  onChange={(e) => {
                    const interestType = e.target.value as "ADMISSION" | "TEST_SERIES";
                    setFormData({
                      ...formData,
                      interestType,
                      batchId: interestType === "ADMISSION" ? (formData.batchId || campusBatches[0]?.id || "") : "",
                      testSeriesId: interestType === "TEST_SERIES" ? (formData.testSeriesId || campusTestSeries[0]?.id || "") : "",
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111625] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="ADMISSION">Regular Batch Admission</option>
                  <option value="TEST_SERIES">Test Series (External Candidate)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  {formData.interestType === "TEST_SERIES" ? "Test Series *" : "Batch *"}
                </label>
                {formData.interestType === "TEST_SERIES" ? (
                  <select
                    required
                    value={formData.testSeriesId}
                    onChange={(e) => setFormData({ ...formData, testSeriesId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#111625] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">Select Test Series</option>
                    {campusTestSeries.map((series) => (
                      <option key={series.id} value={series.id} className="bg-[#111625] text-white">
                        {series.title} ({series.code}) — ₹{Number(series.fee).toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    required
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#111625] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">Select Batch</option>
                    {campusBatches.map((batch) => (
                      <option key={batch.id} value={batch.id} className="bg-[#111625] text-white">
                        {batch.name} ({batch.code})
                      </option>
                    ))}
                  </select>
                )}
                {(formData.interestType === "TEST_SERIES" ? campusTestSeries : campusBatches).length === 0 && (
                  <p className="text-[11px] text-amber-400">No active option is available at this campus.</p>
                )}
              </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-300">
                Current Class / Target Stage *
              </label>
              <select
                value={formData.currentClass}
                onChange={(e) => setFormData({ ...formData, currentClass: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#111625] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                {CLASS_OPTIONS.map((cls) => (
                  <option key={cls} value={cls} className="bg-[#111625] text-white">
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

        {/* Section 3: Parent & Contact Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-white/5">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              3. Parent / Guardian & Location
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Father / Guardian Name
              </label>
              <input
                type="text"
                placeholder="Parent's Name"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Parent Contact Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-300">
                City / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Srinagar, Anantnag, Baramulla"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Query Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Any Specific Questions / Scholarship Queries? (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Tell us about your batch timing preference, scholarship query, or hostel requirements..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.99]"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Application...</span>
              </div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {formData.interestType === "TEST_SERIES"
                    ? "Submit Test Series Enquiry"
                    : "Submit Batch Admission Application"}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5 flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-emerald-400" />
            <span>Admissions Helpline: {helplinePhone}</span>
          </span>
          <Link href="/login" className="text-indigo-400 hover:underline">
            Already enrolled? Student Login →
          </Link>
        </div>
      </form>
    </div>
  );
}

