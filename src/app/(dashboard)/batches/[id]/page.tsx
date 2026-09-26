import { redirect } from "next/navigation";

interface BatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function BatchDetailRedirect({ params }: BatchPageProps) {
  const { id } = await params;
  redirect(`/dashboard/batches/${id}`);
}
