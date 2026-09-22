import { notFound } from "next/navigation";
import { getBatchById, getTeachers, getSubjects } from "@/server/actions/academics";
import { getSession } from "@/lib/auth";
import { BatchDetailView } from "@/components/academics/batch-detail-view";

export const dynamic = "force-dynamic";

interface BatchPageProps {
  params: { id: string };
}

export default async function BatchDetailPage({ params }: BatchPageProps) {
  const [batch, teachers, subjects, session] = await Promise.all([
    getBatchById(params.id),
    getTeachers(),
    getSubjects(),
    getSession(),
  ]);

  if (!batch) {
    notFound();
  }

  return (
    <BatchDetailView
      batch={batch}
      allTeachers={teachers}
      allSubjects={subjects}
      userRole={session?.role || "ADMIN"}
    />
  );
}

