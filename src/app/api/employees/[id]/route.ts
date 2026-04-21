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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        manager: true,
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await request.json();
    
    const managerId = data.reportingManagerId && data.reportingManagerId.trim() !== "" ? data.reportingManagerId : null;
    const updaterId = data.updatedBy && data.updatedBy.trim() !== "" ? data.updatedBy : null;

    // Fetch old value for audit logging
    const oldEmployee = await prisma.employee.findUnique({ where: { id } });

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        employeeCode: data.employeeCode,
        fullName: data.fullName,
        personalEmail: data.personalEmail || null,
        personalPhone: data.personalPhone || null,
        department: data.department || null,
        designation: data.designation || null,
        companyName: data.companyName || null,
        reportingManagerId: managerId,
        locationJoining: data.locationJoining || null,
        deskNumber: data.deskNumber || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        status: data.status || 'active',
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'employee',
          entityId: employee.id,
          action: 'updated',
          changedBy: updaterId,
          oldValue: oldEmployee ? JSON.parse(JSON.stringify(oldEmployee, (key, value) => typeof value === 'bigint' ? value.toString() : value)) : null,
          newValue: JSON.parse(JSON.stringify(employee, (key, value) => typeof value === 'bigint' ? value.toString() : value)),
        }
      });
    } catch (auditError) {
      console.error('Audit Log Error:', auditError);
    }

    // Auto-log recovery_exit if employee status changed to inactive/exit_pending
    const exitStatuses = ['inactive', 'exit_pending'];
    const wasActive = oldEmployee && !exitStatuses.includes(oldEmployee.status);
    const isNowExiting = exitStatuses.includes(data.status);

    if (wasActive && isNowExiting) {
      try {
        // Recover all currently assigned assets
        const assignedAssets = await prisma.asset.findMany({
          where: { currentEmployeeId: id },
        });

        for (const asset of assignedAssets) {
          const logCode = await generateLogCode();
          await prisma.assignmentHistory.create({
            data: {
              logCode,
              assetId: asset.id,
              accessoryId: null,
              assetCategory: 'asset',
              employeeId: id,
              actionType: 'recovery_exit',
              assignedDate: new Date(),
              returnedDate: new Date(),
              notes: `Asset recovered on employee exit (status: ${data.status})`,
            },
          });

          // Unassign the asset
          await prisma.asset.update({
            where: { id: asset.id },
            data: { currentEmployeeId: null, status: 'available' },
          });
        }

        // Recover all currently assigned accessories
        const assignedAccessories = await prisma.accessory.findMany({
          where: { currentEmployeeId: id },
        });

        for (const acc of assignedAccessories) {
          const logCode = await generateLogCode();
          await prisma.assignmentHistory.create({
            data: {
              logCode,
              assetId: null,
              accessoryId: acc.id,
              assetCategory: 'accessory',
              employeeId: id,
              actionType: 'recovery_exit',
              assignedDate: new Date(),
              returnedDate: new Date(),
              notes: `Accessory recovered on employee exit (status: ${data.status})`,
            },
          });

          // Unassign the accessory
          await prisma.accessory.update({
            where: { id: acc.id },
            data: { currentEmployeeId: null, status: 'available' },
          });
        }
      } catch (exitError) {
        console.error('Exit recovery log error:', exitError);
      }
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Employee Update Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update employee', 
      details: error instanceof Error ? error.message : 'Unknown database error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        subordinates: true,
        currentAssets: true,
        currentAccessories: true,
        assetRequirements: true,
        provisioningRequests: true,
        emailAccounts: true,
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check for hard blockers (subordinates & assigned assets need manual action)
    const blockers = [];
    if (employee.subordinates.length > 0) {
      blockers.push(`${employee.subordinates.length} employee(s) reporting to this manager — reassign them first`);
    }
    if (employee.currentAssets.length > 0) {
      blockers.push(`${employee.currentAssets.length} asset(s) currently assigned — return them first`);
    }
    if (employee.currentAccessories.length > 0) {
      blockers.push(`${employee.currentAccessories.length} accessory(ies) currently assigned — return them first`);
    }

    if (blockers.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete employee - please resolve the following first:',
        details: blockers
      }, { status: 409 });
    }

    // Clean up all related records before deleting
    // 1. Email forwarding rules (linked via email accounts)
    const emailAccountIds = employee.emailAccounts.map(e => e.id);
    if (emailAccountIds.length > 0) {
      await prisma.emailForwarding.deleteMany({
        where: { emailAccountId: { in: emailAccountIds } }
      });
    }

    // 2. Email accounts
    await prisma.emailAccount.deleteMany({
      where: { employeeId: id }
    });

    // 3. Provisioning requests
    await prisma.provisioningRequest.deleteMany({
      where: { employeeId: id }
    });

    // 4. Asset requirements
    await prisma.employeeAssetRequirement.deleteMany({
      where: { employeeId: id }
    });

    // 5. Assignment history
    await prisma.assignmentHistory.deleteMany({
      where: { employeeId: id }
    });

    // 6. Delete the employee
    await prisma.employee.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Employee Delete Error:', error);
    return NextResponse.json({
      error: 'Failed to delete employee',
      details: error instanceof Error ? error.message : 'Unknown database error'
    }, { status: 500 });
  }
}
