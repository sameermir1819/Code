// Internal audit writer; deliberately not a remotely callable Server Action.

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function logAudit({
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: {
  action: string;
  entity: string;
  entityId?: string;
  details?: string | Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    const session = await getSession();
    const detailsStr = typeof details === "object" ? JSON.stringify(details) : details;

    await db.auditLog.create({
      data: {
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
