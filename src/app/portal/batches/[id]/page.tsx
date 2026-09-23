import React from "react";
import { notFound } from "next/navigation";
import { getStudentBatchDetails } from "@/server/actions/portal";
import { PortalBatchDetail } from "@/components/portal/portal-batch-detail";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Batch Schedule & Study Materials - Student Portal",
};

interface BatchPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function StudentBatchDetailPage({ params }: BatchPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const batchId = resolvedParams.id;

  const res = await getStudentBatchDetails(batchId);

  if (!res.success || !res.data?.batch) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-4 max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Batch Not Found</h2>
        <p className="text-xs text-zinc-400">
          {res.error || "The requested batch could not be found or you are not enrolled in it."}
        </p>
        <Link
          href="/portal"
          className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs"
        >
          Return to Portal Overview
        </Link>
      </div>
    );
  }

  return <PortalBatchDetail batch={res.data.batch as any} />;
}
