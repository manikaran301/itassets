import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { enforcePermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'HR', 'EMPLOYEES', 'canEdit');

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const requirement = await prisma.employeeAssetRequirement.findUnique({
      where: { id }
    });

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    const updated = await prisma.employeeAssetRequirement.update({
      where: { id },
      data: { status },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: 'employee_asset_requirement',
        entityId: requirement.employeeId,
        action: 'status_changed',
        oldValue: JSON.parse(JSON.stringify(requirement)),
        newValue: JSON.parse(JSON.stringify(updated)),
        changedBy: userId
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Requirement update error:', error);
    return NextResponse.json({ error: 'Failed to update requirement' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'HR', 'EMPLOYEES', 'canEdit');

    const { id } = await params;

    const requirement = await prisma.employeeAssetRequirement.findUnique({
      where: { id }
    });

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    await prisma.employeeAssetRequirement.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Requirement delete error:', error);
    return NextResponse.json({ error: 'Failed to delete requirement' }, { status: 500 });
  }
}
