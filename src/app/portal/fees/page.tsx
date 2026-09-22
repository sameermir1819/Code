import React from "react";
import { getStudentFeeLedger } from "@/server/actions/portal";
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Calendar,
  ShieldCheck,
  Download,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fees & Receipts - Student Portal",
};

export default async function StudentFeesPage() {
  const res = await getStudentFeeLedger();

  if (!res.success || !res.student || !res.data) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-3 max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Fee Ledgers Unavailable</h2>
        <p className="text-xs text-zinc-400">
          No fee plan has been assigned to your registration yet.
        </p>
      </div>
    );
  }

  const { feePlans, payments } = res.data;

  const totalFee = feePlans.reduce((sum, p) => sum + p.finalAmount, 0);
  const totalPaid = feePlans.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalDue = Math.max(0, totalFee - totalPaid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Fee Ledger &amp; Official Receipts</h1>
        <p className="text-xs text-zinc-400">
          Transparent accounting ledger, installment schedules, and payment receipts for{" "}
          {res.student.name}.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[11px] text-zinc-400 block font-medium">Total Course Fee</span>
          <span className="text-2xl sm:text-3xl font-black text-white block mt-0.5">
            ₹{totalFee.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-1">Net approved plan amount</span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[11px] text-emerald-300 block font-medium">Realized / Paid</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 block mt-0.5">
            ₹{totalPaid.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-emerald-300/80 block mt-1 font-medium">
            Acknowledged by Accounts
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[11px] text-amber-300 block font-medium">Remaining Due</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 block mt-0.5">
            ₹{totalDue.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-amber-300/80 block mt-1 font-medium">
            {totalDue === 0 ? "All Dues Cleared" : "Scheduled installments"}
          </span>
        </div>
      </div>

      {/* Fee Plans & Installment Breakdown */}
      {feePlans.map((plan) => (
        <div
          key={plan.id}
          className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{plan.title}</h3>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    plan.status === "PAID"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : plan.status === "PARTIAL"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {plan.status}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {plan.enrollment?.course?.name} • {plan.enrollment?.batch?.name}
              </p>
            </div>

            <div className="text-right text-xs text-zinc-400">
              <span>Gross: ₹{plan.totalAmount.toLocaleString("en-IN")}</span>
              {plan.discountAmount > 0 && (
                <span className="text-emerald-400 ml-2">
                  (Discount: ₹{plan.discountAmount.toLocaleString("en-IN")})
                </span>
              )}
            </div>
          </div>

          {/* Installment Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Installment Schedule
            </h4>

            {plan.installments.length === 0 ? (
              <p className="text-xs text-zinc-500">No installments configured.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {plan.installments.map((inst) => {
                  const dueDateStr = new Date(inst.dueDate).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={inst.id}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{inst.title}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            inst.status === "PAID"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : inst.status === "PARTIAL"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {inst.status}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-zinc-400">Amount:</span>
                        <span className="font-bold text-white">
                          ₹{inst.amount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due: {dueDateStr}
                        </span>
                        <span className="text-zinc-400">
                          Bal: ₹{inst.remainingAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Official Payment Receipts History */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Payment Receipts History
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {payments.length} Verified Receipts
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No payment transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Reference No</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => {
                  const payDateStr = new Date(p.paymentDate).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {p.receiptNo}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{payDateStr}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400 text-sm">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                        {p.referenceNo || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ACKNOWLEDGED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
