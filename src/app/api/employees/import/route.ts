import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { enforcePermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'HR', 'EMPLOYEES', 'canImport');

    const { records } = await request.json();
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    const created = await prisma.$transaction(
      records.map((record) => {
        return prisma.employee.create({
          data: {
            employeeCode: record.employeeCode.trim(),
            fullName: record.fullName.trim(),
            personalEmail: record.personalEmail?.trim() || null,
            personalPhone: record.personalPhone?.trim() || null,
            department: record.department?.trim() || null,
            designation: record.designation?.trim() || null,
            companyName: record.companyName?.trim() || null,
            locationJoining: record.locationJoining?.trim() || null,
            deskNumber: record.deskNumber?.trim() || null,
            startDate: record.startDate ? new Date(record.startDate) : null,
            reportingManagerId: record.reportingManagerId || null,
            workspace: record.workspaceId ? { connect: { id: record.workspaceId } } : undefined,
            status: record.status || 'active',
            createdBy: userId,
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      count: created.length,
      message: `Successfully imported ${created.length} employees`
    });
  } catch (error: any) {
    console.error('Employee import error:', error);
    return NextResponse.json({ error: 'Import failed', details: error.message }, { status: 500 });
  }
}
