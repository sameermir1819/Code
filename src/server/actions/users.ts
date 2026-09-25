"use server";

import { db } from "@/lib/db";
import { syncPermissionCatalog } from "@/lib/permission-catalog";
import { hashPassword, requireAuth, requirePermission, getEffectivePermissions } from "@/lib/auth";
import { Role, PermissionCode, ROLE_PERMISSIONS } from "@/lib/permissions";
import { createStudentUser } from "@/lib/student-user";
import { logAudit } from "./audit";
import { getActiveCampusId } from "./campus";
import { revalidatePath } from "next/cache";

// =========================================================================
// 1. GET USERS (Paginated, Searchable, Filterable, Sorted)
// =========================================================================
export async function getUsers({
  search = "",
  role = "ALL",
  status = "ALL",
  branch = "ALL",
  campusId = "ALL",
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  sortOrder = "desc",
  createdFrom,
  createdTo,
  includeArchived = false,
}: {
  search?: string;
  role?: string;
  status?: string;
  branch?: string;
  campusId?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "lastLoginAt" | "status" | "email";
  sortOrder?: "asc" | "desc";
  createdFrom?: string;
  createdTo?: string;
  includeArchived?: boolean;
} = {}) {
  const actor = await requirePermission("users.view");

  const where: Record<string, any> = {
    isArchived: includeArchived ? undefined : false,
  };

  // Search by Name, Email, Phone, ID
  if (search && search.trim() !== "") {
    const q = search.trim();
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { id: { contains: q } },
      {
        student: {
          is: {
            OR: [
              { studentId: { contains: q } },
              { admissionNo: { contains: q } },
            ],
          },
        },
      },
    ];
  }

  // Filter by Role
  if (role && role !== "ALL") {
    where.role = role;
  }

  // Filter by Status
  if (status && status !== "ALL") {
    where.status = status;
  }

  // Filter by Branch
  if (branch && branch !== "ALL") {
    where.branch = branch;
  }

  // Filter by Campus
  if (campusId && campusId !== "ALL") {
    if (campusId === "GLOBAL") {
      where.instituteId = null;
    } else {
      where.instituteId = campusId;
    }
  }

  // Filter by Created Date range
  if (createdFrom || createdTo) {
    where.createdAt = {};
    if (createdFrom) where.createdAt.gte = new Date(createdFrom);
    if (createdTo) {
      const end = new Date(createdTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (Math.max(1, page) - 1) * safeLimit;

  const validSortFields = ["name", "createdAt", "lastLoginAt", "status", "email"];
  const orderField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

  const [users, total, stats] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [orderField]: sortOrder === "asc" ? "asc" : "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        branch: true,
        instituteId: true,
        institute: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
        student: {
          select: {
            id: true,
            studentId: true,
            admissionNo: true,
          },
        },
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.user.count({ where }),
    // Aggregate status counters for dashboard tabs
    Promise.all([
      db.user.count({ where: { isArchived: false } }),
      db.user.count({ where: { status: "ACTIVE", isArchived: false } }),
      db.user.count({ where: { role: { in: ["SUPER_ADMIN", "ADMIN"] }, isArchived: false } }),
      db.user.count({ where: { status: { in: ["INACTIVE", "SUSPENDED"] }, isArchived: false } }),
    ]),
  ]);

  return {
    success: true,
    users,
    total,
    page: Math.max(1, page),
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 1,
    stats: {
      totalUsers: stats[0],
      activeUsers: stats[1],
      adminUsers: stats[2],
      inactiveUsers: stats[3],
    },
    currentUserRole: actor.role,
  };
}

