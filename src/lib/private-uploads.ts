import { resolve, relative, isAbsolute, extname } from "path";
import { readFile, realpath } from "fs/promises";
import { createHmac, timingSafeEqual } from "crypto";

export const uploadRoot = resolve(process.cwd(), ".data", "uploads");
export const legacyUploadRoot = resolve(process.cwd(), "public", "uploads");
export function uploadPath(root: string, parts: string[]) {
  if (!parts.length || parts.some((part) => !/^[a-zA-Z0-9._-]+$/.test(part) || part === "." || part === "..")) throw new Error("Invalid upload path");
  const file = resolve(root, ...parts);
  const rel = relative(root, file);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error("Invalid upload path");
  return file;
}
export async function existingUploadPath(root: string, parts: string[]) {
  const candidate = uploadPath(root, parts);
  try {
    const actual = await realpath(candidate);
    const rel = relative(await realpath(root), actual);
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error("Invalid upload path");
    return actual;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
export async function uploadOwner(file: string): Promise<string | null> {
  try {
    const metadata = JSON.parse(await readFile(`${file}.json`, "utf8"));
    return typeof metadata.userId === "string" ? metadata.userId : null;
  } catch { return null; }
}

const MATERIAL_BUCKET = "study-materials";
let materialBucketReady: Promise<void> | null = null;

function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url, key } : null;
}

export function hasPersistentMaterialStorage() {
  return Boolean(storageConfig());
}

function storageHeaders(config: { key: string }) {
  return { apikey: config.key, Authorization: `Bearer ${config.key}` };
}

async function ensureMaterialBucket() {
  const config = storageConfig();
  if (!config) throw new Error("Persistent study-material storage is not configured.");
  if (!materialBucketReady) {
    materialBucketReady = (async () => {
      const existing = await fetch(`${config.url}/storage/v1/bucket/${MATERIAL_BUCKET}`, {
        headers: storageHeaders(config),
        cache: "no-store",
      });
      if (existing.ok) return;
      const created = await fetch(`${config.url}/storage/v1/bucket`, {
        method: "POST",
        headers: { ...storageHeaders(config), "Content-Type": "application/json" },
        body: JSON.stringify({
          id: MATERIAL_BUCKET,
          name: MATERIAL_BUCKET,
          public: false,
          file_size_limit: 50 * 1024 * 1024,
          allowed_mime_types: [
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain", "image/png", "image/jpeg", "image/webp",
          ],
        }),
      });
      if (!created.ok) {
        materialBucketReady = null;
        throw new Error("Could not initialize persistent study-material storage.");
      }
    })();
  }
  return materialBucketReady;
}

export async function uploadMaterialObject(fileName: string, bytes: Buffer, mime: string) {
  const config = storageConfig();
  if (!config) throw new Error("Persistent study-material storage is not configured.");
  await ensureMaterialBucket();
  const key = `materials/${fileName}`;
  const response = await fetch(`${config.url}/storage/v1/object/${MATERIAL_BUCKET}/${key}`, {
    method: "POST",
    headers: { ...storageHeaders(config), "Content-Type": mime, "x-upsert": "false" },
    body: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  });
  if (!response.ok) throw new Error("File could not be saved to persistent storage.");
  return key;
}

export async function readMaterialObject(fileName: string) {
  const config = storageConfig();
  if (!config) return null;
  const response = await fetch(
    `${config.url}/storage/v1/object/authenticated/${MATERIAL_BUCKET}/materials/${encodeURIComponent(fileName)}`,
    { headers: storageHeaders(config), cache: "no-store" }
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Persistent study-material file is unavailable.");
  return Buffer.from(await response.arrayBuffer());
}

function uploadTokenSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Upload signing is not configured.");
  return secret;
}

export function issueMaterialUploadToken(fileUrl: string, userId: string) {
  const expires = Date.now() + 30 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ fileUrl, userId, expires })).toString("base64url");
  const signature = createHmac("sha256", uploadTokenSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyMaterialUploadToken(token: string | undefined, fileUrl: string, userId: string) {
  if (!token) return false;
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return false;
  const expectedSignature = createHmac("sha256", uploadTokenSecret()).update(payload).digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return value.fileUrl === fileUrl && value.userId === userId && Number(value.expires) >= Date.now();
  } catch {
    return false;
  }
}
export function validateUpload(name: string, bytes: Buffer) {
  const ext = extname(name).toLowerCase();
  const prefix = (hex: string) => bytes.subarray(0, hex.length / 2).equals(Buffer.from(hex, "hex"));
  const formats: Record<string, { mime: string; type: string; valid: () => boolean }> = {
    ".pdf": { mime: "application/pdf", type: "PDF", valid: () => bytes.subarray(0, 5).toString() === "%PDF-" },
    ".png": { mime: "image/png", type: "IMAGE", valid: () => prefix("89504e470d0a1a0a") },
    ".jpg": { mime: "image/jpeg", type: "IMAGE", valid: () => prefix("ffd8ff") },
    ".jpeg": { mime: "image/jpeg", type: "IMAGE", valid: () => prefix("ffd8ff") },
    ".webp": { mime: "image/webp", type: "IMAGE", valid: () => bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP" },
    ".doc": { mime: "application/msword", type: "DOCUMENT", valid: () => prefix("d0cf11e0a1b11ae1") },
    ".ppt": { mime: "application/vnd.ms-powerpoint", type: "DOCUMENT", valid: () => prefix("d0cf11e0a1b11ae1") },
    ".docx": { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", type: "DOCUMENT", valid: () => prefix("504b0304") && bytes.includes(Buffer.from("word/")) },
    ".pptx": { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", type: "DOCUMENT", valid: () => prefix("504b0304") && bytes.includes(Buffer.from("ppt/")) },
    ".txt": { mime: "text/plain", type: "DOCUMENT", valid: () => !bytes.includes(0) },
  };
  const format = formats[ext];
  if (!format || !bytes.length || !format.valid()) throw new Error("Unsupported file or content does not match extension. Use PDF, Office documents, TXT, PNG, JPEG or WebP.");
  return { ext, mime: format.mime, type: format.type };
}
