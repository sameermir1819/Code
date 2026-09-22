import React from "react";
import { getActiveCampus } from "@/server/actions/campus";
import { StudentLoginForm } from "./student-login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Portal Login - Futurex Learning",
  description: "Official Student Portal Authentication. Login with your Name_name and Student Code.",
};

export default async function StudentLoginPage() {
  const activeCampus = await getActiveCampus();

  return (
    <StudentLoginForm
      logoUrl={activeCampus?.logoUrl || "/logo.png"}
      instituteName={activeCampus?.name || "Futurex Learning"}
      tagline={activeCampus?.tagline || "Autonomous Coaching Institute Operating System"}
    />
  );
}
