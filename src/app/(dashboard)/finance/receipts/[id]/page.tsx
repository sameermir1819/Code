import { getReceiptDetails } from "@/server/actions/finance";
import { OfficialReceiptView } from "@/components/finance/official-receipt-view";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptDetailPage({ params }: ReceiptPageProps) {
  const { id } = await params;

  try {
    const { payment, institute } = await getReceiptDetails(id);
    if (!payment) return notFound();

    return (
      <OfficialReceiptView
        payment={payment as unknown as Parameters<typeof OfficialReceiptView>[0]["payment"]}
        institute={institute}
      />
    );
  } catch {
    return notFound();
  }
}
