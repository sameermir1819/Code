import type { PermissionCode } from "./permissions";

const relations: Record<string, PermissionCode> = {
  payments: "fees.view", feePlans: "fees.view", refunds: "fees.view",
  marks: "results.view", results: "results.view", attendances: "attendance.view",
  timetableSlots: "timetable.view", studyMaterials: "materials.view",
};

// Composite detail pages must not expose revoked modules through nested data.
export function redactRelatedData<T>(value: T, permissions: readonly string[]): T {
  if (value === null || typeof value !== "object" || value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((item) => redactRelatedData(item, permissions)) as T;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const code = relations[key];
    if (code && !permissions.includes(code)) output[key] = Array.isArray(item) ? [] : typeof item === "number" ? 0 : null;
    else if (!permissions.includes("fees.view") && ["feeAmount", "receiptNo", "paymentStatus", "paymentMethod", "paidAt"].includes(key)) {
      output[key] = typeof item === "number" ? 0 : key === "paymentStatus" ? "RESTRICTED" : null;
    } else output[key] = redactRelatedData(item, permissions);
  }
  return output as T;
}
