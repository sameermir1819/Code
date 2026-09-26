import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Award, CheckCircle2, Search, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "External Candidate Results - Futurex Learning",
  description: "View published offline test-series results using your roll and receipt numbers.",
};

export default async function ExternalResultsPage({
  searchParams,
}: {
  searchParams?: Promise<{ rollNumber?: string; receiptNo?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rollNumber = resolvedSearchParams?.rollNumber?.trim().toUpperCase() || "";
  const receiptNo = resolvedSearchParams?.receiptNo?.trim().toUpperCase() || "";
  const searched = Boolean(rollNumber && receiptNo);

  const registration = searched
    ? await db.testSeriesRegistration.findFirst({
        where: {
          rollNumber,
          receiptNo,
          studentId: null,
          status: "CONFIRMED",
        },
        include: {
          testSeries: { select: { title: true, code: true, targetExam: true } },
          results: {
            where: { testSeriesExam: { status: "RESULTS_PUBLISHED" } },
            include: { testSeriesExam: true },
            orderBy: { testSeriesExam: { examDate: "desc" } },
          },
        },
      })
    : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">
            ← Futurex Learning
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure Result Lookup
          </span>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-2xl bg-indigo-500/15 p-3 text-indigo-300"><Award className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">External Candidate Results</h1>
              <p className="mt-1 text-sm text-slate-400">Enter both numbers printed on your official test-series slip.</p>
            </div>
          </div>

          <form method="get" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input name="rollNumber" defaultValue={rollNumber} required placeholder="Roll No. (TS-...)" className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm uppercase outline-none focus:border-indigo-400" />
            <input name="receiptNo" defaultValue={receiptNo} required placeholder="Receipt No. (TS-REC-...)" className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm uppercase outline-none focus:border-indigo-400" />
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold hover:bg-indigo-400">
              <Search className="h-4 w-4" /> View Result
            </button>
          </form>
        </section>

        {searched && !registration && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-200">
            No external registration matched these details. Check the Roll Number and Receipt Number on your slip.
          </div>
        )}

        {registration && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">{registration.testSeries.targetExam}</p>
              <h2 className="mt-1 text-xl font-bold">{registration.externalStudentName}</h2>
              <p className="mt-1 text-sm text-slate-400">{registration.testSeries.title} · {registration.rollNumber}</p>
            </div>

            {registration.results.length === 0 ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-200">
                Result has not been published yet. Please check again after the institute publishes it.
              </div>
            ) : registration.results.map((result) => (
              <article key={result.id} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <h3 className="font-bold">{result.testSeriesExam.title}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(result.testSeriesExam.examDate)} · {result.attendance}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-black text-indigo-300">{result.marksObtained}/{result.maxMarks}</p>
                    <p className="text-xs text-slate-400">{result.percentage}%</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ResultStat label="Rank" value={result.rank ? `#${result.rank}` : "—"} />
                  <ResultStat label="Percentile" value={result.percentile != null ? `${result.percentile}` : "—"} />
                  <ResultStat label="Correct" value={result.correctCount ?? "—"} />
                  <ResultStat label="Incorrect" value={result.incorrectCount ?? "—"} />
                </div>
                {result.remarks && <p className="mt-4 rounded-xl bg-black/20 p-3 text-xs text-slate-300">Remarks: {result.remarks}</p>}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function ResultStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-black/20 p-3"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}
