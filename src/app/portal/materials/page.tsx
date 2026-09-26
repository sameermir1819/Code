import React from "react";
import { getStudentStudyMaterials } from "@/server/actions/portal";
import {
  BookOpen,
  FileText,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Video,
  File,
  Calendar,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Study Materials - Student Portal",
};

export default async function StudentMaterialsPage() {
  const res = await getStudentStudyMaterials();

  if (!res.success || !res.student) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-3 max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Materials Unavailable</h2>
        <p className="text-xs text-zinc-400">
          No linked student profile found for your account.
        </p>
      </div>
    );
  }

  const materials = res.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Study Materials &amp; Lecture Notes</h1>
          <p className="text-xs text-zinc-400">
            Downloadable PDFs, assignments, and test prep notes curated for your enrolled batches.
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-400 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 shrink-0">
          {materials.length} Resources Available
        </span>
      </div>

      {materials.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-zinc-500 text-xs">
          No study documents or notes have been assigned to your batch yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat) => {
            const dateStr = new Date(mat.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={mat.id}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                      {mat.fileType}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{mat.fileSize}</span>
                  </div>

                  <h3 className="font-bold text-white text-sm leading-snug group-hover:text-primary transition-colors">
                    {mat.title}
                  </h3>

                  {mat.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] text-zinc-400">
                    {mat.subject && (
                      <div className="flex items-center justify-between">
                        <span>Subject:</span>
                        <span className="text-zinc-300 font-medium">{mat.subject.name}</span>
                      </div>
                    )}
                    {mat.batch && (
                      <div className="flex items-center justify-between">
                        <span>Batch:</span>
                        <a
                          href={`/portal/batches/${mat.batch.id}`}
                          className="text-indigo-400 hover:underline font-medium"
                        >
                          {mat.batch.name}
                        </a>
                      </div>
                    )}
                    {mat.uploadedBy && (
                      <div className="flex items-center justify-between">
                        <span>Instructor:</span>
                        <span className="text-zinc-300 font-medium">{mat.uploadedBy.name}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-zinc-500">
                      <span>Uploaded:</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={mat.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-primary text-zinc-300 hover:text-white border border-white/10 hover:border-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
