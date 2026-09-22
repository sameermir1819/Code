import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CAMPUS_GEOFENCE, calculateDistanceMeters } from "@/lib/geofence";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, latitude, longitude, accuracyMeters = 10 } = body;

    if (!studentId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters (studentId, latitude, longitude)." },
        { status: 400 }
      );
    }

    // Find student
    const student = await db.student.findFirst({
      where: {
        OR: [{ id: studentId }, { studentId: studentId }, { admissionNo: studentId }],
      },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { batch: true },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: `Student account "${studentId}" not found.` },
        { status: 404 }
      );
    }

    const activeBatch = student.enrollments[0]?.batch;
    if (!activeBatch) {
      return NextResponse.json(
        { success: false, message: `Student ${student.name} is not assigned to an active classroom batch.` },
        { status: 400 }
      );
    }

    // Calculate distance
    const distanceMeters = calculateDistanceMeters(
      Number(latitude),
      Number(longitude),
      CAMPUS_GEOFENCE.latitude,
      CAMPUS_GEOFENCE.longitude
    );

    const isInside = distanceMeters <= CAMPUS_GEOFENCE.radiusMeters;
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);

    const checkInTimeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    if (!isInside) {
      return NextResponse.json(
        {
          success: false,
          insideGeofence: false,
          distanceMeters,
          radiusMeters: CAMPUS_GEOFENCE.radiusMeters,
          message: `Check-in blocked. You are ${distanceMeters}m away from campus. You must be within ${CAMPUS_GEOFENCE.radiusMeters}m of Futurex Learning campus to mark attendance.`,
        },
        { status: 403 }
      );
    }

    // Upsert attendance
    const existing = await db.attendance.findFirst({
      where: {
        studentId: student.id,
        batchId: activeBatch.id,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    const remarks = `Mobile App Geo Check-in: ${distanceMeters}m from campus center (GPS accuracy ±${Math.round(accuracyMeters)}m)`;

    let record;
    if (existing) {
      record = await db.attendance.update({
        where: { id: existing.id },
        data: {
          status: "PRESENT",
          markedBy: "Student Mobile App (GPS)",
          remarks,
        },
      });
    } else {
      record = await db.attendance.create({
        data: {
          studentId: student.id,
          batchId: activeBatch.id,
          date: now,
          status: "PRESENT",
          markedBy: "Student Mobile App (GPS)",
          remarks,
        },
      });
    }

    return NextResponse.json({
      success: true,
      insideGeofence: true,
      distanceMeters,
      checkInTime: checkInTimeStr,
      message: `Attendance verified successfully! Welcome to Futurex Learning.`,
      student: {
        name: student.name,
        studentId: student.studentId,
        batchName: activeBatch.name,
      },
      recordId: record.id,
    });
  } catch (error: unknown) {
    console.error("Geo check-in API error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

