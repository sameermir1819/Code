import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SessionUser, Role, PermissionCode, hasRolePermission, ROLE_PERMISSIONS, ALL_PERMISSION_CODES, NEW_PERMISSION_CODES } from "@/lib/permissions";

const DEV_JWT_SECRET = "coaching-erp-dev-secret-key-min-32-chars-2026";

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }
  return DEV_JWT_SECRET;
}

const key = new TextEncoder().encode(getJwtSecret());
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
  const claims = await verifySessionToken(token);
  if (!claims || typeof claims.id !== "string") return null;

  // JWT claims identify the account; current database state controls access.
  const user = await db.user.findUnique({
    where: { id: claims.id },
    select: {
      id: true, name: true, email: true, role: true, instituteId: true,
      status: true, isArchived: true,
      teacher: { select: { id: true } },
      student: { select: { id: true } },
      parent: { select: { id: true } },
    },
  });
  if (!user || user.status !== "ACTIVE" || user.isArchived) return null;

  return {
    id: user.id, name: user.name, email: user.email, role: user.role,
    instituteId: user.instituteId,
    teacherId: user.teacher?.id ?? null,
    studentId: user.student?.id ?? null,
    parentId: user.parent?.id ?? null,
  };
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

export const getEffectivePermissions = cache(async (session: SessionUser): Promise<PermissionCode[]> => {
  if (session.role === "SUPER_ADMIN") return [...ALL_PERMISSION_CODES];
  const [role, overrides, catalog] = await Promise.all([
    db.role.findUnique({ where: { name: session.role }, include: { permissions: { include: { permission: true } } } }),
    db.userPermission.findMany({ where: { userId: session.id }, include: { permission: true } }),
    db.permission.findMany({ select: { code: true } }),
  ]);
  const effective = new Set<string>(role ? role.permissions.map((entry) => entry.permission.code) : ROLE_PERMISSIONS[session.role] ?? []);
  // New module defaults apply only before that code exists in the catalog.
  // Once configured, even an empty database role permission list is authoritative.
  const registered = new Set(catalog.map((entry) => entry.code));
  for (const code of NEW_PERMISSION_CODES) if (!registered.has(code) && hasRolePermission(session.role, code)) effective.add(code);
  for (const override of overrides) {
    if (override.granted) effective.add(override.permission.code);
    else effective.delete(override.permission.code);
  }
  return [...effective] as PermissionCode[];
});

export async function requirePermission(code: PermissionCode): Promise<SessionUser> {
  const session = await requireAuth();
  if (!(await getEffectivePermissions(session)).includes(code)) throw new Error("FORBIDDEN: Permission " + code + " is not granted for your account.");
  return session;
}

export async function requireStaffPermission(code: PermissionCode): Promise<SessionUser> {
  const session = await requirePermission(code);
  // Student/parent permissions apply only to their own portal and owned records.
  if (["STUDENT", "PARENT"].includes(session.role)) throw new Error("FORBIDDEN: Staff access required");
  return session;
}
