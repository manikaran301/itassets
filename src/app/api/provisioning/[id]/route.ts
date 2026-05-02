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
    await enforcePermission(userId, 'IT', 'PROVISIONING', 'canEdit');

    const { id } = await params;
    const body = await request.json();
    const { status, fulfilledBy, notes } = body;

    const existing = await prisma.provisioningRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // When marking as fulfilled, record who and when
    if (status === 'fulfilled') {
      // SAFETY CHECK: Verify if the resource is actually assigned to the employee
      const employee = await prisma.employee.findUnique({
        where: { id: existing.employeeId },
        include: {
          currentAssets: true,
          emailAccounts: { where: { status: 'active' } }
        }
      });

      if (employee) {
        const type = (existing.deviceTypeNeeded || existing.specialRequirements || '').toLowerCase();
        const isEmail = type.includes('email');
        
        if (isEmail) {
          if (employee.emailAccounts.length === 0) {
            return NextResponse.json({ 
              error: 'Verification Failed: No active email account found for this employee. Please assign an email first.' 
            }, { status: 400 });
          }
        } else if (type) {
          // Check if any of the assigned assets match the type
          const hasAsset = employee.currentAssets.some(a => 
            a.type.toLowerCase() === type || 
            type.includes(a.type.toLowerCase())
          );
          
          if (!hasAsset && employee.currentAssets.length === 0) {
            return NextResponse.json({ 
              error: `Verification Failed: No ${type} assigned to this employee. Please assign hardware first.` 
            }, { status: 400 });
          }
        }
      }

      updateData.fulfilledBy = fulfilledBy || null;
      updateData.fulfilledAt = new Date();

      // Sync back: update EmployeeAssetRequirement to fulfilled
      if (existing.deviceTypeNeeded) {
        await prisma.employeeAssetRequirement.updateMany({
          where: {
            employeeId: existing.employeeId,
            assetType: existing.deviceTypeNeeded,
            status: { in: ['pending', 'approved'] },
          },
          data: {
            status: 'fulfilled',
            fulfilledBy: fulfilledBy || null,
            fulfilledAt: new Date(),
          },
        });
      }
    }

    // When marking as in_progress, update requirement to approved
    if (status === 'in_progress') {
      if (existing.deviceTypeNeeded) {
        await prisma.employeeAssetRequirement.updateMany({
          where: {
            employeeId: existing.employeeId,
            assetType: existing.deviceTypeNeeded,
            status: 'pending',
          },
          data: { status: 'approved' },
        });
      }
    }

    // When cancelled, cancel the requirement too
    if (status === 'cancelled') {
      if (existing.deviceTypeNeeded) {
        await prisma.employeeAssetRequirement.updateMany({
          where: {
            employeeId: existing.employeeId,
            assetType: existing.deviceTypeNeeded,
            status: { in: ['pending', 'approved'] },
          },
          data: { status: 'cancelled' },
        });
      }
    }

    const updated = await prisma.provisioningRequest.update({
      where: { id },
      data: updateData,
      include: {
        employee: { select: { fullName: true, employeeCode: true } },
        fulfiller: { select: { fullName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Provisioning update error:', error);
    return NextResponse.json({ error: 'Failed to update provisioning request' }, { status: 500 });
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
    await enforcePermission(userId, 'IT', 'PROVISIONING', 'canDelete');

    const { id } = await params;

    const existing = await prisma.provisioningRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Delete the provisioning request
    await prisma.provisioningRequest.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Provisioning request deleted' });
  } catch (error) {
    console.error('Provisioning delete error:', error);
    return NextResponse.json({ error: 'Failed to delete provisioning request' }, { status: 500 });
  }
}
