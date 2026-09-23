import React from "react";
import { getStudentBatches } from "@/server/actions/portal";
import { PortalBatchesView } from "@/components/portal/portal-batches-view";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Batches & Timetable - Student Portal",
};

export default async function StudentBatchesPage() {
  const res = await getStudentBatches();

  if (!res.success || !res.student) {
    return (
      <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-center space-y-4 max-w-md mx-auto my-12 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Batches Unavailable</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {res.error || "No student record linked to your account."}
        </p>
        <Link
          href="/portal"
          className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all"
        >
          Return to Portal Overview
        </Link>
      </div>
    );
  }

  const enrollments = res.data?.enrollments || [];

  return <PortalBatchesView enrollments={enrollments as any} />;
}
