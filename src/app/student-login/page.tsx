import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function StudentLoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "STUDENT" ? "/portal" : "/dashboard");
  redirect("/");
}
