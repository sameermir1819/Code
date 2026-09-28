import { notFound } from "next/navigation";
import { getReceiptDetails } from "@/server/actions/finance";
import { OfficialReceiptView } from "@/components/finance/official-receipt-view";
import { createReceiptVerificationPath } from "@/lib/receipt-verification";

export const dynamic = "force-dynamic";

export default async function StudentReceiptPage({
  params,
}: {
  params: Promise<{ receiptNo: string }>;
}) {
  const { receiptNo } = await params;

  try {
    const { payment, institute } = await getReceiptDetails(decodeURIComponent(receiptNo));
    return (
      <OfficialReceiptView
        payment={payment as unknown as Parameters<typeof OfficialReceiptView>[0]["payment"]}
        institute={institute}
        verificationPath={createReceiptVerificationPath(payment.receiptNo, payment.student.studentId)}
        backHref="/portal/fees"
        backLabel="Back to My Fee Ledger"
      />
    );
  } catch {
    notFound();
  }
}
