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

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: body,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'asset',
        entityId: id,
        action: 'updated',
        oldValue: oldAsset as any,
        newValue: updatedAsset as any,
        changedBy: body.changedBy || null,
      }
    });

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
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}
