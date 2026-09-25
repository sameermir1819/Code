"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { cache } from "react";

export interface CampusItem {
  id: string;
  name: string;
  code: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  tagline: string | null;
  _count?: {
    students: number;
    batches: number;
  };
}

/**
 * Fetch all registered campuses/branches (memoized per-request)
 */
const fetchCachedAllCampuses = cache(async (): Promise<CampusItem[]> => {
  try {
    const campuses = await db.institute.findMany({
      include: {
        _count: {
          select: {
            students: true,
            batches: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return campuses;
  } catch (err) {
    console.error("Failed to load campuses:", err);
    return [];
  }
});

export async function getAllCampuses(): Promise<CampusItem[]> {
  return await fetchCachedAllCampuses();
}

export async function getCampuses(): Promise<CampusItem[]> {
  return await fetchCachedAllCampuses();
}

/**
 * Get active campus based on session cookie or fallback to first (memoized per-request)
 */
const fetchCachedActiveCampus = cache(async (): Promise<CampusItem | null> => {
  try {
    const cookieStore = await cookies();
    const activeId = cookieStore.get("erp_active_campus_id")?.value;

    if (activeId) {
      const campus = await db.institute.findUnique({
        where: { id: activeId },
        include: {
          _count: {
            select: {
              students: true,
              batches: true,
            },
          },
        },
      });
      if (campus) return campus;
    }

    const first = await db.institute.findFirst({
      include: {
        _count: {
          select: {
            students: true,
            batches: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return first;
  } catch (err) {
    console.error("Failed to get active campus:", err);
    return null;
  }
});

export async function getActiveCampus(): Promise<CampusItem | null> {
  return await fetchCachedActiveCampus();
}

/**
 * Switch active campus across ERP session
 */
export async function switchActiveCampus(campusId: string) {
  try {
    const session = await getSession();
    if (!session || ["STUDENT", "PARENT"].includes(session.role)) {
      return { success: false, error: "Staff access required to switch campuses." };
    }
    if (
      session.role !== "SUPER_ADMIN" &&
      session.instituteId &&
      session.instituteId !== campusId
    ) {
      return { success: false, error: "You can only switch to your assigned campus." };
    }

    const campus = await db.institute.findUnique({
      where: { id: campusId },
    });
    if (!campus) {
      return { success: false, error: "Campus not found" };
    }

    const cookieStore = await cookies();
    cookieStore.set("erp_active_campus_id", campusId, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: "lax",
    });

    revalidatePath("/", "layout");
    return { success: true, campus };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to switch campus" };
  }
}

/**
 * Add a new campus / branch to the ERP
 */
export async function createNewCampus(data: {
  name: string;
  code: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  tagline?: string;
}) {
  const session = await requireStaffPermission("settings.manage");

  const cleanCode = data.code.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, error: "Campus Code is required (e.g. CAMPUS-02)." };
  }

  const existing = await db.institute.findUnique({
    where: { code: cleanCode },
  });

  if (existing) {
    return { success: false, error: `Campus code "${cleanCode}" is already in use by ${existing.name}.` };
  }

  try {
    const newCampus = await db.institute.create({
      data: {
        name: data.name.trim(),
        code: cleanCode,
        city: data.city?.trim() || "Srinagar",
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        tagline: data.tagline?.trim() || "Academic Coaching & Test Prep Campus",
        logoUrl: "/logo.png",
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/settings");
    return { success: true, campus: newCampus };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create campus." };
  }
}

/**
 * Helper to get only the active campus ID (string)
 */
const fetchCachedActiveCampusId = cache(async (): Promise<string> => {
  const activeCampus = await getActiveCampus();
  if (activeCampus) return activeCampus.id;
  const first = await db.institute.findFirst({ select: { id: true } });
  return first ? first.id : "";
});

export async function getActiveCampusId(): Promise<string> {
  return await fetchCachedActiveCampusId();
}

/**
 * Delete a campus / branch with safety checks and automatic session recovery
 */
export async function deleteCampus(campusId: string) {
  await requireStaffPermission("settings.manage");
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN" && session?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator privileges required to delete a campus." };
  }

  try {
    const campus = await db.$transaction(async (tx) => {
      // Row locks serialize deletions and block new foreign-key references until
      // the dependent-record check and deletion have both finished.
      await tx.$queryRaw`SELECT "id" FROM "Institute" ORDER BY "id" FOR UPDATE`;
      const campusCount = await tx.institute.count();
      if (campusCount <= 1) {
        throw new Error("Cannot delete the only remaining campus.");
      }

      const campus = await tx.institute.findUnique({
        where: { id: campusId },
        include: {
          _count: {
            select: {
              students: true,
              batches: true,
              users: true,
              academicSessions: true,
              courses: true,
              teachers: true,
              auditLogs: true,
              leads: true,
              testSeries: true,
            },
          },
        },
      });

      if (!campus) {
        throw new Error("Campus not found or already deleted.");
      }
      if (session.role !== "SUPER_ADMIN" && session.instituteId && session.instituteId !== campusId) {
        throw new Error("You cannot delete another campus.");
      }
      if (Object.values(campus._count).some((count) => count > 0)) {
        throw new Error("Only empty campuses can be deleted. This campus has linked records; its history must be preserved.");
      }
      await tx.institute.delete({
        where: { id: campusId },
      });
      return campus;
    }, { isolationLevel: "ReadCommitted" });

    // If the active campus in session cookie is the deleted one, switch to first remaining campus
    const cookieStore = await cookies();
    const activeId = cookieStore.get("erp_active_campus_id")?.value;
    if (activeId === campusId) {
      const remainingFirst = await db.institute.findFirst({ orderBy: { createdAt: "asc" } });
      if (remainingFirst) {
        cookieStore.set("erp_active_campus_id", remainingFirst.id, {
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
          sameSite: "lax",
        });
      } else {
        cookieStore.delete("erp_active_campus_id");
      }
    }

    revalidatePath("/", "layout");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/users");

    return {
      success: true,
      message: `Campus "${campus.name}" (${campus.code}) has been deleted successfully.`,
    };
  } catch (err: any) {
    console.error("Failed to delete campus:", err);
    return { success: false, error: err.message || "Failed to delete campus." };
  }
}
