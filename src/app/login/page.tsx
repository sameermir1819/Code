import { db } from "@/lib/db";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Fetch institute branding server-side — logo shows even before JS loads
  const institute = await db.institute.findFirst({
    select: { name: true, logoUrl: true, tagline: true },
  });

  return (
    <LoginForm
      logoUrl={institute?.logoUrl ?? null}
      instituteName={institute?.name ?? "Futurex Learning"}
      tagline={institute?.tagline ?? "Premier Institute Management & Academic Portal"}
    />
  );
}
