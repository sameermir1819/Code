import { requireStaffPermission } from "@/lib/auth";
import { authorizedCampusId } from "@/lib/campus-scope";
import React from "react";
import { requireAuth, getEffectivePermissions } from "@/lib/auth";
import { getTestSeriesList } from "@/server/actions/test-series";
import { db } from "@/lib/db";
import { getActiveCampusId } from "@/server/actions/campus";
import { TestSeriesClient } from "./test-series-client";

export const metadata = {
  title: "Offline Test Series Management - Futurex Learning",
  description: "Offline Test Series Programs, One-Time Fee Registration, Hall Ticket Slips & Results Ranking",
};

export default async function TestSeriesPage() {
  const actor = await requireStaffPermission("test-series.view");
  const permissions = await getEffectivePermissions(actor);
  await requireAuth();
  const campusId = authorizedCampusId(actor, await getActiveCampusId());

  const [testSeriesData, enrolledStudents] = await Promise.all([
    getTestSeriesList(),
    permissions.includes("students.view") ? db.student.findMany({
      where: { status: "ACTIVE", instituteId: campusId },
      select: {
        id: true,
        name: true,
        studentId: true,
        admissionNo: true,
        gradeClass: true,
        phone: true,
      },
      orderBy: { name: "asc" },
    }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <TestSeriesClient
        seriesList={testSeriesData.seriesList as any}
        stats={testSeriesData.stats}
        enrolledStudents={enrolledStudents}
      />
    </div>
  );
}
