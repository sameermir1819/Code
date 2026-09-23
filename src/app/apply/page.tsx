import React from "react";
import Link from "next/link";
import { getPublicAdmissionData } from "@/server/actions/leads";
import { AdmissionApplicationForm } from "@/components/public/admission-application-form";
import { GraduationCap, ArrowLeft, ShieldCheck, Phone, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Online Admission Application 2026-2027 - Futurex Learning",
  description:
    "Apply for admissions in NEET, JEE, Foundation and competitive batches. Direct admission counseling and seat reservation.",
};

export default async function ApplyPage() {
  const { institute, courses } = await getPublicAdmissionData();

  return (
    <div className="min-h-screen bg-[#070b14] text-zinc-100 relative selection:bg-indigo-500 selection:text-white pb-20">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-10 -right-40 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070b14]/80 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/30">
              <div className="w-full h-full rounded-[10px] bg-[#090e1a] flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight block">
                {institute?.name || "Futurex Learning"}
              </span>
              <span className="text-[10px] text-zinc-400 block -mt-0.5">
                Admissions &amp; Academic Center
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-all"
            >
              Student / Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <AdmissionApplicationForm institute={institute} courses={courses} />
      </main>

      {/* Footer Branding */}
      <footer className="mt-16 text-center text-xs text-zinc-500 space-y-1">
        <p>© {new Date().getFullYear()} {institute?.name || "Futurex Learning"}. All Rights Reserved.</p>
        <p className="text-[11px] text-zinc-600">
          Official Admissions Portal &amp; Telecalling CRM Engine
        </p>
      </footer>
    </div>
  );
}
