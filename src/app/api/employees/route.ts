import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for employee creation
const EmployeeSchema = z.object({
  employeeCode: z.string().min(1, "Employee Code is required").trim(),
  fullName: z.string().min(1, "Full Name is required").trim(),
  personalEmail: z.string().email().nullable().optional().or(z.literal('')),
  personalPhone: z.string().trim().nullable().optional(),
  department: z.string().trim().nullable().optional(),
  designation: z.string().trim().nullable().optional(),
  companyName: z.string().trim().nullable().optional(),
  reportingManagerId: z.string().uuid().nullable().optional().or(z.literal('')),
  locationJoining: z.string().trim().nullable().optional(),
  deskNumber: z.string().trim().nullable().optional(),
  startDate: z.string().nullable().optional(),
  exitDate: z.string().nullable().optional(),
  status: z.enum(['active', 'exit_pending', 'inactive']).default('active'),
  createdBy: z.string().uuid().nullable().optional().or(z.literal('')),
});

export async function GET(request: Request) {
  try {
    // Session check (defense in depth - middleware also checks)
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '0'); // 0 = all (backward compat)

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        include: {
          manager: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
            },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        ...(take > 0 ? { skip, take } : {}),
      }),
      prisma.employee.count(),
    ]);

    // If paginated, return with metadata
    if (take > 0) {
      return NextResponse.json({
        data: employees,
        total,
        hasMore: skip + take < total,
      });
    }

    // Backward compatible: return flat array if no pagination params
    return NextResponse.json(employees);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Session check (defense in depth - middleware also checks)
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawData = await request.json();

    // Validate input
    const validatedResult = EmployeeSchema.safeParse(rawData);
    if (!validatedResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validatedResult.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const data = validatedResult.data;

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
        startDate: data.startDate ? new Date(data.startDate) : null,
        exitDate: data.exitDate ? new Date(data.exitDate) : null,
        status: data.status,
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
          newValue: JSON.parse(JSON.stringify(employee, (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          )),
        }
      });
    } catch {
      // Don't fail the whole request if audit log fails
    }

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    // Handle Prisma unique constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'An employee with this code already exists.' }, { status: 409 });
    }
    return NextResponse.json({
      error: 'Failed to create employee',
      details: error instanceof Error ? error.message : 'Unknown database error'
    }, { status: 500 });
  }
}
