import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const company = formData.get("company") as string || "Unassigned";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    
    // Sanitize company name for folder structure (replace special chars with underscores)
    const sanitizedCompany = company.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
    
    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "uploads", "employees", sanitizedCompany);
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if directory exists
    }

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Return the relative path for database storage
    // We'll serve this via /api/uploads/employees/[company_name]/[filename]
    const relativePath = `/api/uploads/employees/${sanitizedCompany}/${fileName}`;

    return NextResponse.json({ 
      message: "File uploaded successfully", 
      path: relativePath 
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
