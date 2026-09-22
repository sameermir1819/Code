"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "./audit";

export async function getStudyMaterials({
  courseId,
  batchId,
  subjectId,
  fileType,
}: {
  courseId?: string;
  batchId?: string;
  subjectId?: string;
  fileType?: string;
} = {}) {
  const session = await requireAuth();

  const where: Record<string, unknown> = {};
  if (courseId) where.courseId = courseId;
  if (batchId) where.batchId = batchId;
  if (subjectId) where.subjectId = subjectId;
  if (fileType && fileType !== "ALL") where.fileType = fileType;

  // If student, filter by enrolled courses / batches
  if (session.role === "STUDENT" && session.studentId) {
    const enrollments = await db.enrollment.findMany({
      where: { studentId: session.studentId, status: "ACTIVE" },
    });
    const batchIds = enrollments.map((e) => e.batchId);
    const courseIds = enrollments.map((e) => e.courseId);

    where.OR = [
      { batchId: { in: batchIds } },
      { courseId: { in: courseIds } },
      { assignedTo: { some: { studentId: session.studentId } } },
      { batchId: null, courseId: null }, // global materials
    ];
  }

  return await db.studyMaterial.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      course: true,
      batch: true,
      subject: true,
      uploadedBy: true,
    },
  });
}

export async function createStudyMaterial(data: {
  title: string;
  description?: string;
  fileType: string;
  fileUrl: string;
  fileSize?: string;
  courseId?: string;
  batchId?: string;
  subjectId?: string;
}) {
  const session = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEACHER"]);

  const material = await db.studyMaterial.create({
    data: {
      title: data.title,
      description: data.description || null,
      fileType: data.fileType || "PDF",
      fileUrl: data.fileUrl,
      fileSize: data.fileSize || "1.5 MB",
      courseId: data.courseId || null,
      batchId: data.batchId || null,
      subjectId: data.subjectId || null,
      uploadedById: session.teacherId || null,
    },
  });

  await logAudit({
    action: "MATERIAL_UPLOADED",
    entity: "StudyMaterial",
    entityId: material.id,
    details: `Material uploaded: ${material.title} (${material.fileType})`,
  });

  revalidatePath("/", "layout");
  return { success: true, material };
}

export async function trackMaterialDownload(id: string) {
  const session = await requireAuth();

  await db.studyMaterial.update({
    where: { id },
    data: { downloadsCount: { increment: 1 } },
  });

  if (session.studentId) {
    await db.studentStudyMaterial.upsert({
      where: {
        studyMaterialId_studentId: {
          studyMaterialId: id,
          studentId: session.studentId,
        },
      },
      update: { downloadedAt: new Date() },
      create: {
        studyMaterialId: id,
        studentId: session.studentId,
        downloadedAt: new Date(),
      },
    });
  }

  return { success: true };
}

import { revalidatePath } from "next/cache";

export async function deleteStudyMaterial(id: string) {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "TEACHER"]);
  const material = await db.studyMaterial.findUnique({ where: { id } });
  if (!material) throw new Error("Material not found");

  await db.studentStudyMaterial.deleteMany({ where: { studyMaterialId: id } });
  await db.studyMaterial.delete({ where: { id } });

  await logAudit({
    action: "MATERIAL_DELETED",
    entity: "StudyMaterial",
    entityId: id,
    details: `Material deleted: ${material.title}`,
  });

  revalidatePath("/", "layout");
  return { success: true };
}
