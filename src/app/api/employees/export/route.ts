import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await prisma.employee.findMany({
      include: {
        manager: { select: { employeeCode: true, fullName: true } }
      },
      orderBy: { employeeCode: 'asc' }
    });

    const headers = [
      'Employee Code',
      'Full Name',
      'Personal Email',
      'Personal Phone',
      'Department',
      'Designation',
      'Company Name',
      'Location Joining',
      'Desk Number',
      'Start Date',
      'Reporting Manager Code',
      'Reporting Manager Name',
      'Status'
    ];

    const rows = data.map(item => [
      item.employeeCode,
      item.fullName,
      item.personalEmail || '',
      item.personalPhone || '',
      item.department || '',
      item.designation || '',
      item.companyName || '',
      item.locationJoining || '',
      item.deskNumber || '',
      item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : '',
      item.manager?.employeeCode || '',
      item.manager?.fullName || '',
      item.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="employee_registry_${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