export async function provisionStudentUserAccounts() {
  const actor = await requirePermission("users.create");
  const students = await db.student.findMany({
    where: { userId: null },
    select: {
      id: true,
      instituteId: true,
      name: true,
      email: true,
      phone: true,
      studentId: true,
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });

  let createdCount = 0;
  for (const student of students) {
    const created = await db.$transaction(async (tx) => {
      const current = await tx.student.findUnique({
        where: { id: student.id },
        select: { userId: true },
      });
      if (!current || current.userId) return false;
      await createStudentUser(tx, student);
      return true;
    });
    if (created) createdCount += 1;
  }

  if (createdCount > 0) {
    await logAudit({
      action: "STUDENT_USER_ACCOUNTS_PROVISIONED",
      entity: "User",
      entityId: actor.id,
      details: `${actor.name} created login accounts for ${createdCount} existing students. First-time password is each student's Student ID.`,
    });
    revalidatePath("/", "layout");
    revalidatePath("/dashboard/users");
    revalidatePath("/users");
  }

  return { success: true, createdCount, skippedCount: students.length - createdCount };
}

export async function deleteStudentUser(userId: string) {
  await requirePermission("users.delete");
  await requirePermission("students.delete");
  const actor = await requireAuth(["SUPER_ADMIN"]);

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    include: { student: true },
  });
  if (!targetUser) throw new Error("Target user not found");
  if (targetUser.role !== "STUDENT" || !targetUser.student) {
    throw new Error("This account is not linked to a student record.");
  }
  const student = targetUser.student;

  await db.$transaction(async (tx) => {
    await tx.testSeriesRegistration.deleteMany({ where: { studentId: student.id } });
    await tx.student.delete({ where: { id: student.id } });
    await tx.user.delete({ where: { id: userId } });
  });

  await logAudit({
    action: "STUDENT_DELETED",
    entity: "Student",
    entityId: student.id,
    details: `${actor.name} deleted student ${student.name} (${student.studentId}) and all linked records through the user directory.`,
  });
  await logAudit({
    action: "USER_DELETED",
    entity: "User",
    entityId: userId,
    details: `${actor.name} deleted student login account ${targetUser.email}.`,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  revalidatePath("/dashboard/students");
  revalidatePath("/students");
  return { success: true };
}

// =========================================================================
// 2. GET SINGLE USER DETAILS (With Roles, Effective Permissions, Audit History)
// =========================================================================
export async function getUser(id: string) {
  const actor = await requirePermission("users.view");

  const user = await db.user.findUnique({
    where: { id },
    include: {
      institute: {
        select: { id: true, name: true, code: true, city: true },
      },
      userRoles: { include: { role: true } },
      userPermissions: { include: { permission: true } },
      teacher: {
        select: {
          id: true,
          teacherId: true,
          qualification: true,
          specialization: true,
          subjects: {
            include: {
              subject: true,
            },
          },
        },
      },
      student: { select: { id: true, studentId: true, admissionNo: true } },
      parent: { select: { id: true, relation: true, phone: true } },
      auditLogs: {
        take: 15,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          details: true,
          userName: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const effectivePermissions = await getEffectivePermissions(user);

  return {
    success: true,
    user: {
      ...user,
      passwordHash: undefined, // Never expose password hash
    },
    effectivePermissions,
    actorRole: actor.role,
  };
}

// Helper: Ensure User with role TEACHER is synced with Teacher table
async function syncTeacherProfile(
  tx: any,
  user: { id: string; name: string; email: string; phone?: string | null; status?: string; role: string },
  subjectIds?: string[],
  qualification?: string
) {
  const institute = await tx.institute.findFirst();
  if (!institute) return;

  const existingTeacher = await tx.teacher.findFirst({ where: { userId: user.id } });
  if (user.role === "TEACHER") {
    let teacherRecord = existingTeacher;
    if (existingTeacher) {
      teacherRecord = await tx.teacher.update({
        where: { id: existingTeacher.id },
        data: {
          name: user.name,
          email: user.email,
          phone: user.phone || "0000000000",
          status: user.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
          qualification: qualification !== undefined ? (qualification.trim() || null) : undefined,
        },
      });
    } else {
      const teacherCount = await tx.teacher.count();
      const teacherId = `TCH-${String(teacherCount + 1).padStart(3, "0")}`;
      teacherRecord = await tx.teacher.create({
        data: {
          instituteId: institute.id,
          userId: user.id,
          teacherId,
          name: user.name,
          email: user.email,
          phone: user.phone || "0000000000",
          status: user.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
          qualification: qualification?.trim() || null,
        },
      });
    }

    if (teacherRecord && subjectIds !== undefined) {
      await tx.teacherSubject.deleteMany({
        where: { teacherId: teacherRecord.id },
      });

      for (const sId of subjectIds) {
        await tx.teacherSubject.create({
          data: {
            teacherId: teacherRecord.id,
            subjectId: sId,
          },
        });
      }

      const subjects = await tx.subject.findMany({
        where: { id: { in: subjectIds } },
      });
      const specialization = subjects.map((s: any) => s.name).join(", ");
      await tx.teacher.update({
        where: { id: teacherRecord.id },
        data: { specialization: specialization || null },
      });
    }
  } else if (existingTeacher) {
    await tx.teacher.update({
      where: { id: existingTeacher.id },
      data: { status: "INACTIVE" },
    });
  }
}

// =========================================================================
// 3. CREATE USER (Super Admin & Admin Only; Admin Cannot Create Super Admin)
// =========================================================================
export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  branch?: string;
  instituteId?: string | null;
  notes?: string;
  password: string;
  confirmPassword?: string;
  avatarUrl?: string;
  subjectIds?: string[];
  qualification?: string;
}) {
  const actor = await requirePermission("users.create");

  if (data.role === "STUDENT") {
    throw new Error("Create student accounts through Admissions or the Students directory so each account is linked to a student record.");
  }

  // Security Rule: Admin cannot create Super Admin
  if (data.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Only Super Administrators have permission to create Super Admin accounts.");
  }

  // Validation
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  if (!firstName || !lastName) {
    throw new Error("First and last names are required.");
  }

  const email = data.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!data.password || data.password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  if (data.confirmPassword && data.password !== data.confirmPassword) {
    throw new Error("Password and confirmation password do not match.");
  }

  // Check unique email
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`An account with email "${email}" already exists.`);
  }

  const passwordHash = await hashPassword(data.password);
  const fullName = `${firstName} ${lastName}`;

  // Atomic creation: User + UserRole + Teacher (if TEACHER) + AuditLog
  const createdUser = await db.$transaction(async (tx) => {
    let resolvedInstituteId: string | null = null;
    let resolvedBranchName = data.branch?.trim() || "Main Campus";

    if (data.instituteId && data.instituteId !== "GLOBAL") {
      const targetInst = await tx.institute.findUnique({ where: { id: data.instituteId } });
      if (targetInst) {
        resolvedInstituteId = targetInst.id;
        resolvedBranchName = targetInst.name;
      }
    } else if (data.instituteId === "GLOBAL") {
      resolvedInstituteId = null;
      resolvedBranchName = "All Campuses (Central)";
    } else {
      const activeCampusId = await getActiveCampusId();
      if (activeCampusId) {
        const targetInst = await tx.institute.findUnique({ where: { id: activeCampusId } });
        if (targetInst) {
          resolvedInstituteId = targetInst.id;
          resolvedBranchName = targetInst.name;
        }
      }
    }

    const user = await tx.user.create({
      data: {
        instituteId: resolvedInstituteId,
        name: fullName,
        email,
        phone: data.phone?.trim() || null,
        passwordHash,
        role: data.role,
        status: data.status || "ACTIVE",
        branch: resolvedBranchName,
        notes: data.notes?.trim() || null,
        avatarUrl: data.avatarUrl || null,
      },
    });

    // Link relational role
    const roleRecord = await tx.role.findUnique({ where: { name: data.role } });
    if (roleRecord) {
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roleRecord.id,
        },
      });
    }

    // Automatically sync Teacher table if role is TEACHER
    await syncTeacherProfile(tx, user, data.subjectIds, data.qualification);

    return user;
  });

  await logAudit({
    action: "USER_CREATED",
    entity: "User",
    entityId: createdUser.id,
    details: `${actor.name} (${actor.role}) created user ${createdUser.name} with role ${createdUser.role} (Campus: ${createdUser.branch || "Central"})`,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  revalidatePath("/batches");
  revalidatePath("/dashboard/batches");
  revalidatePath("/timetable");
  return { success: true, user: { id: createdUser.id, name: createdUser.name, email: createdUser.email } };
}

// =========================================================================
// 4. UPDATE USER (Super Admin Protected)
// =========================================================================
export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: Role;
    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    branch?: string;
    instituteId?: string | null;
    notes?: string;
    avatarUrl?: string;
    newPassword?: string;
    subjectIds?: string[];
    qualification?: string;
  }
) {
  const actor = await requirePermission("users.update");

  const targetUser = await db.user.findUnique({ where: { id } });
  if (!targetUser) throw new Error("Target user not found");

  // Security Rule: Admin cannot edit Super Admin accounts
  if (targetUser.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Administrators are not permitted to modify Super Administrator accounts.");
  }

  // Security Rule: Admin cannot elevate user to Super Admin
  if (data.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Only Super Administrators can grant Super Admin role.");
  }
  if (targetUser.role === "STUDENT" && data.role && data.role !== "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: id }, select: { id: true } });
    if (student) {
      throw new Error("A linked student account must keep the STUDENT role. Change student details from the Students directory.");
    }
  }
  if (data.role === "STUDENT" && targetUser.role !== "STUDENT") {
    throw new Error("Create student accounts through Admissions or the Students directory so each account is linked to a student record.");
  }

  // Security Rule: The last active Super Admin cannot be demoted or deactivated
  if (targetUser.role === "SUPER_ADMIN") {
    const isDemoting = data.role && data.role !== "SUPER_ADMIN";
    const isDeactivating = data.status && data.status !== "ACTIVE";

    if (isDemoting || isDeactivating) {
      const activeSuperAdmins = await db.user.count({
        where: { role: "SUPER_ADMIN", status: "ACTIVE", isArchived: false },
      });
      if (activeSuperAdmins <= 1) {
        throw new Error("FORBIDDEN: Cannot alter role or deactivate the last remaining Super Administrator.");
      }
    }
  }

  const updateData: Record<string, any> = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
  if (data.branch !== undefined) updateData.branch = data.branch?.trim() || null;
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl || null;
  if (data.status) updateData.status = data.status;
  if (data.role) updateData.role = data.role;

  // Handle campus / institute allotment
  if (data.instituteId !== undefined) {
    if (!data.instituteId || data.instituteId === "GLOBAL") {
      updateData.instituteId = null;
      if (data.branch === undefined) {
        updateData.branch = "All Campuses (Central)";
      }
    } else {
      updateData.instituteId = data.instituteId;
      if (data.branch === undefined) {
        const inst = await db.institute.findUnique({ where: { id: data.instituteId } });
        if (inst) updateData.branch = inst.name;
      }
    }
  }

  if (data.email && data.email.trim().toLowerCase() !== targetUser.email) {
    const email = data.email.trim().toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing && existing.id !== id) {
      throw new Error(`Email "${email}" is already in use by another account.`);
    }
    updateData.email = email;
  }

  if (data.newPassword && data.newPassword.trim().length >= 6) {
    updateData.passwordHash = await hashPassword(data.newPassword.trim());
  }

  const updatedUser = await db.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id },
      data: updateData,
    });
    const linkedStudent = await tx.student.findUnique({
      where: { userId: id },
      select: { id: true },
    });
    if (linkedStudent && (data.name || data.phone !== undefined)) {
      await tx.student.update({
        where: { id: linkedStudent.id },
        data: {
          name: data.name?.trim(),
          phone: data.phone?.trim() || null,
        },
      });
    }

    // If role changed, sync UserRole
    if (data.role && data.role !== targetUser.role) {
      await tx.userRole.deleteMany({ where: { userId: id } });
      const roleRecord = await tx.role.findUnique({ where: { name: data.role } });
      if (roleRecord) {
        await tx.userRole.create({
          data: { userId: id, roleId: roleRecord.id },
        });
      }
    }

    // Automatically sync Teacher profile with subjectIds and qualification
    await syncTeacherProfile(tx, u, data.subjectIds, data.qualification);

    return u;
  });

  await logAudit({
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    details: `${actor.name} (${actor.role}) modified user ${targetUser.email}. Changes: ${Object.keys(updateData).join(", ")}`,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  revalidatePath("/batches");
  revalidatePath("/dashboard/batches");
  revalidatePath("/timetable");
  return { success: true, user: updatedUser };
}

// =========================================================================
// 5. CHANGE USER ROLE
// =========================================================================
export async function changeUserRole(userId: string, newRole: Role) {
  const actor = await requirePermission("users.role");

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new Error("Target user not found");
  if (targetUser.role === "STUDENT" && newRole !== "STUDENT") {
    const student = await db.student.findUnique({ where: { userId }, select: { id: true } });
    if (student) {
      throw new Error("A linked student account must keep the STUDENT role. Change student details from the Students directory.");
    }
  }
  if (newRole === "STUDENT" && targetUser.role !== "STUDENT") {
    throw new Error("Create student accounts through Admissions or the Students directory so each account is linked to a student record.");
  }

  if (targetUser.role === newRole) return { success: true };

  // Rule: Only Super Admin can assign Super Admin
  if (newRole === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Only Super Administrators can assign Super Admin role.");
  }

  // Rule: Admin cannot demote Super Admin
  if (targetUser.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Administrators cannot modify Super Admin roles.");
  }

  // Rule: Last Super Admin protection
  if (targetUser.role === "SUPER_ADMIN" && newRole !== "SUPER_ADMIN") {
    const activeSuperAdmins = await db.user.count({
      where: { role: "SUPER_ADMIN", status: "ACTIVE", isArchived: false },
    });
    if (activeSuperAdmins <= 1) {
      throw new Error("FORBIDDEN: Cannot demote the last remaining Super Administrator.");
    }
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    await tx.userRole.deleteMany({ where: { userId } });
    const roleRecord = await tx.role.findUnique({ where: { name: newRole } });
    if (roleRecord) {
      await tx.userRole.create({
        data: { userId, roleId: roleRecord.id },
      });
    }

    // Sync Teacher profile
    await syncTeacherProfile(tx, {
      id: userId,
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      status: targetUser.status,
      role: newRole,
    });
  });

  await logAudit({
    action: "ROLE_CHANGED",
    entity: "User",
    entityId: userId,
    details: `${actor.name} changed role for ${targetUser.name} from ${targetUser.role} to ${newRole}`,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  revalidatePath("/batches");
  revalidatePath("/dashboard/batches");
  revalidatePath("/timetable");
  return { success: true };
}

// =========================================================================
// 6. CHANGE USER STATUS (Activate, Deactivate, Suspend)
// =========================================================================
export async function changeUserStatus(userId: string, newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
  const actor = await requirePermission("users.status");

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new Error("Target user not found");

  // Security Rule: Admin cannot deactivate Super Admin
  if (targetUser.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Administrators are not permitted to deactivate Super Administrator accounts.");
  }

  // Security Rule: Last active Super Admin protection
  if (targetUser.role === "SUPER_ADMIN" && newStatus !== "ACTIVE") {
    const activeSuperAdmins = await db.user.count({
      where: { role: "SUPER_ADMIN", status: "ACTIVE", isArchived: false },
    });
    if (activeSuperAdmins <= 1) {
      throw new Error("FORBIDDEN: Cannot deactivate or suspend the last active Super Administrator.");
    }
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    const teacher = await tx.teacher.findFirst({ where: { userId } });
    if (teacher) {
      await tx.teacher.update({
        where: { id: teacher.id },
        data: { status: newStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE" },
      });
    }
  });

  await logAudit({
    action: `USER_${newStatus}`,
    entity: "User",
    entityId: userId,
    details: `${actor.name} changed status for ${targetUser.email} from ${targetUser.status} to ${newStatus}`,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  revalidatePath("/batches");
  revalidatePath("/dashboard/batches");
  revalidatePath("/timetable");
  return { success: true };
}

// =========================================================================
// 7. ARCHIVE USER (Soft-Delete)
// =========================================================================
export async function archiveUser(userId: string) {
  const actor = await requirePermission("users.delete");

  const targetUser = await db.user.findUnique({ where: { id: userId }, include: { student: true } });
  if (!targetUser) throw new Error("Target user not found");

  // Rule: Super Admin cannot be deleted/archived
  if (targetUser.role === "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Super Administrator accounts are protected and cannot be archived or deleted.");
  }

  // Rule: Admin cannot delete other Admins unless Super Admin
  if (targetUser.role === "ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Only Super Administrators can archive Administrator accounts.");
  }
  if (targetUser.role === "STUDENT" && targetUser.student) {
    return deleteStudentUser(userId);
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { isArchived: true, status: "INACTIVE" },
    });

    const teacher = await tx.teacher.findFirst({ where: { userId } });
    if (teacher) {
      await tx.teacher.update({
        where: { id: teacher.id },
        data: { status: "INACTIVE" },
      });
    }
  });

  await logAudit({
    action: "USER_ARCHIVED",
    entity: "User",
    entityId: userId,
    details: `${actor.name} archived user account ${targetUser.email}`,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  revalidatePath("/batches");
  revalidatePath("/dashboard/batches");
  revalidatePath("/timetable");
  return { success: true };
}

// =========================================================================
// 8. BULK UPDATE STATUS (Protected against Super Admin)
// =========================================================================
export async function bulkUpdateUsersStatus(
  userIds: string[],
  newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
) {
  const actor = await requirePermission("users.status");
  if (!userIds || userIds.length === 0) return { success: true, count: 0 };

  const targetUsers = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, role: true, email: true },
  });

  // Filter out Super Admins if actor is not Super Admin
  const safeIds: string[] = [];
  for (const u of targetUsers) {
    if (u.role === "SUPER_ADMIN") {
      if (actor.role !== "SUPER_ADMIN") continue;
      // If actor is Super Admin, check if this is the last one
      const activeSuperAdmins = await db.user.count({
        where: { role: "SUPER_ADMIN", status: "ACTIVE", isArchived: false },
      });
      if (activeSuperAdmins <= 1 && newStatus !== "ACTIVE") continue;
    }
    safeIds.push(u.id);
  }

  if (safeIds.length === 0) {
    throw new Error("FORBIDDEN: None of the selected users can be modified due to permission protection.");
  }

  await db.user.updateMany({
    where: { id: { in: safeIds } },
    data: { status: newStatus },
  });

  await logAudit({
    action: `BULK_USER_${newStatus}`,
    entity: "User",
    details: `${actor.name} set status ${newStatus} for ${safeIds.length} users.`,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  return { success: true, count: safeIds.length };
}

// =========================================================================
// 9. GET & UPDATE USER CUSTOM PERMISSIONS
// =========================================================================
export async function getUserPermissions(userId: string) {
  const actor = await requirePermission("users.permissions");
  await syncPermissionCatalog();

  const [allPermissions, user, userOverrides] = await Promise.all([
    db.permission.findMany({ orderBy: [{ module: "asc" }, { code: "asc" }] }),
    db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true } }),
    db.userPermission.findMany({ where: { userId }, include: { permission: true } }),
  ]);

  if (!user) throw new Error("User not found");

  const roleCode = user.role as Role;
  let roleBasePermissions = (ROLE_PERMISSIONS[roleCode] || []) as string[];
  {
    const dbRole = await db.role.findUnique({
      where: { name: user.role },
      include: { permissions: { include: { permission: true } } },
    });
    if (dbRole) {
      roleBasePermissions = dbRole.permissions.map((rp) => rp.permission.code);
    }
  }

  const permissionsList = allPermissions.map((p) => {
    const isDefaultByRole = roleBasePermissions.includes(p.code);
    const override = userOverrides.find((uo) => uo.permissionId === p.id);

    let effective = isDefaultByRole;
    let overrideState: "DEFAULT" | "GRANTED" | "REVOKED" = "DEFAULT";

    if (override) {
      effective = override.granted;
      overrideState = override.granted ? "GRANTED" : "REVOKED";
    }

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      module: p.module,
      description: p.description,
      isDefaultByRole,
      overrideState,
      effective,
    };
  });

  return {
    success: true,
    user,
    permissions: permissionsList,
    actorRole: actor.role,
  };
}

