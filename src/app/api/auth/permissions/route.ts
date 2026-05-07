import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.systemUser.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (user?.role === "admin" || user?.role === "it") {
    const isIT = user.role === "it";
    return NextResponse.json({
      role: user.role,
      permissions: [
        { category: "IT", subcategory: "ASSETS", canView: true, canCreate: true, canEdit: true, canDelete: true, canImport: true, canExport: true },
        { category: "IT", subcategory: "DASHBOARD", canView: true },
        { category: "HR", subcategory: "EMPLOYEES", canView: true, canCreate: false, canEdit: false, canDelete: false, canImport: false, canExport: false },
        { category: "FACILITY", subcategory: "SEATS", canView: true, canCreate: true, canEdit: true, canDelete: true, canImport: true, canExport: true },
        { category: "ADMIN", subcategory: "USERS", canView: true, canCreate: !isIT, canEdit: !isIT, canDelete: false, canImport: false, canExport: true },
        { category: "ADMIN", subcategory: "AUDIT", canView: true, canCreate: false, canEdit: false, canDelete: false, canImport: false, canExport: true },
        { category: "ADMIN", subcategory: "REPORTS", canView: true, canCreate: true, canEdit: true, canDelete: true, canImport: true, canExport: true },
      ]
    });
  }

  const permissions = await prisma.userPermission.findMany({
    where: { userId: session.user.id }
  });

  return NextResponse.json({
    role: user?.role,
    permissions
  });
}
