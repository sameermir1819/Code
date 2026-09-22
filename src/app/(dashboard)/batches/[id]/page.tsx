import { redirect } from "next/navigation";

interface BatchPageProps {
  params: { id: string };
}

export default function BatchDetailRedirect({ params }: BatchPageProps) {
  redirect(`/dashboard/batches/${params.id}`);
}
