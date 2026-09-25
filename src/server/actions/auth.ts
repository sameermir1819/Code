"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSessionToken, setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth";
import { logAudit } from "./audit";
import { Role } from "@/lib/permissions";

export async function loginUser(formData: {
  email?: string;
  identifier?: string;
  password?: string;
}) {
  try {
    const rawIdentifier = (formData.identifier || formData.email || "").trim();
    const rawPassword = (formData.password || "").trim();

    if (!rawIdentifier || !rawPassword) {
      return { success: false, error: "Please enter your username/email and password" };
    }

    let user: any = null;
    let matchedStudent: any = null;

    // 1. Direct match by email
    if (rawIdentifier.includes("@")) {
      user = await db.user.findUnique({
        where: { email: rawIdentifier.toLowerCase() },
        include: { teacher: true, student: true, parent: true },
      });
    }

    // 2. If not found by email, search as Student username / Student Code / Name
    if (!user) {
      // Normalize Name_name: e.g. "aarav_sharma" -> "Aarav Sharma"
      const nameWithSpaces = rawIdentifier.replace(/_/g, " ");

      matchedStudent = await db.student.findFirst({
        where: {
          OR: [
            { studentId: { equals: rawIdentifier, mode: "insensitive" } },
            { admissionNo: { equals: rawIdentifier, mode: "insensitive" } },
            { name: { equals: rawIdentifier, mode: "insensitive" } },
            { name: { equals: nameWithSpaces, mode: "insensitive" } },
            { email: { equals: rawIdentifier.toLowerCase() } },
          ],
        },
        include: {
          user: true,
          institute: true,
        },
      });

      if (matchedStudent) {
        if (matchedStudent.user) {
          user = matchedStudent.user;
        } else if (matchedStudent.email) {
          user = await db.user.findUnique({
            where: { email: matchedStudent.email.toLowerCase() },
            include: { teacher: true, student: true, parent: true },
          });
        }

        // If no User record exists yet, auto-provision one for the student
        if (!user) {
          if (matchedStudent.status !== "ACTIVE" || rawPassword !== matchedStudent.studentId) {
            return { success: false, error: "Invalid username/email or password. Please contact administration for account setup." };
          }
          const generatedEmail =
            matchedStudent.email || `${matchedStudent.studentId.toLowerCase()}@student.local`;
          const pwdHash = await hashPassword(matchedStudent.studentId);
          user = await db.user.create({
            data: {
              name: matchedStudent.name,
              email: generatedEmail,
              passwordHash: pwdHash,
              role: "STUDENT",
              status: "ACTIVE",
              instituteId: matchedStudent.instituteId,
            },
          });
          await db.student.update({
            where: { id: matchedStudent.id },
            data: { userId: user.id },
          });
        }
      }
    }

    // 3. Fallback: match User name directly
    if (!user) {
      const nameWithSpaces = rawIdentifier.replace(/_/g, " ");
      user = await db.user.findFirst({
        where: {
          OR: [
            { name: { equals: rawIdentifier, mode: "insensitive" } },
            { name: { equals: nameWithSpaces, mode: "insensitive" } },
          ],
        },
        include: { teacher: true, student: true, parent: true },
      });
    }

    if (!user) {
      return { success: false, error: "Invalid username/email or password" };
    }

    // Resolve the profile without overriding an administrator's account status.
    if (user.role === "STUDENT") {
      if (!matchedStudent) {
        matchedStudent = await db.student.findFirst({
          where: { OR: [{ userId: user.id }, { email: user.email }] },
        });
      }
    }

    if (user.status !== "ACTIVE" || user.isArchived) {
      return {
        success: false,
        error: "Account is unavailable. Please contact administration.",
      };
    }

    // Password Validation:
    let isValidPassword = false;

    // Check custom password hash first (if user changed or set custom password)
    if (user.passwordHash) {
      isValidPassword = await verifyPassword(rawPassword, user.passwordHash);
    }

    if (!isValidPassword) {
      return {
        success: false,
        error:
          user.role === "STUDENT"
            ? "Invalid Student Code or password. Please contact administration if you need a password reset."
            : "Invalid email or password",
      };
    }

    let studentId = user.student?.id || matchedStudent?.id || null;
    if (!studentId && user.role === "STUDENT") {
      const s = await db.student.findFirst({
        where: { OR: [{ email: user.email }, { userId: user.id }] },
      });
      if (s) {
        studentId = s.id;
        if (!s.userId) {
          db.student.update({ where: { id: s.id }, data: { userId: user.id } }).catch(() => {});
        }
      }
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      instituteId: user.instituteId,
      teacherId: user.teacher?.id || null,
      studentId: studentId,
      parentId: user.parent?.id || null,
    };

    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    // Non-blocking background updates for instant response
    db.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch(() => {});

    logAudit({
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      details: `User ${user.email} logged in with role ${user.role}`,
    }).catch(() => {});

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
  if (!institute) throw new Error("No campus configured. An administrator must create a campus first.");
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
  await requireStaffPermission("settings.manage");
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
