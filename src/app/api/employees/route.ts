import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getDataScope } from '@/lib/scoping';
import { authOptions } from '../auth/[...nextauth]/route';
import { enforcePermission } from '@/lib/permissions';

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
  photoPath: z.string().trim().nullable().optional(),
  createdBy: z.string().uuid().nullable().optional().or(z.literal('')),
  workspaceId: z.string().uuid().nullable().optional().or(z.literal('')),
  upcomingId: z.string().uuid().nullable().optional().or(z.literal('')),
  companyId: z.string().uuid().nullable().optional().or(z.literal('')),
  locationId: z.string().uuid().nullable().optional().or(z.literal('')),
});

export async function GET(request: Request) {
  try {
    // Session check (defense in depth - middleware also checks)
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;
    const userId = user?.id;
    const userRole = user?.role;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'HR', 'EMPLOYEES', 'canView', userRole);

    const fullScope = await getDataScope();
    // Only use ID-based scoping for Employee model (it has both companyId and locationId)
    const scope = {
      ...(fullScope.companyId ? { companyId: fullScope.companyId } : {}),
      ...(fullScope.locationId ? { locationId: fullScope.locationId } : {}),
    };

    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '0'); // 0 = all (backward compat)

    const statuses = searchParams.get('status')?.split(',').filter(Boolean);

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: {
          ...scope,
          ...(statuses && statuses.length > 0 ? {
            status: { in: statuses as any[] }
          } : {}),
        },
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
          workspace: {
            select: {
              code: true,
              floor: true
            }
          },
          emailAccounts: true,
          assetRequirements: true, // For recovery tracking
          currentAssets: true,      // For recovery tracking
        },
        orderBy: {
          createdAt: 'desc',
        },
        ...(take > 0 ? { skip, take } : {}),
      }),
      prisma.employee.count({
        where: {
          ...scope,
          ...(statuses && statuses.length > 0 ? {
            status: { in: statuses as any[] }
          } : {}),
        },
      }),
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
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'HR', 'EMPLOYEES', 'canCreate');

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

    const result = await prisma.$transaction(async (tx) => {
      // Resolve IDs from master tables if names are provided
      let resolvedCompanyId = data.companyId && data.companyId.trim() !== "" ? data.companyId : null;
      let resolvedDepartmentId = null;
      let resolvedDesignationId = null;
      let resolvedLocationId = data.locationId && data.locationId.trim() !== "" ? data.locationId : null;

      if (!resolvedCompanyId && data.companyName) {
        const company = await tx.company.findFirst({
          where: { name: { contains: data.companyName, mode: 'insensitive' } }
        });
        if (company) resolvedCompanyId = company.id;
      }

      if (data.department) {
        const dept = await tx.department.findFirst({
          where: { name: { contains: data.department, mode: 'insensitive' } }
        });
        if (dept) resolvedDepartmentId = dept.id;
      }

      if (data.designation) {
        const desig = await tx.designation.findFirst({
          where: { name: { contains: data.designation, mode: 'insensitive' } }
        });
        if (desig) resolvedDesignationId = desig.id;
      }

      if (!resolvedLocationId && data.locationJoining) {
        const loc = await tx.location.findFirst({
          where: { name: { contains: data.locationJoining, mode: 'insensitive' } }
        });
        if (loc) resolvedLocationId = loc.id;
      }

      const employee = await tx.employee.create({
        data: {
          employeeCode: data.employeeCode,
          fullName: data.fullName,
          personalEmail: data.personalEmail || null,
          personalPhone: data.personalPhone || null,
          department: data.department || null,
          designation: data.designation || null,
          companyName: data.companyName || null,
          locationJoining: data.locationJoining || null,
          deskNumber: data.deskNumber || null,
          startDate: (data.startDate && data.startDate.trim() !== "") ? new Date(data.startDate) : null,
          exitDate: (data.exitDate && data.exitDate.trim() !== "") ? new Date(data.exitDate) : null,
          status: data.status,
          photoPath: data.photoPath || null,
          reportingManagerId: managerId || null,
          createdBy: creatorId || null,
          workspace: data.workspaceId ? { connect: { id: data.workspaceId } } : undefined,
          
          // Link to master records
          companyId: resolvedCompanyId,
          departmentId: resolvedDepartmentId,
          designationId: resolvedDesignationId,
          locationId: resolvedLocationId,
        },
      });

      // If this onboarding is from the upcoming joinings pipeline, mark as joined
      if (data.upcomingId && data.upcomingId.trim() !== "") {
        await tx.upcomingJoining.update({
          where: { id: data.upcomingId },
          data: { status: 'joined' }
        });
      }

      return employee;
    });

    const employee = result;

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

    // Audit log (outside transaction is fine)

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
