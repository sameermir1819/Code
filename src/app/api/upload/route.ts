import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function detectFileType(fileName: string, mimeType: string): string {
  const ext = fileName.split(".").pop()?.toUpperCase() || "";
  if (["PDF"].includes(ext)) return "PDF";
  if (["DOC", "DOCX", "ODT", "RTF", "TXT"].includes(ext)) return "DOCUMENT";
  if (["PNG", "JPG", "JPEG", "WEBP", "SVG"].includes(ext)) return "IMAGE";
  if (["PPT", "PPTX"].includes(ext)) return "DOCUMENT";
  return "NOTES";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file was uploaded." },
        { status: 400 }
      );
    }

    // Maximum 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "File exceeds 50MB size limit." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Target directory: public/uploads/materials
    const uploadsDir = join(process.cwd(), "public", "uploads", "materials");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Clean filename: timestamp + sanitized name
    const sanitizedBase = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_");
    const uniqueFileName = `${Date.now()}_${sanitizedBase}`;
    const filePath = join(uploadsDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/api/uploads/materials/${uniqueFileName}`;
    const formattedSize = formatFileSize(file.size);
    const fileType = detectFileType(file.name, file.type);

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      fileName: file.name,
      fileSize: formattedSize,
      fileType,
      message: "File uploaded successfully.",
    });
  } catch (error: unknown) {
    console.error("Upload API Error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
