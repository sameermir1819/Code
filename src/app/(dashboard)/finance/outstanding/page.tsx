import React from "react";
import { getOutstandingFeesReport } from "@/server/actions/finance";
import { getAllCampuses } from "@/server/actions/campus";
import { getCampusDisplayName } from "@/lib/campus-label";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  MessageSquare,
  AlertTriangle,
  Users,
  Calendar,
  TrendingDown,
  ArrowDownLeft,
} from "lucide-react";
import Link from "next/link";
import { OutstandingToolbar } from "@/components/finance/outstanding-toolbar";

export const dynamic = "force-dynamic";

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-black tracking-tight">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function OutstandingFeesPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const campusId = resolvedSearchParams?.campusId || "GLOBAL";
  const [records, campuses] = await Promise.all([
    getOutstandingFeesReport({ campusId }),
    getAllCampuses(),
  ]);

  const totalOutstanding = records.reduce((acc, r) => acc + r.remainingAmount, 0);
  const overdueCount = records.filter((r) => r.isOverdue).length;
  const dueThisWeek = records.filter((r) => r.isDueThisWeek).length;
  const studentsAffected = new Set(records.map((r) => r.studentId)).size;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outstanding Dues &amp; Reminders</h1>
          <p className="text-sm text-muted-foreground">
            Track unpaid fee installments per student and dispatch WhatsApp reminders to guardians.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form method="get" className="flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 shadow-xs">
            <label htmlFor="outstanding-location" className="text-xs font-semibold text-muted-foreground">
              Location
            </label>
            <select
              id="outstanding-location"
              name="campusId"
              defaultValue={campusId}
              className="min-w-28 bg-transparent py-1 text-xs font-semibold text-foreground outline-none"
            >
              <option value="GLOBAL">Global</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {getCampusDisplayName(campus)}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-white">
              Apply
            </button>
          </form>
          <OutstandingToolbar records={records} />
          <Link
            href="/finance/payments"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-background text-xs font-semibold hover:bg-muted shadow-xs transition-colors"
          >
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
            <span>Student Fee Ledger</span>
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={TrendingDown}
          color="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
          sub="All pending dues"
        />
        <KpiCard
          label="Overdue Installments"
          value={overdueCount}
          icon={AlertCircle}
          color="bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400"
          sub="Past scheduled due date"
        />
        <KpiCard
          label="Due This Week"
          value={dueThisWeek}
          icon={Calendar}
          color="bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400"
          sub="Next 7 days payable"
        />
        <KpiCard
          label="Students Affected"
          value={studentsAffected}
          icon={Users}
          color="bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"
          sub="Unique student accounts"
        />
      </div>

      {/* ── Outstanding Table with Individual Student Status ─────────────────── */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base font-semibold">
            Pending Installments ({records.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Student fee installments with balance due past or approaching scheduled dates
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                  <th className="p-3 pl-4">Student</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Batch &amp; Course</th>
                  <th className="p-3">Student Fee Status (Total · Deposit · Pending)</th>
                  <th className="p-3">Installment</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Days Overdue</th>
                  <th className="p-3">Amount Due</th>
                  <th className="p-3 pr-4 text-right">WhatsApp Reminder</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      No outstanding fees recorded. All student dues are cleared! 🎉
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const cleanPhone = (r.parentPhone || r.studentPhone || "").replace(
                      /[^0-9]/g,
                      ""
                    );
                    const messageText = `Dear ${r.parentName || "Parent"}, this is a reminder from Futurex Learning. The fee installment of ${formatCurrency(
                      r.remainingAmount
                    )} for your ward ${r.studentName} (${r.batchName}) was due on ${formatDate(
                      r.dueDate
                    )}. Kindly clear the pending balance at the earliest. For queries, please contact the accounts desk. Thank you.`;

                    // Row tint based on overdue status
                    const rowClass = r.isOverdue
                      ? "bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20"
                      : r.isDueThisWeek
                      ? "bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      : "hover:bg-muted/20";

                    return (
                      <tr key={r.installmentId} className={`transition-colors ${rowClass}`}>
                        <td className="p-3 pl-4">
                          <Link
                            href={`/students/${r.studentId}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors block"
                          >
                            {r.studentName}
                          </Link>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {r.studentCode} • Guardian: {r.parentName || "—"}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{r.locationName}</td>
                        <td className="p-3">
                          <span className="font-medium text-foreground block">{r.batchName}</span>
                          <span className="text-[11px] text-muted-foreground">{r.courseName}</span>
                        </td>

                        {/* Student Fee Status: Total, Deposit, Pending in ONE PLACE */}
                        <td className="p-3">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 border text-[11px]">
                            <span>
                              Total: <strong className="text-foreground">{formatCurrency(r.planTotalFees)}</strong>
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                              Deposit: <strong>{formatCurrency(r.planDeposited)}</strong>
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                              Pending: <strong>{formatCurrency(r.planPending)}</strong>
                            </span>
                          </div>
                        </td>

                        <td className="p-3 text-muted-foreground">
                          {r.installmentTitle}
                          {r.isOverdue && (
                            <Badge
                              variant="destructive"
                              className="ml-2 text-[9px] px-1.5 py-0 align-middle"
                            >
                              OVERDUE
                            </Badge>
                          )}
                          {r.isDueThisWeek && !r.isOverdue && (
                            <Badge className="ml-2 text-[9px] px-1.5 py-0 align-middle bg-amber-500 hover:bg-amber-500">
                              DUE SOON
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">{formatDate(r.dueDate)}</td>
                        <td className="p-3">
                          {r.daysOverdue > 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                              <AlertTriangle className="h-3 w-3" />
                              {r.daysOverdue}d
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-amber-600 dark:text-amber-400">
                          {formatCurrency(r.remainingAmount)}
                        </td>
                        <td className="p-3 pr-4 text-right">
                          {cleanPhone ? (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                messageText
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Remind</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">No phone</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
