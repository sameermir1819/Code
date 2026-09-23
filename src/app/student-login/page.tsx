import React from "react";
import { getActiveCampus } from "@/server/actions/campus";
import { db } from "@/lib/db";
import { StudentPortalLanding } from "./student-portal-landing";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Portal & Admissions 2026 - Futurex Learning",
  description:
    "Official Student Academic Portal. Access timetables, study materials, exam scorecards, or apply online for new batch admissions.",
};

export default async function StudentLoginPage() {
  const [activeCampus, courses] = await Promise.all([
    getActiveCampus(),
    db.course.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        code: true,
        standardFee: true,
        duration: true,
      },
      orderBy: { name: "asc" },
      take: 10,
    }),
  ]);

  return (
    <StudentPortalLanding
      logoUrl={activeCampus?.logoUrl || "/logo.png"}
      instituteName={activeCampus?.name || "Futurex Learning"}
      tagline={
        activeCampus?.tagline ||
        "Premier Coaching Institute & Academic Management Operating System"
      }
      city={activeCampus?.city || "Srinagar"}
      phone={activeCampus?.phone || "+91 98765 43210"}
      email={activeCampus?.email || "admissions@futurexlearning.com"}
      courses={courses}
    />
  );
}
