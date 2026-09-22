import React from "react";
import { getStudentPortalTestSeries } from "@/server/actions/test-series";
import { PortalTestSeriesClient } from "./portal-test-series-client";

export const metadata = {
  title: "My Offline Test Series - Student Portal",
  description: "Offline Test Series Schedule, OMR Results, Roll Number Slips & Answer Keys",
};

export default async function StudentTestSeriesPage() {
  const data = await getStudentPortalTestSeries();

  return (
    <div className="space-y-6">
      <PortalTestSeriesClient
        registeredSeries={data.registeredSeries as any}
        availableSeries={data.availableSeries as any}
        student={data.student}
      />
    </div>
  );
}