export async function updateUserPermissions(
  userId: string,
  overrides: { permissionId: string; overrideState: "DEFAULT" | "GRANTED" | "REVOKED" }[]
) {
  const actor = await requirePermission("users.permissions");

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new Error("User not found");

  if (targetUser.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Cannot alter Super Admin permissions.");
  }

  await db.$transaction(async (tx) => {
    for (const item of overrides) {
      if (item.overrideState === "DEFAULT") {
        await tx.userPermission.deleteMany({
          where: { userId, permissionId: item.permissionId },
        });
      } else {
        const granted = item.overrideState === "GRANTED";
        await tx.userPermission.upsert({
          where: {
            userId_permissionId: { userId, permissionId: item.permissionId },
          },
          update: { granted },
          create: { userId, permissionId: item.permissionId, granted },
        });
      }
    }
  });

  await logAudit({
    action: "USER_PERMISSIONS_UPDATED",
    entity: "User",
    entityId: userId,
    details: `${actor.name} updated custom permissions for user ${targetUser.email}`,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/users");
  revalidatePath("/users");
  return { success: true };
}

// =========================================================================
// 10. EXPORT USERS CSV
// =========================================================================
export async function exportUsersCSV() {
  await requirePermission("exports.view");
  await requirePermission("users.view");

  const users = await db.user.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      branch: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  const headers = ["ID", "Full Name", "Email", "Phone", "Role", "Status", "Branch", "Created At", "Last Login"];
  const rows = users.map((u) => [
    `"${u.id}"`,
    `"${u.name.replace(/"/g, '""')}"`,
    `"${u.email}"`,
    `"${u.phone || "-"}"`,
    `"${u.role}"`,
    `"${u.status}"`,
    `"${u.branch || "Main Campus"}"`,
    `"${u.createdAt.toISOString().split("T")[0]}"`,
    `"${u.lastLoginAt ? u.lastLoginAt.toISOString().split("T")[0] : "Never"}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  return { success: true, csv, filename: `futurex_users_${new Date().toISOString().split("T")[0]}.csv` };
}
