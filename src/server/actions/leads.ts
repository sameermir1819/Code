"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "./audit";
import { getActiveCampusId } from "./campus";
import { revalidatePath } from "next/cache";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "COUNSELING_SCHEDULED"
  | "TRIAL_CLASS"
  | "CONVERTED"
  | "LOST";

export type LeadPriority = "LOW" | "MEDIUM" | "HIGH" | "HOT";

export type LeadSource =
  | "WALK_IN"
  | "WEBSITE"
  | "CALL"
  | "SOCIAL_MEDIA"
  | "REFERRAL"
  | "NEWSPAPER"
  | "OTHER";

// =========================================================================
// 1. GET LEADS (Paginated, Searchable, Filterable, Scoped)
// =========================================================================
export async function getLeads({
  search = "",
  status = "ALL",
  priority = "ALL",
  source = "ALL",
  page = 1,
  limit = 25,
  campusId,
}: {
  search?: string;
  status?: string;
  priority?: string;
  source?: string;
  page?: number;
  limit?: number;
  campusId?: string;
} = {}) {
  const actor = await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"]);
  const activeCampusId = campusId || (await getActiveCampusId());

  const where: Record<string, any> = {};

  if (activeCampusId && activeCampusId !== "ALL") {
    where.instituteId = activeCampusId;
  }

  if (search && search.trim() !== "") {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
      { parentName: { contains: q, mode: "insensitive" } },
      { courseInterest: { contains: q, mode: "insensitive" } },
      { currentSchool: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (priority && priority !== "ALL") {
    where.priority = priority;
  }

  if (source && source !== "ALL") {
    where.source = source;
  }

  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (Math.max(1, page) - 1) * safeLimit;

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        institute: {
          select: { id: true, name: true, code: true, city: true },
        },
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        _count: {
          select: { followUps: true },
        },
      },
    }),
    db.lead.count({ where }),
  ]);

  return {
    success: true,
    leads,
    total,
    page,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
}

// =========================================================================
// 2. GET SINGLE LEAD WITH FULL TIMELINE
// =========================================================================
export async function getLead(id: string) {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"]);

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      institute: {
        select: { id: true, name: true, code: true, city: true },
      },
      followUps: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) {
    throw new Error("Lead record not found.");
  }

  return { success: true, lead };
}

// =========================================================================
// 3. CREATE LEAD (Inquiry / Query)
// =========================================================================
export async function createLead(data: {
  name: string;
  phone: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  courseInterest?: string;
  currentClass?: string;
  currentSchool?: string;
  schoolCollege?: string;
  source?: LeadSource | string;
  status?: LeadStatus | string;
  priority?: LeadPriority | string;
  assignedTo?: string;
  nextFollowUp?: string | Date | null;
  nextFollowUpDate?: string | Date | null;
  notes?: string;
}) {
  const actor = await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"]);
  const activeCampusId = await getActiveCampusId();

  if (!data.name || !data.name.trim()) {
    throw new Error("Student or inquirer name is required.");
  }

  if (!data.phone || !data.phone.trim()) {
    throw new Error("Phone number is required for follow-up communications.");
  }

  const cleanPhone = data.phone.trim();
  const nextDateVal = data.nextFollowUp || data.nextFollowUpDate;
  const schoolVal = data.currentSchool || data.schoolCollege;

  const lead = await db.lead.create({
    data: {
      instituteId: activeCampusId && activeCampusId !== "ALL" ? activeCampusId : null,
      name: data.name.trim(),
      phone: cleanPhone,
      email: data.email?.trim().toLowerCase() || null,
      parentName: data.parentName?.trim() || null,
      parentPhone: data.parentPhone?.trim() || null,
      courseInterest: data.courseInterest?.trim() || null,
      currentClass: data.currentClass?.trim() || null,
      currentSchool: schoolVal?.trim() || null,
      source: data.source || "WALK_IN",
      status: data.status || "NEW",
      priority: data.priority || "MEDIUM",
      assignedTo: data.assignedTo?.trim() || null,
      nextFollowUp: nextDateVal ? new Date(nextDateVal) : null,
      notes: data.notes?.trim() || null,
    },
  });

  // Log initial follow-up record if notes provided
  if (data.notes && data.notes.trim()) {
    await db.leadFollowUp.create({
      data: {
        leadId: lead.id,
        status: "COMPLETED",
        contactMethod: data.source === "CALL" ? "PHONE_CALL" : "IN_PERSON",
        notes: `Initial Inquiry: ${data.notes.trim()}`,
        counselorName: actor.name,
      },
    });
  }

  await logAudit({
    action: "LEAD_CREATED",
    entity: "Lead",
    entityId: lead.id,
    details: `${actor.name} registered inquiry for ${lead.name} (${lead.phone}) for ${lead.courseInterest || "General Inquiry"}.`,
  });

  revalidatePath("/leads");
  return { success: true, lead };
}

