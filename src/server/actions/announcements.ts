"use server";
import { requirePermission, requireStaffPermission } from "@/lib/auth";
import { assertCampusAccess } from "@/lib/campus-scope";
import { db } from "@/lib/db";
import { requireAuth, getSession } from "@/lib/auth";
import { logAudit } from "./audit";

// ==========================================
// NOTIFICATIONS
// ==========================================
export async function getUserNotifications() {
  const session = await getSession();
  if (!session) return { notifications: [], unreadCount: 0 };

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    }),
    db.notification.count({
      where: { userId: session.id, isRead: false },
    }),
  ]);

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
  const session = await requirePermission("announcements.view");
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
      createdBy: { select: { id: true, name: true } },
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
  const session = await requireStaffPermission("announcements.manage");
  let targetCampusId: string | null = null;
  if (data.courseId) {
    const course = await db.course.findUnique({
      where: { id: data.courseId },
      select: { id: true, instituteId: true },
    });
    if (!course) throw new Error("Selected course was not found.");
    assertCampusAccess(session, course.instituteId);
    targetCampusId = course.instituteId;
  }
  if (data.batchId) {
    const batch = await db.batch.findUnique({
      where: { id: data.batchId },
      select: { id: true, instituteId: true },
    });
    if (!batch) throw new Error("Selected batch was not found.");
    assertCampusAccess(session, batch.instituteId);
    if (targetCampusId && targetCampusId !== batch.instituteId) {
      throw new Error("Course and batch must belong to the same location.");
    }
  }

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
  const session = await requireStaffPermission("announcements.manage");
  const announcement = await db.announcement.findUnique({
    where: { id },
    select: {
      courseId: true,
      batchId: true,
      course: { select: { instituteId: true } },
      batch: { select: { instituteId: true } },
    },
  });
  if (!announcement) throw new Error("Announcement not found.");
  const targetCampusId = announcement.batch?.instituteId || announcement.course?.instituteId;
  if (targetCampusId) assertCampusAccess(session, targetCampusId);
  await db.announcement.delete({ where: { id } });
  return { success: true };
}
