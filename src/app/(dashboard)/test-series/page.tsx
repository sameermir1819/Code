import React from "react";
import { requireAuth } from "@/lib/auth";
import { getTestSeriesList } from "@/server/actions/test-series";
import { db } from "@/lib/db";
import { TestSeriesClient } from "./test-series-client";

export const metadata = {
  title: "Offline Test Series Management - Futurex Learning",
  description: "Offline Test Series Programs, One-Time Fee Registration, Hall Ticket Slips & Results Ranking",
};

export default async function TestSeriesPage() {
  await requireAuth();

  const [testSeriesData, enrolledStudents] = await Promise.all([
    getTestSeriesList(),
    db.student.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        studentId: true,
        admissionNo: true,
        gradeClass: true,
        phone: true,
      },
      orderBy: { name: "asc" },
    }),
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

