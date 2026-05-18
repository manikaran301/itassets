import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const company = formData.get("company") as string || "Unassigned";
    const empCode = formData.get("employeeCode") as string || "";
    const empName = formData.get("employeeName") as string || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with employee details if available
    const fileExtension = file.name.split(".").pop();
    
    let prefix = "";
    if (empCode || empName) {
      const safeCode = empCode.replace(/[^a-zA-Z0-9]/g, "_");
      const safeName = empName.replace(/[^a-zA-Z0-9]/g, "_");
      // Combine code and name, remove duplicate underscores, and remove leading underscores
      prefix = `${safeCode}_${safeName}_`.replace(/_+/g, "_").replace(/^_/, "");
    }
    
    const fileName = `${prefix}${randomUUID().slice(0, 8)}.${fileExtension}`;
    
    // Sanitize company name for folder structure (replace special chars with underscores)
    const sanitizedCompany = company.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
    
    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "employees", sanitizedCompany);
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e: any) {
      if (e.code !== 'EEXIST') {
        console.error("mkdir error:", e);
        return NextResponse.json({ error: "Failed to create directory", details: e.message }, { status: 500 });
      }
    }

    const filePath = path.join(uploadDir, fileName);
    try {
      await writeFile(filePath, buffer);
    } catch (e: any) {
      console.error("writeFile error:", e);
      return NextResponse.json({ error: "Failed to write file", details: e.message }, { status: 500 });
    }

    // Return the relative path for database storage
    const relativePath = `/api/uploads/employees/${sanitizedCompany}/${fileName}`;

    return NextResponse.json({ 
      message: "File uploaded successfully", 
      path: relativePath 
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed", details: error.message }, { status: 500 });
  }
}
