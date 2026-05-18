import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;
    let fileBuffer;
    let resolvedPath = path.resolve(path.join(process.cwd(), "public", "uploads", ...pathSegments));
    const publicUploadDir = path.resolve(path.join(process.cwd(), "public", "uploads"));
    
    // Security check for public/uploads
    if (!resolvedPath.startsWith(publicUploadDir)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      fileBuffer = await readFile(resolvedPath);
    } catch (err) {
      // Fallback to old 'uploads' directory
      resolvedPath = path.resolve(path.join(process.cwd(), "uploads", ...pathSegments));
      const oldUploadDir = path.resolve(path.join(process.cwd(), "uploads"));
      if (!resolvedPath.startsWith(oldUploadDir)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      fileBuffer = await readFile(resolvedPath);
    }
    
    // Basic mime type detection based on extension
    const ext = path.extname(resolvedPath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
