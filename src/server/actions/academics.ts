"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";
import { redactRelatedData } from "@/lib/redact-related-data";
import { getEffectivePermissions } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";
import { getActiveCampusId } from "./campus";
import { assertCampusAccess, authorizedCampusId } from "@/lib/campus-scope";

// ==========================================
// COURSES
// ==========================================
export async function getCourses(selectedCampusId?: string) {
  await requireStaffPermission("courses.view");
  const campusId = selectedCampusId && !["ALL", "GLOBAL"].includes(selectedCampusId)
    ? selectedCampusId
    : undefined;
  return await db.course.findMany({
    where: campusId ? { instituteId: campusId } : {},
    orderBy: { createdAt: "desc" },
    include: {
      institute: { select: { id: true, name: true, code: true, city: true } },
      subjects: { include: { subject: true } },
      batches: { where: { status: "ACTIVE" } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
  });
}

export async function createCourse(data: {
  instituteId?: string;
  name: string;
  code: string;
  description?: string;
  duration?: string;
  gradeClass?: string;
  standardFee: number;
  registrationFee?: number;
  subjectIds?: string[];
}) {
  const actor = await requireStaffPermission("courses.manage");
  const campusId = authorizedCampusId(actor, data.instituteId || (await getActiveCampusId()));
  if (!campusId) throw new Error("No active campus found");

  const course = await db.course.create({
    data: {
      instituteId: campusId,
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description || null,
      duration: data.duration || "1 Year",
      gradeClass: data.gradeClass || "Class 11",
      standardFee: data.standardFee,
      registrationFee: data.registrationFee || 5000,
      status: "ACTIVE",
    },
  });

  if (data.subjectIds && data.subjectIds.length > 0) {
    for (const sId of data.subjectIds) {
      await db.courseSubject.create({
        data: { courseId: course.id, subjectId: sId },
      });
    }
  }

  await logAudit({
    action: "COURSE_CREATED",
    entity: "Course",
    entityId: course.id,
    details: `Course created: ${course.name} (${course.code})`,
  });

  return { success: true, course };
}

// ==========================================
// SUBJECTS
// ==========================================
export async function getSubjects() {
  await requireStaffPermission("courses.view");
  return await db.subject.findMany({
    orderBy: { name: "asc" },
    include: {
      institute: { select: { id: true, name: true, code: true, city: true } },
      teachers: {
        where: { teacher: { is: { status: "ACTIVE" } } },
        include: { teacher: true },
      },
      courses: { include: { course: true } },
    },
  });
}

export async function createSubject(data: {
  name: string;
  code: string;
  description?: string;
  instituteId?: string;
}) {
  const actor = await requireStaffPermission("courses.manage");
  const name = data.name.trim();
  const code = data.code.trim().toUpperCase();
  if (!name || !code) throw new Error("Subject name and code are required.");

  const existing = await db.subject.findUnique({ where: { code } });
  if (existing) throw new Error(`Subject code "${code}" already exists.`);

  const requestedInstituteId = data.instituteId || authorizedCampusId(actor, await getActiveCampusId());
  const instituteId = requestedInstituteId === "GLOBAL" ? null : requestedInstituteId;
  const institute = instituteId
    ? await db.institute.findUnique({ where: { id: instituteId }, select: { id: true } })
    : null;
  if (instituteId && !institute) throw new Error("Select a valid location for this subject.");

  const subject = await db.subject.create({
    data: {
      instituteId,
      name,
      code,
      description: data.description?.trim() || null,
    },
  });

  await logAudit({
    action: "SUBJECT_CREATED",
    entity: "Subject",
    entityId: subject.id,
    details: `Subject created: ${subject.name} (${subject.code})`,
  });

  revalidatePath("/faculty");
  revalidatePath("/dashboard/batches");
  revalidatePath("/dashboard/users");

  return {
    success: true,
    subject: await db.subject.findUniqueOrThrow({
      where: { id: subject.id },
      include: { institute: { select: { id: true, name: true, code: true, city: true } } },
    }),
  };
}

export async function updateSubject(data: {
  id: string;
  name: string;
  code: string;
  description?: string;
  instituteId: string;
}) {
  await requireStaffPermission("courses.manage");

  const name = data.name.trim();
  const code = data.code.trim().toUpperCase();
  if (!name || !code) throw new Error("Subject name and code are required.");

  const instituteId = data.instituteId === "GLOBAL" ? null : data.instituteId;
  const [subject, duplicate, institute] = await Promise.all([
    db.subject.findUnique({ where: { id: data.id }, select: { id: true, name: true, code: true } }),
    db.subject.findFirst({ where: { code, id: { not: data.id } }, select: { id: true } }),
    instituteId
      ? db.institute.findUnique({ where: { id: instituteId }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  if (!subject) throw new Error("Subject not found.");
  if (duplicate) throw new Error(`Subject code "${code}" already exists.`);
  if (instituteId && !institute) throw new Error("Select a valid location for this subject.");

  const updated = await db.subject.update({
    where: { id: data.id },
    data: {
      instituteId,
      name,
      code,
      description: data.description?.trim() || null,
    },
    include: { institute: { select: { id: true, name: true, code: true, city: true } } },
  });

  await logAudit({
    action: "SUBJECT_UPDATED",
    entity: "Subject",
    entityId: updated.id,
    details: `Subject updated: ${subject.name} (${subject.code}) to ${updated.name} (${updated.code})`,
  });

  revalidatePath("/faculty");
  revalidatePath("/dashboard/batches");
  revalidatePath("/dashboard/users");

  return { success: true, subject: updated };
}

export async function deleteSubject(id: string) {
  await requireStaffPermission("courses.manage");

  const examCount = await db.exam.count({ where: { subjectId: id } });
  if (examCount > 0) {
    throw new Error(`Cannot delete subject. It is assigned to ${examCount} examination(s).`);
  }

  const slotCount = await db.timetableSlot.count({ where: { subjectId: id } });
  if (slotCount > 0) {
    throw new Error(`Cannot delete subject. It has ${slotCount} timetable slot(s) scheduled.`);
  }

  // Delete relations
  await db.courseSubject.deleteMany({ where: { subjectId: id } });
  await db.teacherSubject.deleteMany({ where: { subjectId: id } });

  const deleted = await db.subject.delete({ where: { id } });

  await logAudit({
    action: "SUBJECT_DELETED",
    entity: "Subject",
    entityId: id,
    details: `Subject deleted: ${deleted.name} (${deleted.code})`,
  });

  revalidatePath("/faculty");
  revalidatePath("/dashboard/batches");
  revalidatePath("/dashboard/users");

  return { success: true };
}

export async function assignTeacherSubjects(data: {
  teacherId?: string;
  userId?: string;
  subjectIds: string[];
}) {
  await requireStaffPermission("teachers.update");

  let teacher = null;
  if (data.teacherId) {
    teacher = await db.teacher.findUnique({
      where: { id: data.teacherId },
      include: { user: true },
    });
  } else if (data.userId) {
    teacher = await db.teacher.findFirst({
      where: { userId: data.userId },
      include: { user: true },
    });
  }

  if (!teacher) throw new Error("Teacher record not found");

  const subjects = await db.subject.findMany({
    where: { id: { in: data.subjectIds } },
  });

  const specializationStr = subjects.map((s) => s.name).join(", ");

  await db.$transaction(async (tx) => {
    // Remove old subject assignments for this teacher
    await tx.teacherSubject.deleteMany({
      where: { teacherId: teacher.id },
    });

    // Create new subject assignments
    for (const sId of data.subjectIds) {
      await tx.teacherSubject.create({
        data: {
          teacherId: teacher.id,
          subjectId: sId,
        },
      });
    }

    // Update specialization string on teacher
    await tx.teacher.update({
      where: { id: teacher.id },
      data: { specialization: specializationStr || null },
    });
  });

  await logAudit({
    action: "TEACHER_SUBJECTS_UPDATED",
    entity: "Teacher",
    entityId: teacher.id,
    details: `Updated subjects for faculty ${teacher.name}: ${specializationStr || "None"}`,
  });

  revalidatePath("/batches");
  revalidatePath("/dashboard/batches");
  revalidatePath("/teachers");
  revalidatePath("/faculty");
  revalidatePath("/dashboard/faculty");
  revalidatePath("/users");
  revalidatePath("/dashboard/users");
  revalidatePath("/timetable");

  return { success: true, specialization: specializationStr };
}

export async function getTeachers({ campusId: explicitCampusId }: { campusId?: string } = {}) {
  await requireStaffPermission("teachers.view");
  const campusId = explicitCampusId && !["ALL", "GLOBAL"].includes(explicitCampusId)
    ? explicitCampusId
    : undefined;
  let teachers = await db.teacher.findMany({
    where: {
      status: "ACTIVE",
      ...(campusId
        ? { OR: [{ instituteId: campusId }, { instituteId: null }] }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      institute: { select: { id: true, name: true, code: true, city: true } },
      subjects: { include: { subject: true } },
      batches: { include: { batch: true } },
      timetableSlots: true,
    },
  });

  return teachers;
}

// ==========================================
// BATCHES
// ==========================================
export async function getBatches({
  courseId,
  status,
  campusId: selectedCampusId,
}: { courseId?: string; status?: string; campusId?: string } = {}) {
  const actor = await requireStaffPermission("batches.view");
  const campusId = selectedCampusId && !["ALL", "GLOBAL"].includes(selectedCampusId)
    ? selectedCampusId
    : undefined;
  const where: Record<string, unknown> = campusId ? { instituteId: campusId } : {};
  if (courseId) where.courseId = courseId;
  if (status && status !== "ALL") where.status = status;

  const batches = await db.batch.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      institute: {
        select: { id: true, name: true, city: true },
      },
      course: {
        include: {
          subjects: {
            include: { subject: true },
          },
        },
      },
      teachers: {
        where: { teacher: { is: { status: "ACTIVE" } } },
        include: {
          teacher: {
            include: {
              subjects: {
                include: { subject: true },
              },
            },
          },
        },
      },
      timetableSlots: {
        where: { teacher: { is: { status: "ACTIVE" } } },
        include: { subject: true, teacher: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      _count: {
        select: {
          enrollments: { where: { status: "ACTIVE" } },
          exams: true,
          timetableSlots: true,
          studyMaterials: true,
        },
      },
    },
  });
  return redactRelatedData(batches, await getEffectivePermissions(actor));
}

export async function getBatchById(id: string) {
  const actor = await requireStaffPermission("batches.view");
  const batch = await db.batch.findFirst({
    where: { id },
    include: {
      course: {
        include: {
          subjects: {
            include: {
              subject: {
                include: {
                  teachers: {
                    where: { teacher: { is: { status: "ACTIVE" } } },
                    include: { teacher: true },
                  },
                },
              },
            },
          },
        },
      },
      teachers: {
        where: { teacher: { is: { status: "ACTIVE" } } },
        include: {
          teacher: {
            include: { subjects: { include: { subject: true } } },
          },
        },
      },
      timetableSlots: {
        where: { teacher: { is: { status: "ACTIVE" } } },
        include: { subject: true, teacher: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      studyMaterials: {
        include: { subject: true, uploadedBy: true },
        orderBy: { createdAt: "desc" },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            include: { parent: true },
          },
        },
        orderBy: { student: { name: "asc" } },
      },
      exams: {
        include: { subject: true },
        orderBy: { examDate: "desc" },
      },
    },
  });
  const permissions = await getEffectivePermissions(actor);
  if (batch && !permissions.includes("students.view")) batch.enrollments = [];
  return redactRelatedData(batch, permissions);
}

export async function createBatchSubject(data: {
  batchId: string;
  name: string;
  code: string;
  description?: string;
  teacherId?: string;
}) {
  const session = await requireStaffPermission("batches.manage");
  const batch = await db.batch.findUnique({
    where: { id: data.batchId },
    include: { course: true },
  });
  if (!batch) throw new Error("Batch not found");
  assertCampusAccess(session, batch.instituteId);
  const instituteId = batch.instituteId;
  if (data.teacherId) {
    const teacher = await db.teacher.findFirst({
      where: { id: data.teacherId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!teacher) throw new Error("Select an active faculty member.");
  }

  // Create or find subject by code
  let subject = await db.subject.findUnique({
    where: { code: data.code.toUpperCase().trim() },
  });

  if (!subject) {
    subject = await db.subject.create({
      data: {
        instituteId,
        name: data.name.trim(),
        code: data.code.toUpperCase().trim(),
        description: data.description?.trim() || null,
      },
    });
  }

  // Link to batch's course if not linked
  const existingCourseSubject = await db.courseSubject.findUnique({
    where: {
      courseId_subjectId: {
        courseId: batch.courseId,
        subjectId: subject.id,
      },
    },
  });

  if (!existingCourseSubject) {
    await db.courseSubject.create({
      data: {
        courseId: batch.courseId,
        subjectId: subject.id,
      },
    });
  }

  // If teacher assigned, link teacher to subject and batch
  if (data.teacherId) {
    const existingTeacherSubject = await db.teacherSubject.findUnique({
      where: {
        teacherId_subjectId: {
          teacherId: data.teacherId,
          subjectId: subject.id,
        },
      },
    });
    if (!existingTeacherSubject) {
      await db.teacherSubject.create({
        data: {
          teacherId: data.teacherId,
          subjectId: subject.id,
        },
      });
    }

    const existingTeacherBatch = await db.teacherBatch.findUnique({
      where: {
        teacherId_batchId: {
          teacherId: data.teacherId,
          batchId: batch.id,
        },
      },
    });
    if (!existingTeacherBatch) {
      await db.teacherBatch.create({
        data: {
          teacherId: data.teacherId,
          batchId: batch.id,
        },
      });
    }
  }

  await logAudit({
    action: "BATCH_SUBJECT_CREATED",
    entity: "Subject",
    entityId: subject.id,
    details: `Subject "${subject.name}" (${subject.code}) assigned to batch "${batch.name}"`,
  });

  revalidatePath(`/batches/${batch.id}`);
  revalidatePath(`/dashboard/batches/${batch.id}`);
  revalidatePath("/batches");
  revalidatePath("/dashboard/batches");

  return { success: true, subject };
}

export async function createBatch(data: {
  instituteId?: string;
  name: string;
  code: string;
  courseId?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  room?: string;
  teacherIds?: string[];
}) {
  const actor = await requireStaffPermission("batches.manage");
  const name = data.name?.trim();
  const code = data.code?.trim().toUpperCase();
  if (!name || !code) return { success: false as const, error: "Enter a batch name and code." };
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate < startDate) {
    return { success: false as const, error: "Choose valid dates. End date must be on or after start date." };
  }
  const capacity = data.capacity ?? 40;
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
    return { success: false as const, error: "Seat capacity must be a whole number from 1 to 200." };
  }
  const campusId = authorizedCampusId(actor, data.instituteId || (await getActiveCampusId()));
  const teacherIds = [...new Set(data.teacherIds || [])];
  try {
    const result = await db.$transaction(async (tx) => {
      // Serialize default-course creation for this campus, including concurrent submissions.
      await tx.$queryRaw`SELECT id FROM "Institute" WHERE id = ${campusId} FOR UPDATE`;
      if (await tx.batch.findUnique({ where: { code }, select: { id: true } })) {
        return { success: false as const, error: "This batch code already exists. Use a different code." };
      }
      const teacherCount = await tx.teacher.count({ where: { id: { in: teacherIds }, status: "ACTIVE" } });
      if (teacherCount !== teacherIds.length) {
        return { success: false as const, error: "One or more instructors are unavailable. Refresh and select them again." };
      }
      let course = await tx.course.findFirst({
        where: { instituteId: campusId, status: "ACTIVE", ...(data.courseId ? { id: data.courseId } : {}) },
        orderBy: { createdAt: "asc" },
      });
      if (!course && data.courseId) return { success: false as const, error: "Select an active course from this campus." };
      if (!course) {
        course = await tx.course.create({ data: {
          instituteId: campusId, name: "Academic Program", code: "GEN-PROG-" + campusId,
          duration: "1 Year", gradeClass: "All", standardFee: 100000, registrationFee: 5000, status: "ACTIVE",
        } });
      }
      const batch = await tx.batch.create({
        data: {
          instituteId: campusId, name, code, courseId: course.id, startDate, endDate, capacity,
          room: data.room?.trim() || "Lecture Hall 1", status: "ACTIVE",
          teachers: { create: teacherIds.map((teacherId) => ({ teacherId })) },
        },
        include: {
          institute: { select: { id: true, name: true, city: true } },
          course: true,
          teachers: {
            where: { teacher: { is: { status: "ACTIVE" } } },
            include: { teacher: { include: { subjects: { include: { subject: true } } } } },
          },
          _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
        },
      });
      return { success: true as const, batch };
    });
    if (!result.success) return result;
    await logAudit({ action: "BATCH_CREATED", entity: "Batch", entityId: result.batch.id, details: "Batch created: " + name + " (" + code + ")" });
    revalidatePath("/batches");
    revalidatePath("/dashboard/batches");
    revalidatePath("/timetable");
    revalidatePath("/dashboard");
    return result;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { success: false as const, error: "This code is already in use. Refresh and choose another batch code." };
    }
    console.error("Batch creation failed", error);
    return { success: false as const, error: "Could not save the batch. Please refresh the page and try again." };
  }
}

export async function updateBatch(
  id: string,
  data: {
    instituteId?: string;
    name?: string;
    code?: string;
    courseId?: string;
    startDate?: string;
    endDate?: string;
    capacity?: number;
    room?: string;
    status?: string;
    teacherIds?: string[];
  }
) {
  const actor = await requireStaffPermission("batches.manage");
  const existing = await db.batch.findUnique({
    where: { id },
  });
  if (!existing) throw new Error("Batch not found");
  assertCampusAccess(actor, existing.instituteId);
  const instituteId = data.instituteId
    ? assertCampusAccess(actor, data.instituteId)
    : existing.instituteId;
  const isMovingLocation = instituteId !== existing.instituteId;
  if (isMovingLocation) {
    const enrollmentCount = await db.enrollment.count({ where: { batchId: id } });
    if (enrollmentCount > 0) {
      throw new Error("This batch has student enrollment history. Transfer its students before changing the location.");
    }
  }

  let courseId = data.courseId;
  if (isMovingLocation && !courseId) {
    let targetCourse = await db.course.findFirst({
      where: { instituteId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!targetCourse) {
      targetCourse = await db.course.create({
        data: {
          instituteId,
          name: "Academic Program",
          code: `GEN-PROG-${instituteId}`,
          duration: "1 Year",
          gradeClass: "All",
          standardFee: 100000,
          registrationFee: 5000,
          status: "ACTIVE",
        },
        select: { id: true },
      });
    }
    courseId = targetCourse.id;
  }
  if (courseId) {
    const course = await db.course.findFirst({
      where: { id: courseId, instituteId },
      select: { id: true },
    });
    if (!course) throw new Error("Course does not belong to the selected location");
  }
  if (data.teacherIds?.length) {
    const teacherIds = [...new Set(data.teacherIds)];
    const teachers = await db.teacher.findMany({
      where: { id: { in: teacherIds }, status: "ACTIVE" },
      select: { id: true },
    });
    if (teachers.length !== teacherIds.length) {
      throw new Error("All selected faculty members must be active.");
    }
  }

  const updateData: any = {};
  if (isMovingLocation) updateData.instituteId = instituteId;
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.code !== undefined) updateData.code = data.code.trim().toUpperCase();
  if (courseId !== undefined) updateData.courseId = courseId;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
  if (data.capacity !== undefined) updateData.capacity = Number(data.capacity);
  if (data.room !== undefined) updateData.room = data.room.trim();
  if (data.status !== undefined) updateData.status = data.status;

  if (data.teacherIds !== undefined) {
    await db.teacherBatch.deleteMany({ where: { batchId: id } });
    if (data.teacherIds.length > 0) {
      for (const tId of data.teacherIds) {
        await db.teacherBatch.create({
          data: { batchId: id, teacherId: tId },
        });
      }
    }
  }

  const updatedBatch = await db.batch.update({
    where: { id },
    data: updateData,
    include: {
      institute: { select: { id: true, name: true, city: true } },
      course: true,
      teachers: {
        where: { teacher: { is: { status: "ACTIVE" } } },
        include: {
          teacher: {
            include: {
              subjects: { include: { subject: true } },
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  await logAudit({
    action: "BATCH_UPDATED",
    entity: "Batch",
    entityId: id,
    details: `Batch updated: ${updatedBatch.name} (${updatedBatch.code}) - Status: ${updatedBatch.status}`,
  });

  revalidatePath("/batches");
  revalidatePath("/dashboard/batches");
  revalidatePath(`/dashboard/batches/${id}`);
  revalidatePath(`/batches/${id}`);
  revalidatePath("/timetable");
  revalidatePath("/dashboard");

  return { success: true, batch: updatedBatch };
}

export async function deleteBatch(id: string) {
  const actor = await requireStaffPermission("batches.manage");
  const batch = await db.batch.findUnique({ where: { id } });
  if (!batch) throw new Error("Batch not found");
  assertCampusAccess(actor, batch.instituteId);

  await db.$transaction(async (tx) => {
    await tx.timetableSlot.deleteMany({ where: { batchId: id } });
    await tx.teacherBatch.deleteMany({ where: { batchId: id } });
    await tx.attendance.deleteMany({ where: { batchId: id } });

    const exams = await tx.exam.findMany({ where: { batchId: id }, select: { id: true } });
    const examIds = exams.map((e) => e.id);
    if (examIds.length > 0) {
      await tx.marks.deleteMany({ where: { examId: { in: examIds } } });
      await tx.exam.deleteMany({ where: { batchId: id } });
    }

    await tx.enrollment.deleteMany({ where: { batchId: id } });
    await tx.batch.delete({ where: { id } });
  });

  await logAudit({
    action: "BATCH_DELETED",
    entity: "Batch",
    entityId: id,
    details: `Batch/Class deleted: ${batch.name} (${batch.code})`,
  });

  revalidatePath("/batches");
  revalidatePath("/dashboard/batches");
  revalidatePath("/timetable");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAllBatches() {
  const actor = await requireStaffPermission("batches.manage");
  const instituteId = authorizedCampusId(actor, await getActiveCampusId());
  const batches = await db.batch.findMany({ where: { instituteId }, select: { id: true } });
  const batchIds = batches.map((batch) => batch.id);
  const count = batchIds.length;

  await db.$transaction(async (tx) => {
    await tx.timetableSlot.deleteMany({ where: { batchId: { in: batchIds } } });
    await tx.teacherBatch.deleteMany({ where: { batchId: { in: batchIds } } });
    await tx.attendance.deleteMany({ where: { batchId: { in: batchIds } } });
    const exams = await tx.exam.findMany({ where: { batchId: { in: batchIds } }, select: { id: true } });
    await tx.marks.deleteMany({ where: { examId: { in: exams.map((exam) => exam.id) } } });
    await tx.exam.deleteMany({ where: { batchId: { in: batchIds } } });
    await tx.enrollment.deleteMany({ where: { batchId: { in: batchIds } } });
    await tx.batch.deleteMany({ where: { id: { in: batchIds } } });
  });

  await logAudit({
    action: "ALL_BATCHES_DELETED",
    entity: "Batch",
    details: `All ${count} batches/classes deleted by administrator`,
  });

  revalidatePath("/batches");
  revalidatePath("/timetable");
  revalidatePath("/dashboard");
  return { success: true, count };
}

// ==========================================
// ENROLLMENT & BATCH TRANSFER WORKFLOW
// ==========================================
export async function transferStudentBatch(
  enrollmentId: string,
  newBatchId: string,
  reason?: string
) {
  const actor = await requireStaffPermission("batches.manage");
  const currentEnrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { student: true, batch: true },
  });
  if (!currentEnrollment) throw new Error("Current enrollment not found");
  const instituteId = assertCampusAccess(actor, currentEnrollment.batch.instituteId);

  const targetBatch = await db.batch.findFirst({
    where: { id: newBatchId, instituteId },
  });
  if (!targetBatch) throw new Error("Target batch not found");

  // Check capacity
  const targetBatchCount = await db.enrollment.count({
    where: { batchId: newBatchId, status: "ACTIVE" },
  });
  if (targetBatchCount >= targetBatch.capacity) {
    throw new Error(
      `Target batch ${targetBatch.name} is at full capacity (${targetBatch.capacity} students)`
    );
  }

  // Atomic transfer: Mark previous enrollment TRANSFERRED, create new ACTIVE enrollment
  const now = new Date();
  const result = await db.$transaction(async (tx) => {
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "TRANSFERRED",
        endDate: now,
        notes: `Transferred to ${targetBatch.name}. Reason: ${reason || "Academic adjustment"}`,
      },
    });

    const newEnrollment = await tx.enrollment.create({
      data: {
        studentId: currentEnrollment.studentId,
        courseId: targetBatch.courseId,
        batchId: newBatchId,
        startDate: now,
        status: "ACTIVE",
        source: "BATCH_TRANSFER",
        notes: `Transferred from ${currentEnrollment.batch.name}`,
      },
    });

    return newEnrollment;
  });

  await logAudit({
    action: "BATCH_TRANSFER",
    entity: "Enrollment",
    entityId: result.id,
    details: `Student ${currentEnrollment.student.name} transferred from ${currentEnrollment.batch.name} to ${targetBatch.name}. Reason: ${reason || "N/A"}`,
  });

  return { success: true, newEnrollment: result };
}

// ==========================================
// TIMETABLE & CONFLICT PREVENTION
// ==========================================
export async function getTimetable({
  batchId,
  teacherId,
  campusId,
}: { batchId?: string; teacherId?: string; campusId?: string } = {}) {
  await requireStaffPermission("timetable.view");
  const where: Record<string, unknown> = {};
  if (batchId) where.batchId = batchId;
  if (teacherId) where.teacherId = teacherId;
  if (campusId && !["ALL", "GLOBAL"].includes(campusId)) {
    where.batch = { instituteId: campusId };
  }

  return await db.timetableSlot.findMany({
    where,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: {
      batch: true,
      subject: true,
      teacher: true,
    },
  });
}

export async function createTimetableSlot(data: {
  dayOfWeek: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  batchId: string;
  subjectId: string;
  teacherId: string;
  room: string;
}) {
  const actor = await requireStaffPermission("timetable.manage");
  if (!data.dayOfWeek || !data.startTime || !data.endTime || data.startTime >= data.endTime) {
    throw new Error("Select a valid day and time range.");
  }
  const [batch, teacher] = await Promise.all([
    db.batch.findFirst({ where: { id: data.batchId }, select: { id: true, instituteId: true } }),
    db.teacher.findFirst({ where: { id: data.teacherId, status: "ACTIVE" }, select: { id: true } }),
  ]);
  if (!batch || !teacher) throw new Error("Select a valid batch and an active faculty member.");
  assertCampusAccess(actor, batch.instituteId);

  // 1. Check Teacher conflict
  const teacherConflict = await db.timetableSlot.findFirst({
    where: {
      dayOfWeek: data.dayOfWeek,
      teacherId: data.teacherId,
      OR: [
        {
          startTime: { lte: data.startTime },
          endTime: { gt: data.startTime },
        },
        {
          startTime: { lt: data.endTime },
          endTime: { gte: data.endTime },
        },
      ],
    },
    include: { teacher: true, batch: true },
  });

  if (teacherConflict) {
    throw new Error(
      `TIMETABLE CONFLICT: Teacher ${teacherConflict.teacher.name} is already assigned to batch ${teacherConflict.batch.name} on ${data.dayOfWeek} from ${teacherConflict.startTime} to ${teacherConflict.endTime}`
    );
  }

  // 2. Check Room conflict
  const roomConflict = await db.timetableSlot.findFirst({
    where: {
      dayOfWeek: data.dayOfWeek,
      room: data.room,
      batch: { instituteId: batch.instituteId },
      OR: [
        {
          startTime: { lte: data.startTime },
          endTime: { gt: data.startTime },
        },
        {
          startTime: { lt: data.endTime },
          endTime: { gte: data.endTime },
        },
      ],
    },
    include: { batch: true },
  });

  if (roomConflict) {
    throw new Error(
      `TIMETABLE CONFLICT: Room ${data.room} is already occupied by batch ${roomConflict.batch.name} on ${data.dayOfWeek} from ${roomConflict.startTime} to ${roomConflict.endTime}`
    );
  }

  // 3. Check Batch conflict
  const batchConflict = await db.timetableSlot.findFirst({
    where: {
      dayOfWeek: data.dayOfWeek,
      batchId: data.batchId,
      OR: [
        {
          startTime: { lte: data.startTime },
          endTime: { gt: data.startTime },
        },
        {
          startTime: { lt: data.endTime },
          endTime: { gte: data.endTime },
        },
      ],
    },
    include: { subject: true },
  });

  if (batchConflict) {
    throw new Error(
      `TIMETABLE CONFLICT: This batch already has class ${batchConflict.subject.name} on ${data.dayOfWeek} from ${batchConflict.startTime} to ${batchConflict.endTime}`
    );
  }

  const slot = await db.timetableSlot.create({
    data: {
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      batchId: data.batchId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      room: data.room,
    },
  });

  await logAudit({
    action: "TIMETABLE_SLOT_CREATED",
    entity: "TimetableSlot",
    entityId: slot.id,
    details: `Slot created: ${data.dayOfWeek} ${data.startTime}-${data.endTime} in ${data.room}`,
  });

  revalidatePath("/timetable");
  revalidatePath("/dashboard");
  return { success: true, slot };
}

export async function deleteTimetableSlot(id: string) {
  const actor = await requireStaffPermission("timetable.manage");
  const slot = await db.timetableSlot.findFirst({
    where: { id },
    select: { id: true, batch: { select: { instituteId: true } } },
  });
  if (!slot) throw new Error("Timetable slot not found");
  assertCampusAccess(actor, slot.batch.instituteId);
  await db.timetableSlot.delete({ where: { id } });
  await logAudit({
    action: "TIMETABLE_SLOT_DELETED",
    entity: "TimetableSlot",
    entityId: id,
    details: `Timetable slot deleted`,
  });

  revalidatePath("/timetable");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAllTimetableSlots() {
  const actor = await requireStaffPermission("timetable.manage");
  const instituteId = authorizedCampusId(actor, await getActiveCampusId());
  const where = { batch: { instituteId } };
  const count = await db.timetableSlot.count({ where });
  await db.timetableSlot.deleteMany({ where });

  await logAudit({
    action: "ALL_TIMETABLE_SLOTS_DELETED",
    entity: "TimetableSlot",
    details: `All ${count} timetable slots/classes deleted by administrator`,
  });

  revalidatePath("/timetable");
  revalidatePath("/dashboard");
  return { success: true, count };
}
