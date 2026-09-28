import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { readReceiptVerificationToken } from "@/lib/receipt-verification";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verify Fee Receipt",
  robots: { index: false, follow: false },
};

export default async function VerifyReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const payload = readReceiptVerificationToken(token);
  const payment = payload
    ? await db.payment.findFirst({
        where: { receiptNo: payload.receiptNo, student: { studentId: payload.studentId } },
        select: {
          receiptNo: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          status: true,
          student: { select: { name: true, studentId: true, institute: { select: { name: true } } } },
        },
      })
    : null;

  const verified = Boolean(payment);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${verified ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
          {verified ? <CheckCircle2 className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold">
          {verified ? "Receipt Verified" : "Invalid Receipt QR"}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          {verified ? "This fee receipt matches an official payment record." : "This QR code is invalid, altered, or no longer matches a payment record."}
        </p>

        {payment && (
          <div className="mt-6 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-sm">
            <Detail label="Institute" value={payment.student.institute.name} />
            <Detail label="Receipt Number" value={payment.receiptNo} mono />
            <Detail label="Student" value={payment.student.name} />
            <Detail label="Roll Number" value={payment.student.studentId} mono />
            <Detail label="Amount" value={formatCurrency(payment.amount)} />
            <Detail label="Payment Date" value={formatDate(payment.paymentDate)} />
            <Detail label="Payment Method" value={payment.paymentMethod} />
            <Detail label="Status" value={payment.status} />
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Signed verification by Futurex Learning ERP
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <strong className={`text-right text-white ${mono ? "font-mono" : ""}`}>{value}</strong>
    </div>
  );
}
