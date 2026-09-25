import React from "react";
import { redirect } from "next/navigation";
import { getSession, getEffectivePermissions } from "@/lib/auth";
import { resolveCurrentStudent } from "@/server/actions/portal";
import { getActiveCampus } from "@/server/actions/campus";
import { PortalShell } from "@/components/portal/portal-shell";
import { PermissionProvider } from "@/components/layout/permission-provider";

export const metadata = {
  title: "Student Portal - Futurex Learning",
  description: "Student Academic, Attendance & Examination Self-Service Portal",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/student-login");
  }

  const [{ student }, activeCampus] = await Promise.all([
    resolveCurrentStudent(),
    getActiveCampus(),
  ]);

  const instituteName = activeCampus?.name || student?.institute?.name || "Futurex Learning";
  const instituteLogoUrl = activeCampus?.logoUrl || student?.institute?.logoUrl || "/logo.png";
  const isPreview = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const permissions = await getEffectivePermissions(session);

  return (
    <PortalShell
      permissions={permissions}
      student={
        student
          ? {
              id: student.id,
              name: student.name,
              studentId: student.studentId,
              admissionNo: student.admissionNo,
              email: student.email,
              photoUrl: student.photoUrl,
              gradeClass: student.gradeClass,
            }
          : null
      }
      instituteName={instituteName}
      instituteLogoUrl={instituteLogoUrl}
      isPreview={isPreview}
    >
      <PermissionProvider permissions={permissions}>{children}</PermissionProvider>
    </PortalShell>
  );
}
