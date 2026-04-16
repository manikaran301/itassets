import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
  } catch (error) {
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
        startDate: new Date(data.startDate),
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
    await prisma.employee.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
