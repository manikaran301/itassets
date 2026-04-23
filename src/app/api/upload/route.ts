import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    
    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "uploads", "employees");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if directory exists
    }

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Return the relative path for database storage
    // We'll serve this via /api/uploads/employees/[filename]
    const relativePath = `/api/uploads/employees/${fileName}`;

    return NextResponse.json({ 
      message: "File uploaded successfully", 
      path: relativePath 
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
