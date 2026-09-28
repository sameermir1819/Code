import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type ReceiptVerificationPayload = {
  receiptNo: string;
  studentId: string;
};

function verificationSecret() {
  const secret = process.env.RECEIPT_QR_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Receipt QR verification secret is not configured");
  return secret;
}

function signature(payload: string) {
  return createHmac("sha256", verificationSecret()).update(payload).digest("base64url");
}

export function createReceiptVerificationPath(receiptNo: string, studentId: string) {
  const payload = Buffer.from(JSON.stringify({ receiptNo, studentId } satisfies ReceiptVerificationPayload)).toString("base64url");
  return `/verify/receipt?token=${encodeURIComponent(`${payload}.${signature(payload)}`)}`;
}

export function readReceiptVerificationToken(token: unknown): ReceiptVerificationPayload | null {
  if (typeof token !== "string" || !token || token.length > 2048) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const payload = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);
  const expectedSignature = signature(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<ReceiptVerificationPayload>;
    if (typeof parsed.receiptNo !== "string" || typeof parsed.studentId !== "string") return null;
    if (!parsed.receiptNo || !parsed.studentId) return null;
    return { receiptNo: parsed.receiptNo, studentId: parsed.studentId };
  } catch {
    return null;
  }
}
