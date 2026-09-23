import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SessionUser, Role, PermissionCode, hasRolePermission } from "@/lib/permissions";

const SECRET_KEY = process.env.JWT_SECRET || "coaching-erp-default-secret-key-min-32-chars-2026";
const key = new TextEncoder().encode(SECRET_KEY);
const COOKIE_NAME = "erp_session_token";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

import { cache } from "react";

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return await verifySessionToken(token);
});

import { redirect } from "next/navigation";

export async function requireAuth(allowedRoles?: Role[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN: You do not have permission to perform this action");
  }

  return session;
}

export async function requirePermission(code: PermissionCode): Promise<SessionUser> {
  const session = await requireAuth();

  // Super Admin bypasses all permission checks
  if (session.role === "SUPER_ADMIN") return session;

  // Check custom user permission overrides in database if present
  try {
    const userOverride = await db.userPermission.findFirst({
      where: {
        userId: session.id,
        permission: { code },
      },
    });

    if (userOverride !== null) {
      if (userOverride.granted) return session;
      throw new Error(`FORBIDDEN: Permission "${code}" has been revoked for your account.`);
    }
  } catch (err: any) {
    if (err.message?.startsWith("FORBIDDEN")) throw err;
  }

  if (hasRolePermission(session.role, code)) {
    return session;
  }

  // Check database relational role permissions (for custom roles and customized system roles)
  try {
    const rolePerm = await db.rolePermission.findFirst({
      where: {
        role: { name: session.role },
        permission: { code },
      },
    });
    if (rolePerm) {
      return session;
    }
  } catch (err: any) {
    // Ignore db query error and fall through
  }

  throw new Error(`FORBIDDEN: Role ${session.role} does not possess permission "${code}".`);
}