// =========================================================================
// 4. UPDATE LEAD
// =========================================================================
export async function updateLead(
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    courseInterest?: string | null;
    currentClass?: string | null;
    currentSchool?: string | null;
    schoolCollege?: string | null;
    source?: string;
    status?: LeadStatus | string;
    priority?: LeadPriority | string;
    assignedTo?: string | null;
    nextFollowUp?: string | Date | null;
    nextFollowUpDate?: string | Date | null;
    notes?: string | null;
    isConverted?: boolean;
    convertedStudentId?: string | null;
  }
) {
  const actor = await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"]);

  const existing = await db.lead.findUnique({ where: { id } });
  if (!existing) throw new Error("Lead not found.");

  const updateData: Record<string, any> = {};

  if (data.name) updateData.name = data.name.trim();
  if (data.phone) updateData.phone = data.phone.trim();
  if (data.email !== undefined) updateData.email = data.email?.trim().toLowerCase() || null;
  if (data.parentName !== undefined) updateData.parentName = data.parentName?.trim() || null;
  if (data.parentPhone !== undefined) updateData.parentPhone = data.parentPhone?.trim() || null;
  if (data.courseInterest !== undefined) updateData.courseInterest = data.courseInterest?.trim() || null;
  if (data.currentClass !== undefined) updateData.currentClass = data.currentClass?.trim() || null;
  const schoolVal = data.currentSchool !== undefined ? data.currentSchool : data.schoolCollege;
  if (schoolVal !== undefined) updateData.currentSchool = schoolVal?.trim() || null;
  if (data.source) updateData.source = data.source;
  if (data.status) {
    updateData.status = data.status;
    if (data.status === "CONVERTED") updateData.isConverted = true;
  }
  if (data.isConverted !== undefined) updateData.isConverted = data.isConverted;
  if (data.convertedStudentId !== undefined) updateData.convertedStudentId = data.convertedStudentId;
  if (data.priority) updateData.priority = data.priority;
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo?.trim() || null;
  const nextDateVal = data.nextFollowUp !== undefined ? data.nextFollowUp : data.nextFollowUpDate;
  if (nextDateVal !== undefined) {
    updateData.nextFollowUp = nextDateVal ? new Date(nextDateVal) : null;
  }
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

  const updated = await db.lead.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/leads");
  return { success: true, lead: updated };
}

// =========================================================================
// 5. ADD FOLLOW-UP LOG
// =========================================================================
export async function addLeadFollowUp(
  leadId: string,
  data: {
    contactMethod: "PHONE_CALL" | "WHATSAPP" | "IN_PERSON" | "EMAIL" | "SMS";
    notes: string;
    newStatus?: LeadStatus;
    nextFollowUpDate?: string | null;
  }
) {
  const actor = await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"]);

  if (!data.notes || !data.notes.trim()) {
    throw new Error("Follow-up discussion notes are required.");
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found.");

  const [followUp, updatedLead] = await db.$transaction(async (tx) => {
    const f = await tx.leadFollowUp.create({
      data: {
        leadId,
        contactMethod: data.contactMethod,
        notes: data.notes.trim(),
        counselorName: actor.name,
        scheduledFor: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
      },
    });

    const leadUpdates: Record<string, any> = {
      nextFollowUp: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
    };

    if (data.newStatus && data.newStatus !== lead.status) {
      leadUpdates.status = data.newStatus;
      if (data.newStatus === "CONVERTED") leadUpdates.isConverted = true;
    }

    const u = await tx.lead.update({
      where: { id: leadId },
      data: leadUpdates,
    });

    return [f, u];
  });

  revalidatePath("/leads");
  return { success: true, followUp, lead: updatedLead };
}

// =========================================================================
// 6. DELETE LEAD
// =========================================================================
export async function deleteLead(id: string) {
  const actor = await requireAuth(["SUPER_ADMIN", "ADMIN"]);

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) throw new Error("Lead record not found.");

  await db.lead.delete({ where: { id } });

  await logAudit({
    action: "LEAD_DELETED",
    entity: "Lead",
    entityId: id,
    details: `${actor.name} removed inquiry for ${lead.name} (${lead.phone}).`,
  });

  revalidatePath("/leads");
  return { success: true };
}

