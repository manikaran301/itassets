import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { employeeId, changedBy } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
    }

    // Use the PATCH logic by triggering an update
    // The PATCH handler in [id]/route.ts is good, but for POST /assign we want a clean wrapper
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        currentEmployeeId: employeeId,
        status: 'assigned',
      },
    });

    // We need to trigger the same side-effects as PATCH
    // Since Next.js doesn't allow calling route handlers from other route handlers easily,
    // we should ideally extract the assignment logic to a utility.
    // For now, I'll replicate the core logic or just use the PATCH logic.
    
    // Actually, I'll just create the assignment history and provisioning fulfillment here too.
    
    // 1. History
    await prisma.assignmentHistory.create({
      data: {
        logCode: `ASG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        assetId: id,
        employeeId,
        assetCategory: 'asset',
        actionType: asset.currentEmployeeId ? 'reassignment' : 'new_assignment',
        assignedDate: new Date(),
        assignedBy: changedBy || null,
        notes: `Assigned via Smart Provisioning Flow`,
      },
    });

    // 2. Auto-fulfill provisioning
    const assetType = asset.type;
    const pendingReq = await prisma.provisioningRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['pending', 'in_progress'] },
        OR: [
          { deviceTypeNeeded: assetType as any },
          { specialRequirements: { contains: assetType, mode: 'insensitive' } }
        ]
      }
    });

    if (pendingReq) {
      await prisma.provisioningRequest.update({
        where: { id: pendingReq.id },
        data: {
          status: 'fulfilled',
          fulfilledBy: changedBy || null,
          notes: (pendingReq.notes || '') + `\nAuto-fulfilled via smart assignment (${asset.assetTag})`
        }
      });

      await prisma.employeeAssetRequirement.updateMany({
        where: {
          employeeId,
          assetType: assetType as any,
          status: { in: ['pending', 'approved'] }
        },
        data: {
          status: 'fulfilled'
        }
      });
    }

    return NextResponse.json({ message: 'Asset assigned successfully', asset: updatedAsset });
  } catch (error) {
    console.error('Assignment API error:', error);
    return NextResponse.json({ error: 'Failed to assign asset' }, { status: 500 });
  }
}
