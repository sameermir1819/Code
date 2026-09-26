import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, Calendar, CreditCard, MapPin, Phone, UserRound } from "lucide-react";
import { getExternalCandidateProfile } from "@/server/actions/test-series";

export const dynamic = "force-dynamic";

export default async function ExternalCandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let candidate: Awaited<ReturnType<typeof getExternalCandidateProfile>>;
  try {
    candidate = await getExternalCandidateProfile(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/test-series" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Test Series
      </Link>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="h-7 w-7" />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{candidate.name}</h1>
                <span className="rounded-full border bg-muted px-2.5 py-0.5 font-mono text-xs">{candidate.candidateNo}</span>
              </div>
              <p className="text-sm text-muted-foreground">External Test Series Candidate · {candidate.institute.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-3"><span className="block text-xs text-muted-foreground">Registrations</span><strong>{candidate.registrations.length}</strong></div>
            <div className="rounded-xl border bg-muted/30 p-3"><span className="block text-xs text-muted-foreground">Results</span><strong>{candidate.registrations.reduce((sum, item) => sum + item.results.length, 0)}</strong></div>
            <div className="rounded-xl border bg-muted/30 p-3"><span className="block text-xs text-muted-foreground">Location</span><strong>{candidate.institute.code}</strong></div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><span>{candidate.phone}</span></div>
          <div>{candidate.email || "Email not recorded"}</div>
          <div>{candidate.parentName || "Parent not recorded"}{candidate.parentPhone ? ` · ${candidate.parentPhone}` : ""}</div>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span>{candidate.city || candidate.institute.city || "Location not recorded"}</span></div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Test Series History</h2>
        {candidate.registrations.map((registration) => (
          <div key={registration.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">{registration.testSeries.title}</h3>
                <p className="text-xs text-muted-foreground">{registration.testSeries.code} · Roll {registration.rollNumber}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border px-2.5 py-1"><CreditCard className="mr-1 inline h-3 w-3" />{registration.paymentStatus}</span>
                <span className="rounded-full border px-2.5 py-1">₹{registration.feeAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
            {registration.results.length > 0 && (
              <div className="mt-4 grid gap-2 border-t pt-4 md:grid-cols-2">
                {registration.results.map((result) => (
                  <div key={result.id} className="rounded-xl bg-muted/40 p-3 text-sm">
                    <div className="flex items-center justify-between"><strong>{result.testSeriesExam.title}</strong><Award className="h-4 w-4 text-amber-500" /></div>
                    <p className="mt-1 text-xs text-muted-foreground"><Calendar className="mr-1 inline h-3 w-3" />{new Date(result.testSeriesExam.examDate).toLocaleDateString("en-IN")}</p>
                    <p className="mt-2 font-semibold">{result.marksObtained}/{result.maxMarks} · {result.percentage}% · Rank {result.rank || "—"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Correct {result.correctCount ?? "—"} · Wrong {result.incorrectCount ?? "—"} · Unattempted {result.unattemptedCount ?? "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
