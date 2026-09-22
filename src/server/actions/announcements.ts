"use server";

import { db } from "@/lib/db";
import { requireAuth, getSession } from "@/lib/auth";
import { logAudit } from "./audit";

// ==========================================
// NOTIFICATIONS
// ==========================================
export async function getUserNotifications() {
  const session = await getSession();
  if (!session) return { notifications: [], unreadCount: 0 };

  const notifications = await db.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = await db.notification.count({
    where: { userId: session.id, isRead: false },
  });

  return { notifications, unreadCount };
}

export async function markNotificationAsRead(id: string) {
  const session = await requireAuth();
  await db.notification.update({
    where: { id, userId: session.id },
    data: { isRead: true },
  });
  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await requireAuth();
  await db.notification.updateMany({
    where: { userId: session.id, isRead: false },
    data: { isRead: true },
  });
  return { success: true };
}

// ==========================================
// ANNOUNCEMENTS
// ==========================================
export async function getAnnouncements() {
  const session = await getSession();
  const now = new Date();

  const where: Record<string, unknown> = {
    OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
  };

  if (session && session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    where.targetRole = { in: ["ALL", session.role] };
  }

  return await db.announcement.findMany({
    where,
    orderBy: { publishDate: "desc" },
    include: {
      course: true,
      batch: true,
      createdBy: true,
    },
  });
}

export async function createAnnouncement(data: {
  title: string;
  message: string;
  priority: string;
  targetRole: string;
  courseId?: string;
  batchId?: string;
  expiryDate?: string;
}) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN"]);

  const announcement = await db.announcement.create({
    data: {
      title: data.title,
      message: data.message,
      priority: data.priority || "MEDIUM",
      targetRole: data.targetRole || "ALL",
      courseId: data.courseId || null,
      batchId: data.batchId || null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      createdById: session.id,
    },
  });

  await logAudit({
    action: "ANNOUNCEMENT_CREATED",
    entity: "Announcement",
    entityId: announcement.id,
    details: `Announcement created: ${announcement.title} (Target: ${announcement.targetRole}, Priority: ${announcement.priority})`,
  });

  return { success: true, announcement };
}

export async function deleteAnnouncement(id: string) {
  await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  await db.announcement.delete({ where: { id } });
  return { success: true };
}
