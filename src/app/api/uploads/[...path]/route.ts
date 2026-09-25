import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getSession, getEffectivePermissions } from "@/lib/auth";
import { db } from "@/lib/db";
import { materialAccessWhere } from "@/lib/material-access";
import { existingUploadPath, uploadOwner, uploadRoot, legacyUploadRoot, validateUpload, uploadPath } from "@/lib/private-uploads";

export const dynamic = "force-dynamic";
export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const session = await getSession();
  if (!session) return new NextResponse("Login required", { status: 401 });
  const permissions = await getEffectivePermissions(session);
  if (!permissions.includes("materials.view") && !permissions.includes("materials.manage")) return new NextResponse("Forbidden", { status: 403 });
  const parts = params.path || [];
  try {
    uploadPath(uploadRoot, parts);
    if (parts.length !== 2 || parts[0] !== "materials" || parts[1].endsWith(".json")) return new NextResponse("Not found", { status: 404 });
    const url = parts.join("/");
    const material = permissions.includes("materials.view") ? await db.studyMaterial.findFirst({
      where: { AND: [await materialAccessWhere(session), { fileUrl: { in: ["/api/uploads/" + url, "/uploads/" + url] } }] }, select: { id: true },
    }) : null;
    const privateFile = await existingUploadPath(uploadRoot, parts);
    const ownsUnpublishedFile = privateFile && permissions.includes("materials.manage") && !["STUDENT", "PARENT"].includes(session.role) && await uploadOwner(privateFile) === session.id;
    if (!material && !ownsUnpublishedFile) return new NextResponse("Not found", { status: 404 });
    const file = privateFile || await existingUploadPath(legacyUploadRoot, parts);
    if (!file) return new NextResponse("Not found", { status: 404 });
    const bytes = await readFile(file);
    let format;
    try { format = validateUpload(parts[1], bytes); }
    catch { return new NextResponse("Unsupported file format", { status: 415 }); }
    return new NextResponse(bytes, { headers: {
      "Content-Type": format.mime,
      "Content-Disposition": 'attachment; filename="' + parts[1] + '"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'",
    } });
  } catch (error) {
    console.error("Download failed", error);
    return new NextResponse("File unavailable", { status: 400 });
  }
}
