// Internal audit writer; deliberately not a remotely callable Server Action.

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/permissions";

export async function logAudit({
  action,
  entity,
  entityId,
  details,
  ipAddress,
  actor,
}: {
  action: string;
  entity: string;
  entityId?: string;
  details?: string | Record<string, unknown>;
  ipAddress?: string;
  // Trusted internal callers may carry their already-authorized actor into a
  // post-response audit task. This module is not a remotely callable action.
  actor?: Pick<SessionUser, "id" | "name" | "role" | "instituteId">;
}) {
  try {
    const session = actor ?? await getSession();
    const detailsStr = typeof details === "object" ? JSON.stringify(details) : details;
    const instituteId = session?.instituteId || null;

    await db.auditLog.create({
      data: {
        instituteId,
        userId: session?.id || "SYSTEM",
        userName: session?.name || "System Automated",
        userRole: session?.role || "SYSTEM",
        action,
        entity,
        entityId: entityId || null,
        details: detailsStr || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
