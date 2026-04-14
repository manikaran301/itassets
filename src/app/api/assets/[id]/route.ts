import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete the asset
    const asset = await prisma.asset.delete({
      where: { id },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: 'asset',
        entityId: id,
        action: 'deleted',
        oldValue: asset as any,
      }
    });

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const oldAsset = await prisma.asset.findUnique({ where: { id } });
    if (!oldAsset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    // Sanitize and format data
    const { changedBy, ...updateData } = body;
    
    // Convert date strings to Date objects for Prisma
    if (updateData.purchaseDate) updateData.purchaseDate = new Date(updateData.purchaseDate);
    if (updateData.warrantyExpiry) updateData.warrantyExpiry = new Date(updateData.warrantyExpiry);

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        ...updateData,
        currentEmployeeId: updateData.currentEmployeeId || null,
      },
      include: {
        currentEmployee: true,
      }
    });

    // Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'asset',
          entityId: id,
          action: 'updated',
          oldValue: oldAsset as any,
          newValue: updatedAsset as any,
          changedBy: changedBy || null,
        }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        currentEmployee: true,
        assignments: {
          include: {
            employee: true,
            assigner: true,
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Fetch AuditLogs separately to avoid overly deep includes if not needed
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: 'asset',
        entityId: id,
      },
      include: {
        user: true,
      },
      orderBy: { changedAt: 'desc' },
      take: 20,
    });

    // Manually serialize BigInt entries in audit logs for JSON response
    const serializedLogs = logs.map(log => ({
      ...log,
      id: log.id.toString(), // Convert BigInt to string
    }));

    return NextResponse.json({ ...asset, logs: serializedLogs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}
