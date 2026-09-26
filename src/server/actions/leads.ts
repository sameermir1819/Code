"use server";
import { requireStaffPermission } from "@/lib/auth";

import { db } from "@/lib/db";

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

export async function getLeadTestSeriesOptions() {
  await requireStaffPermission("leads.view");
  return db.testSeries.findMany({
    where: {
      status: { in: ["ACTIVE", "UPCOMING"] },
    },
    select: {
      id: true,
      instituteId: true,
      title: true,
      code: true,
      fee: true,
      institute: { select: { name: true, city: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

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
  await requireStaffPermission("leads.view");

  const where: Record<string, any> = {};
  const andConditions: any[] = [];

  // Campus scoping:
  // If specific campusId is requested (e.g. from filter dropdown or URL):
  if (campusId && !["ALL", "GLOBAL"].includes(campusId)) {
    andConditions.push({
      OR: [
        { instituteId: campusId },
        { source: "WEBSITE" },
        { instituteId: null },
      ],
    });
  }
  // (SUPER_ADMIN sees all leads across all campuses by default)

  if (search && search.trim() !== "") {
    const q = search.trim();
    andConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
        { parentName: { contains: q, mode: "insensitive" } },
        { courseInterest: { contains: q, mode: "insensitive" } },
        { currentSchool: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
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
  try {
    await requireStaffPermission("leads.view");

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
      return { success: false, error: "Lead record not found.", lead: null };
    }

    return { success: true, lead };
  } catch (err: any) {
    console.error(`Failed to fetch lead ${id}:`, err);
    return { success: false, error: err.message || "Failed to fetch lead.", lead: null };
  }
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
  interestType?: "ADMISSION" | "TEST_SERIES";
  testSeriesId?: string | null;
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
  const actor = await requireStaffPermission("leads.manage");
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
  let selectedTestSeries: { id: string; instituteId: string } | null = null;
  if (data.interestType === "TEST_SERIES") {
    if (!data.testSeriesId) throw new Error("Please select a Test Series.");
    selectedTestSeries = await db.testSeries.findFirst({
      where: {
        id: data.testSeriesId,
        status: { in: ["ACTIVE", "UPCOMING"] },
        ...(actor.role !== "SUPER_ADMIN" && actor.instituteId
          ? { instituteId: actor.instituteId }
          : {}),
      },
      select: { id: true, instituteId: true },
    });
    if (!selectedTestSeries) throw new Error("Selected Test Series is not available.");
  }

  const lead = await db.lead.create({
    data: {
      instituteId: selectedTestSeries?.instituteId || (activeCampusId && activeCampusId !== "ALL" ? activeCampusId : null),
      name: data.name.trim(),
      phone: cleanPhone,
      email: data.email?.trim().toLowerCase() || null,
      parentName: data.parentName?.trim() || null,
      parentPhone: data.parentPhone?.trim() || null,
      courseInterest: data.courseInterest?.trim() || null,
      interestType: data.interestType || "ADMISSION",
      testSeriesId: data.interestType === "TEST_SERIES" ? data.testSeriesId || null : null,
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
    interestType?: "ADMISSION" | "TEST_SERIES";
    testSeriesId?: string | null;
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
    convertedTestSeriesRegistrationId?: string | null;
  }
) {
  const actor = await requireStaffPermission("leads.manage");

  const existing = await db.lead.findUnique({ where: { id } });
  if (!existing) throw new Error("Lead not found.");
  const updateData: Record<string, any> = {};

  const effectiveInterestType = data.interestType || existing.interestType || "ADMISSION";
  const effectiveTestSeriesId = data.testSeriesId !== undefined
    ? data.testSeriesId
    : existing.testSeriesId;
  if (effectiveInterestType === "TEST_SERIES") {
    if (!effectiveTestSeriesId) throw new Error("Please select a Test Series.");
    const series = await db.testSeries.findFirst({
      where: {
        id: effectiveTestSeriesId,
        status: { in: ["ACTIVE", "UPCOMING"] },
        ...(actor.role !== "SUPER_ADMIN" && actor.instituteId
          ? { instituteId: actor.instituteId }
          : {}),
      },
      select: { id: true, instituteId: true },
    });
    if (!series) throw new Error("Selected Test Series is not available.");
    updateData.instituteId = series.instituteId;
  }

  if (data.name) updateData.name = data.name.trim();
  if (data.phone) updateData.phone = data.phone.trim();
  if (data.email !== undefined) updateData.email = data.email?.trim().toLowerCase() || null;
  if (data.parentName !== undefined) updateData.parentName = data.parentName?.trim() || null;
  if (data.parentPhone !== undefined) updateData.parentPhone = data.parentPhone?.trim() || null;
  if (data.courseInterest !== undefined) updateData.courseInterest = data.courseInterest?.trim() || null;
  if (data.interestType !== undefined) updateData.interestType = data.interestType;
  if (data.interestType === "ADMISSION") updateData.testSeriesId = null;
  else if (data.testSeriesId !== undefined) updateData.testSeriesId = data.testSeriesId || null;
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
  if (data.convertedTestSeriesRegistrationId !== undefined) {
    updateData.convertedTestSeriesRegistrationId = data.convertedTestSeriesRegistrationId;
  }
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
  const actor = await requireStaffPermission("leads.manage");

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
// 5B. GET RECENT LEAD INTERACTION LOGS ACROSS ALL LEADS
// =========================================================================
export async function getRecentLeadFollowUps(limit = 100) {
  try {
    const actor = await requireStaffPermission("leads.view");
    const campusId = await getActiveCampusId();

    const where: any = {};
    if (campusId && campusId !== "ALL" && actor.role !== "SUPER_ADMIN") {
      where.lead = {
        OR: [
          { instituteId: campusId },
          { instituteId: null },
          { source: "WEBSITE" },
        ],
      };
    }

    const logs = await db.leadFollowUp.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            courseInterest: true,
            status: true,
            priority: true,
            source: true,
            institute: { select: { id: true, name: true, code: true, city: true } },
          },
        },
      },
    });

    return { success: true, logs };
  } catch (err: any) {
    console.error("Failed to load recent lead follow-ups:", err);
    return { success: false, error: err.message || "Failed to load logs.", logs: [] };
  }
}

// =========================================================================
// 6. DELETE LEAD
// =========================================================================
export async function deleteLead(id: string) {
  const actor = await requireStaffPermission("leads.delete");

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
  const actor = await requireStaffPermission("leads.view");
  const activeCampusId = await getActiveCampusId();

  const where: Record<string, any> = {};
  if (actor.role !== "SUPER_ADMIN" && activeCampusId && activeCampusId !== "ALL") {
    where.OR = [
      { instituteId: activeCampusId },
      { source: "WEBSITE" },
      { instituteId: null },
    ];
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
// 8. PUBLIC ADMISSIONS: GET BATCHES / TEST SERIES & SUBMIT ONLINE ENQUIRY
// =========================================================================
export async function getPublicAdmissionData() {
  const [institute, campuses, batches, testSeries] = await Promise.all([
    db.institute.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        city: true,
        logoUrl: true,
      },
    }),
    db.institute.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        phone: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.batch.findMany({
      where: { status: { in: ["ACTIVE", "UPCOMING"] } },
      select: {
        id: true,
        instituteId: true,
        name: true,
        code: true,
        capacity: true,
      },
      orderBy: { name: "asc" },
    }),
    db.testSeries.findMany({
      where: { status: { in: ["ACTIVE", "UPCOMING"] } },
      select: {
        id: true,
        instituteId: true,
        title: true,
        code: true,
        targetExam: true,
        fee: true,
      },
      orderBy: { title: "asc" },
    }),
  ]);

  return { institute, campuses, batches, testSeries };
}

export async function submitPublicAdmissionEnquiry(data: {
  name: string;
  phone: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  interestType?: "ADMISSION" | "TEST_SERIES";
  batchId?: string;
  testSeriesId?: string;
  campusId?: string;
  instituteId?: string;
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

  let targetInstituteId = data.campusId || data.instituteId;

  if (!targetInstituteId) {
    const defaultInstitute = await db.institute.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    targetInstituteId = defaultInstitute?.id;
  }

  // Lookup campus name if available
  const selectedCampus = targetInstituteId
    ? await db.institute.findUnique({
        where: { id: targetInstituteId },
        select: { name: true, city: true, code: true },
      })
    : null;

  const campusTag = selectedCampus
    ? `${selectedCampus.city || selectedCampus.name} (${selectedCampus.code})`
    : null;

  const interestType = data.interestType === "TEST_SERIES" ? "TEST_SERIES" : "ADMISSION";
  let interestLabel = "General Admission Inquiry";
  let selectedTestSeriesId: string | null = null;

  if (interestType === "TEST_SERIES") {
    if (!data.testSeriesId) return { success: false, error: "Please select a Test Series." };
    const series = await db.testSeries.findFirst({
      where: {
        id: data.testSeriesId,
        status: { in: ["ACTIVE", "UPCOMING"] },
        ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
      },
      select: { id: true, instituteId: true, title: true },
    });
    if (!series) return { success: false, error: "Selected Test Series is not available at this campus." };
    targetInstituteId = series.instituteId;
    selectedTestSeriesId = series.id;
    interestLabel = series.title;
  } else {
    if (!data.batchId) return { success: false, error: "Please select a Batch." };
    const batch = await db.batch.findFirst({
      where: {
        id: data.batchId,
        status: { in: ["ACTIVE", "UPCOMING"] },
        ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
      },
      select: { id: true, instituteId: true, name: true },
    });
    if (!batch) return { success: false, error: "Selected Batch is not available at this campus." };
    targetInstituteId = batch.instituteId;
    interestLabel = batch.name;
  }

  const lead = await db.lead.create({
    data: {
      instituteId: targetInstituteId || null,
      name: data.name.trim(),
      phone: cleanPhone,
      email: data.email?.trim().toLowerCase() || null,
      parentName: data.parentName?.trim() || null,
      parentPhone: data.parentPhone?.trim() || null,
      courseInterest: interestLabel,
      interestType,
      testSeriesId: selectedTestSeriesId,
      currentClass: data.currentClass?.trim() || null,
      currentSchool: data.currentSchool?.trim() || null,
      source: "WEBSITE",
      status: "NEW",
      priority: "HOT", // Online website applications are high-intent leads
      notes:
        data.notes?.trim() ||
        (campusTag ? `Preferred Campus: ${campusTag}` : data.city ? `City: ${data.city}` : null),
    },
  });

  // Automatically record initial follow-up interaction
  await db.leadFollowUp.create({
    data: {
      leadId: lead.id,
      status: "COMPLETED",
      contactMethod: "WEBSITE",
      notes: `Online ${interestType === "TEST_SERIES" ? "Test Series" : "batch admission"} application received via Website portal for ${interestLabel}.${campusTag ? ` Campus Preference: ${campusTag}.` : ""}${data.city ? ` City: ${data.city}.` : ""}${data.notes ? ` Notes: ${data.notes}` : ""}`,
      counselorName: "Online Admission Desk",
    },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/(dashboard)/leads");

  return {
    success: true,
    leadId: lead.id,
    name: lead.name,
    phone: lead.phone,
    course: lead.courseInterest,
    campus: campusTag,
  };
}
