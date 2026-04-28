import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { code, company, type, floor, capacity } = body;

    // Check if code is being changed and if new code already exists
    if (code) {
      const existing = await prisma.workspace.findFirst({
        where: { 
          code,
          NOT: { id }
        }
      });
      if (existing) {
        return NextResponse.json({ error: 'A seat with this code already exists' }, { status: 409 });
      }
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        code,
        company,
        type,
        floor,
        capacity,
      }
    });

    return NextResponse.json(workspace);
  } catch (error: any) {
    console.error("API Error [PATCH /api/workspaces/[id]]:", error);
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if employee is assigned
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { employee: true }
    });

    if (workspace?.employee) {
      return NextResponse.json({ error: 'Cannot delete seat while an employee is assigned' }, { status: 400 });
    }

    await prisma.workspace.delete({ where: { id } });

    return NextResponse.json({ message: 'Workspace deleted successfully' });
  } catch (error: any) {
    console.error("API Error [DELETE /api/workspaces/[id]]:", error);
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
  }
}
