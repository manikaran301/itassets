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
    
    // Ensure empty strings are treated as null for UUID fields
    const managerId = data.reportingManagerId && data.reportingManagerId.trim() !== "" ? data.reportingManagerId : null;
    const creatorId = data.createdBy && data.createdBy.trim() !== "" ? data.createdBy : null;
    
    const employee = await prisma.employee.create({
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
        createdBy: creatorId,
      },
    });
    
    // Create audit log Entry
    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'employee',
          entityId: employee.id,
          action: 'created',
          changedBy: creatorId,
          newValue: JSON.parse(JSON.stringify(employee, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          )),
        }
      });
    } catch (auditError) {
      console.error('Audit Log Error:', auditError);
      // Don't fail the whole request if audit log fails
    }

    // Convert BigInt to string if any (Employee doesn't have it but good practice)
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Core Employee Creation Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create employee', 
      details: error instanceof Error ? error.message : 'Unknown database error' 
    }, { status: 500 });
  }
}
