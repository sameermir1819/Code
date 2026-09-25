import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { getSession, getEffectivePermissions } from "@/lib/auth";
import { uploadRoot, validateUpload } from "@/lib/private-uploads";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: "Login required" }, { status: 401 });
  if (["STUDENT", "PARENT"].includes(session.role) || !(await getEffectivePermissions(session)).includes("materials.manage")) return NextResponse.json({ success: false, message: "You cannot upload study materials" }, { status: 403 });
  const maxSize = 50 * 1024 * 1024;
  if (Number(req.headers.get("content-length")) > maxSize + 1024 * 1024) return NextResponse.json({ success: false, message: "File exceeds 50MB limit" }, { status: 413 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string" || !file.size || file.size > maxSize) return NextResponse.json({ success: false, message: "Choose a non-empty file up to 50MB" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    let format;
    try { format = validateUpload(file.name, buffer); }
    catch (error) { return NextResponse.json({ success: false, message: (error as Error).message }, { status: 400 }); }
    const directory = join(uploadRoot, "materials");
    await mkdir(directory, { recursive: true });
    const name = randomUUID() + format.ext;
    const filePath = join(directory, name);
    await writeFile(filePath + ".json", JSON.stringify({ userId: session.id }), { flag: "wx" });
    await writeFile(filePath, buffer, { flag: "wx" });
    const url = "/api/uploads/materials/" + name;
    const size = file.size >= 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + " MB" : Math.ceil(file.size / 1024) + " KB";
    return NextResponse.json({ success: true, fileUrl: url, url, fileName: file.name, fileSize: size, size, fileType: format.type });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json({ success: false, message: "Upload failed. Please try again." }, { status: 500 });
  }
}
