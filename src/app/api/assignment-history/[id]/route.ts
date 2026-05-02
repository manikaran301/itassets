import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { enforcePermission } from '@/lib/permissions';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'ASSIGNMENTS', 'canEdit');

    const { id } = await params;
    const body = await request.json();
    const { returnedDate, actionType, notes } = body;

    const existing = await prisma.assignmentHistory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (returnedDate !== undefined) updateData.returnedDate = returnedDate ? new Date(returnedDate) : null;
    if (actionType) updateData.actionType = actionType;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.assignmentHistory.update({
      where: { id },
      data: updateData,
      include: {
        employee: { select: { fullName: true } },
        asset: { select: { assetTag: true } },
        accessory: { select: { assetTag: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Assignment update error:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment log' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'ASSIGNMENTS', 'canDelete');

    const { id } = await params;

    const existing = await prisma.assignmentHistory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    await prisma.assignmentHistory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Assignment delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment log' },
      { status: 500 }
    );
  }
}
