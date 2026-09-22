"use server";

import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from "@/lib/auth";
import { logAudit } from "./audit";
import { Role } from "@/lib/permissions";

export async function loginUser(formData: { email: string; password: string }) {
  try {
    const email = formData.email.trim().toLowerCase();
    const user = await db.user.findUnique({
      where: { email },
      include: {
        teacher: true,
        student: true,
        parent: true,
      },
    });

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    if (user.status !== "ACTIVE") {
      return {
        success: false,
        error: `Account is ${user.status.toLowerCase()}. Please contact administration.`,
      };
    }

    const isValid = await verifyPassword(formData.password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid email or password" };
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      instituteId: user.instituteId,
      teacherId: user.teacher?.id || null,
      studentId: user.student?.id || null,
      parentId: user.parent?.id || null,
    };

    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logAudit({
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      details: `User ${user.email} logged in with role ${user.role}`,
    });

    return { success: true, user: sessionUser };
  } catch (error: unknown) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected login error occurred",
    };
  }
}

export async function logoutUser() {
  const session = await getSession();
  if (session) {
    await logAudit({
      action: "USER_LOGOUT",
      entity: "User",
      entityId: session.id,
      details: `User ${session.email} logged out`,
    });
  }
  await clearSessionCookie();
  return { success: true };
}

export async function getCurrentUser() {
  return await getSession();
}

export async function getUserProfile() {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return await db.user.findUnique({
    where: { id: session.id },
  });
}

export async function updateUserProfile(data: {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: You must be logged in to update your profile");
  }

  const targetUserId = session.id;

  const existing = await db.user.findUnique({ where: { id: targetUserId } });
  if (!existing) throw new Error("User record not found");

  const updateData: Record<string, any> = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone?.trim() || null,
    avatarUrl: data.avatarUrl?.trim() || null,
  };

  // Password update validation
  if (data.newPassword && data.newPassword.trim()) {
    if (!data.currentPassword) {
      throw new Error("Current password is required to set a new password");
    }
    const isValid = await verifyPassword(data.currentPassword, existing.passwordHash);
    if (!isValid) {
      throw new Error("Incorrect current password");
    }
    updateData.passwordHash = await hashPassword(data.newPassword.trim());
  }

  const updated = await db.user.update({
    where: { id: targetUserId },
    data: updateData,
  });

  // Re-issue updated session cookie
  const updatedSessionUser = {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role as Role,
    instituteId: updated.instituteId,
    teacherId: session?.teacherId || null,
    studentId: session?.studentId || null,
    parentId: session?.parentId || null,
  };

  const token = await createSessionToken(updatedSessionUser);
  await setSessionCookie(token);

  await logAudit({
    action: "USER_PROFILE_UPDATED",
    entity: "User",
    entityId: updated.id,
    details: `User profile updated for ${updated.email} (${updated.name})`,
  });

  return { success: true, user: updatedSessionUser };
}

export async function getInstituteProfile() {
  const institute = await db.institute.findFirst();
  if (!institute) {
    return await db.institute.create({
      data: {
        name: "Futurex Learning",
        code: "FL-CAMPUS-01",
        tagline: "Excellence in Academic Coaching & Competitive Entry Test Prep",
      },
    });
  }
  return institute;
}

export async function updateInstituteProfile(data: {
  name: string;
  tagline?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency?: string;
  currencySymbol?: string;
  logoUrl?: string;
}) {
  const institute = await getInstituteProfile();

  const updated = await db.institute.update({
    where: { id: institute.id },
    data: {
      name: data.name.trim(),
      tagline: data.tagline?.trim() || null,
      code: (data.code?.trim() || "FL-CAMPUS-01").toUpperCase(),
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      website: data.website?.trim() || null,
      currency: data.currency?.trim() || "INR",
      currencySymbol: data.currencySymbol?.trim() || "₹",
      logoUrl: data.logoUrl?.trim() || null,
    },
  });

  await logAudit({
    action: "INSTITUTE_PROFILE_UPDATED",
    entity: "Institute",
    entityId: updated.id,
    details: `Institute profile updated: ${updated.name} (${updated.code})`,
  });

  return { success: true, institute: updated };
}
