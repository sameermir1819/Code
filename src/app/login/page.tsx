import { db } from "@/lib/db";
import { LoginForm } from "./login-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "STUDENT" ? "/portal" : "/dashboard");
  // Fetch live institute branding server-side on every request
  const institute = await db.institute.findFirst({
    select: { name: true, logoUrl: true, tagline: true, code: true, city: true },
  });

  return (
    <LoginForm
      logoUrl={institute?.logoUrl || "/logo.png"}
      instituteName={institute?.name || "Futurex Learning"}
      tagline={institute?.tagline || "Premier Institute Management & Academic Portal"}
      instituteCode={institute?.code || "FL-CAMPUS-01"}
      city={institute?.city || "Srinagar"}
    />
  );
}