// =========================================================================
// 7. GET LEADS CRM METRICS
// =========================================================================
export async function getLeadsMetrics() {
  await requireAuth(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"]);
  const activeCampusId = await getActiveCampusId();

  const where: Record<string, any> = {};
  if (activeCampusId && activeCampusId !== "ALL") {
    where.instituteId = activeCampusId;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const [
    totalLeads,
    newThisMonth,
    convertedCount,
    followUpsDueToday,
    hotLeadsCount,
  ] = await Promise.all([
    db.lead.count({ where }),
    db.lead.count({ where: { ...where, createdAt: { gte: startOfMonth } } }),
    db.lead.count({ where: { ...where, isConverted: true } }),
    db.lead.count({
      where: {
        ...where,
        nextFollowUp: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CONVERTED", "LOST"] },
      },
    }),
    db.lead.count({
      where: {
        ...where,
        priority: { in: ["HIGH", "HOT"] },
        status: { notIn: ["CONVERTED", "LOST"] },
      },
    }),
  ]);

  const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;

  return {
    totalLeads,
    total: totalLeads,
    newThisMonth,
    convertedCount,
    followUpsDueToday,
    hotLeadsCount,
    hotLeads: hotLeadsCount,
    conversionRate,
  };
}

// =========================================================================
// 8. PUBLIC ADMISSIONS: GET COURSES & SUBMIT ONLINE ENQUIRY (NO AUTH REQUIRED)
// =========================================================================
export async function getPublicAdmissionData() {
  const [institute, courses] = await Promise.all([
    db.institute.findFirst({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        city: true,
        logoUrl: true,
      },
    }),
    db.course.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        code: true,
        gradeClass: true,
        duration: true,
        standardFee: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return { institute, courses };
}

export async function submitPublicAdmissionEnquiry(data: {
  name: string;
  phone: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  courseInterest: string;
  currentClass?: string;
  currentSchool?: string;
  city?: string;
  notes?: string;
}) {
  if (!data.name || !data.name.trim()) {
    return { success: false, error: "Please enter your full name." };
  }
  if (!data.phone || !data.phone.trim()) {
    return { success: false, error: "Please enter a valid mobile number." };
  }

  const cleanPhone = data.phone.trim().replace(/[^\d+]/g, "");
  if (cleanPhone.length < 10) {
    return { success: false, error: "Please enter a valid 10-digit mobile number." };
  }

  const defaultInstitute = await db.institute.findFirst({ select: { id: true } });

  const lead = await db.lead.create({
    data: {
      instituteId: defaultInstitute?.id || null,
      name: data.name.trim(),
      phone: cleanPhone,
      email: data.email?.trim().toLowerCase() || null,
      parentName: data.parentName?.trim() || null,
      parentPhone: data.parentPhone?.trim() || null,
      courseInterest: data.courseInterest?.trim() || "General Admission Inquiry",
      currentClass: data.currentClass?.trim() || null,
      currentSchool: data.currentSchool?.trim() || null,
      source: "WEBSITE",
      status: "NEW",
      priority: "HOT", // Online website applications are high-intent leads
      notes: data.notes?.trim() || (data.city ? `City/Area: ${data.city}` : null),
    },
  });

  // Automatically record initial follow-up interaction
  await db.leadFollowUp.create({
    data: {
      leadId: lead.id,
      status: "COMPLETED",
      contactMethod: "WEBSITE",
      notes: `Online Admission Application received via Website portal for ${data.courseInterest || "General"}.${data.city ? ` City: ${data.city}.` : ""}${data.notes ? ` Notes: ${data.notes}` : ""}`,
      counselorName: "Online Admission Desk",
    },
  });

  revalidatePath("/leads");

  return {
    success: true,
    leadId: lead.id,
    name: lead.name,
    phone: lead.phone,
    course: lead.courseInterest,
  };
}
