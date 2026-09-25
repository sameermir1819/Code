import { resolve, relative, isAbsolute, extname } from "path";
import { readFile, realpath } from "fs/promises";

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
