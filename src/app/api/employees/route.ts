import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        manager: true,
        creator: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const employee = await prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        fullName: data.fullName,
        personalEmail: data.personalEmail,
        personalPhone: data.personalPhone,
        department: data.department,
        designation: data.designation,
        reportingManagerId: data.reportingManagerId,
        locationJoining: data.locationJoining,
        deskNumber: data.deskNumber,
        startDate: new Date(data.startDate),
        status: data.status || 'active',
        createdBy: data.createdBy,
      },
    });
    
    // Create audit log Entry
    await prisma.auditLog.create({
      data: {
        entityType: 'employee',
        entityId: employee.id,
        action: 'created',
        changedBy: data.createdBy,
        newValue: employee as any,
      }
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
