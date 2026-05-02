import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetUserId = id;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission management changes who can access the whole system, so keep it admin-only.
    await requireAdmin(session.user.id);

    const { permissions } = await req.json();

    // Use a transaction to update permissions
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing permissions for this user
      await tx.userPermission.deleteMany({
        where: { userId: targetUserId }
      });

      // 2. Create new permissions
      if (permissions && permissions.length > 0) {
        await tx.userPermission.createMany({
          data: permissions.map((p: any) => ({
            userId: targetUserId,
            category: p.category,
            subcategory: p.subcategory,
            canView: !!p.canView,
            canCreate: !!p.canCreate,
            canEdit: !!p.canEdit,
            canDelete: !!p.canDelete,
            canImport: !!p.canImport,
            canExport: !!p.canExport
          }))
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await prisma.userPermission.findMany({
      where: { userId: id }
    });

    return NextResponse.json({ permissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
