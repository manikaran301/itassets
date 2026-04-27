import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function generateLogCode(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ASG-${dateStr}`;

  const lastLog = await prisma.assignmentHistory.findFirst({
    where: { logCode: { startsWith: prefix } },
    orderBy: { logCode: 'desc' },
  });

  let seq = 1;
  if (lastLog) {
    const lastSeq = parseInt(lastLog.logCode.split('-').pop() || '0');
    seq = lastSeq + 1;
  }

  return `${prefix}-${seq.toString().padStart(4, '0')}`;
}

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
        oldValue: JSON.parse(JSON.stringify(asset)),
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
          oldValue: JSON.parse(JSON.stringify(oldAsset)),
          newValue: JSON.parse(JSON.stringify(updatedAsset)),
          changedBy: changedBy || null,
        }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    // Auto-log assignment if employee changed
    if (oldAsset.currentEmployeeId !== updateData.currentEmployeeId) {
      try {
        const newEmployeeId = updateData.currentEmployeeId as string | null;

        if (newEmployeeId) {
          // New assignment - create log
          const logCode = await generateLogCode();
          await prisma.assignmentHistory.create({
            data: {
              logCode,
              assetId: id,
              accessoryId: null,
              assetCategory: 'asset',
              employeeId: newEmployeeId,
              actionType: oldAsset.currentEmployeeId ? 'reassignment' : 'new_assignment',
              assignedDate: new Date(),
              assignedBy: changedBy || null,
              notes: oldAsset.currentEmployeeId ? `Reassigned to new employee` : null,
            },
          });
        } else if (oldAsset.currentEmployeeId) {
          // Asset returned/unassigned - mark last assignment as returned
          const lastAssignment = await prisma.assignmentHistory.findFirst({
            where: { assetId: id },
            orderBy: { assignedDate: 'desc' },
          });

          if (lastAssignment && !lastAssignment.returnedDate) {
            await prisma.assignmentHistory.update({
              where: { id: lastAssignment.id },
              data: { returnedDate: new Date() },
            });
          }
        }
      } catch (assignError) {
        console.error('Assignment history error:', assignError);
      }
    }

    // Auto-log repair send/return if status changed
    if (updateData.status && oldAsset.status !== updateData.status) {
      try {
        const oldStatus = oldAsset.status;
        const newStatus = updateData.status as string;

        if (newStatus === 'in_repair') {
          // Asset sent to repair - use currentEmployee or skip if none assigned
          const employeeId = oldAsset.currentEmployeeId ?? updatedAsset.currentEmployeeId;
          if (employeeId) {
            const logCode = await generateLogCode();
            await prisma.assignmentHistory.create({
              data: {
                logCode,
                assetId: id,
                accessoryId: null,
                assetCategory: 'asset',
                employeeId,
                actionType: 'repair_send',
                assignedDate: new Date(),
                assignedBy: changedBy || null,
                notes: `Asset sent to repair (was: ${oldStatus})`,
              },
            });
          }
        } else if (oldStatus === 'in_repair') {
          // Asset returned from repair - close out the repair_send log
          const repairLog = await prisma.assignmentHistory.findFirst({
            where: { assetId: id, actionType: 'repair_send', returnedDate: null },
            orderBy: { assignedDate: 'desc' },
          });

          if (repairLog) {
            await prisma.assignmentHistory.update({
              where: { id: repairLog.id },
              data: { returnedDate: new Date() },
            });

            // Create a repair_return log
            const logCode = await generateLogCode();
            await prisma.assignmentHistory.create({
              data: {
                logCode,
                assetId: id,
                accessoryId: null,
                assetCategory: 'asset',
                employeeId: repairLog.employeeId,
                actionType: 'repair_return',
                assignedDate: new Date(),
                assignedBy: changedBy || null,
                notes: `Asset returned from repair (now: ${newStatus})`,
              },
            });
          }
        }
      } catch (repairError) {
        console.error('Repair history log error:', repairError);
      }
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
        workspace: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
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
    const serializedLogs = logs.map((log) => ({
      ...log,
      id: log.id.toString(), // Convert BigInt to string
    }));

    // Handle Decimal serialization for cost
    const serializedAsset = {
      ...asset,
      cost: asset.cost ? Number(asset.cost) : null,
    };

    return NextResponse.json({ ...serializedAsset, logs: serializedLogs });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}
