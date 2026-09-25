"use server";
import { requirePermission, requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";

import { logAudit } from "./audit";
import { materialAccessWhere } from "@/lib/material-access";
import { authorizedCampusId } from "@/lib/campus-scope";
import { getActiveCampusId } from "./campus";
import { existingUploadPath, uploadRoot, uploadOwner } from "@/lib/private-uploads";

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
  const session = await requirePermission("materials.view");

  const where: Record<string, unknown> = { AND: [await materialAccessWhere(session)] };
  if (courseId) where.courseId = courseId;
  if (batchId) where.batchId = batchId;
  if (subjectId) where.subjectId = subjectId;
  if (fileType && fileType !== "ALL") where.fileType = fileType;

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
  const session = await requireStaffPermission("materials.manage");

  const safeFileUrl = data.fileUrl?.trim();
  if (!data.title?.trim() || !safeFileUrl) throw new Error("Title and file are required");
  const instituteId = authorizedCampusId(session, await getActiveCampusId());
  if (safeFileUrl.startsWith("/api/uploads/materials/")) {
    const parts = safeFileUrl.slice("/api/uploads/".length).split("/");
    const file = await existingUploadPath(uploadRoot, parts);
    if (!file || await uploadOwner(file) !== session.id) throw new Error("Choose a file uploaded by your account");
  } else {
    let url: URL;
    try { url = new URL(safeFileUrl); } catch { throw new Error("Use a valid HTTPS link or upload a file"); }
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Only HTTP or HTTPS links are supported");
  }
  if (data.courseId && !await db.course.findFirst({ where: { id: data.courseId, instituteId }, select: { id: true } })) throw new Error("Course is not in your campus");
  if (data.batchId) {
    const batch = await db.batch.findFirst({ where: {
      id: data.batchId, instituteId, ...(data.courseId ? { courseId: data.courseId } : {}),
      ...(session.role === "TEACHER" ? { teachers: { some: { teacherId: session.teacherId || "" } } } : {}),
    }, select: { id: true } });
    if (!batch) throw new Error("You cannot add materials to this batch");
  } else if (session.role === "TEACHER") {
    throw new Error("Select one of your assigned batches");
  }

  const material = await db.studyMaterial.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      fileType: data.fileType || "PDF",
      fileUrl: safeFileUrl,
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
  const session = await requirePermission("materials.view");
  const allowed = await db.studyMaterial.findFirst({ where: { AND: [{ id }, await materialAccessWhere(session)] }, select: { id: true } });
  if (!allowed) throw new Error("Material not found");

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
  const session = await requireStaffPermission("materials.manage");
  const material = await db.studyMaterial.findFirst({ where: { AND: [
    { id }, await materialAccessWhere(session),
    ...(session.role === "TEACHER" ? [{ uploadedById: session.teacherId || "" }] : []),
  ] } });
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
