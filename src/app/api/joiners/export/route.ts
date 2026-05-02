import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

const DAYS_THRESHOLD = 120;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_THRESHOLD);

    const joiners = await prisma.employee.findMany({
      where: {
        status: 'active',
        OR: [
          { startDate: { gte: cutoffDate } },
          { startDate: null, createdAt: { gte: cutoffDate } },
        ],
      },
      include: {
        currentAssets: { select: { id: true } },
        emailAccounts: { where: { status: 'active' }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Employee Code',
      'Full Name',
      'Department',
      'Company Name',
      'Location',
      'Desk Number',
      'Start Date',
      'Hardware Status',
      'Identity Status',
      'Seating Status',
      'Access Status',
      'Fully Onboarded'
    ];

    const rows = joiners.map(j => {
      const hardwareReady = j.currentAssets.length > 0;
      const emailReady = j.emailAccounts.length > 0;
      const seatingReady = !!j.deskNumber;
      
      return [
        j.employeeCode,
        j.fullName,
        j.department || '',
        j.companyName || '',
        j.locationJoining || '',
        j.deskNumber || '',
        j.startDate ? format(new Date(j.startDate), 'yyyy-MM-dd') : '',
        hardwareReady ? 'Ready' : 'Pending',
        'Ready', // Identity is always ready if they are in this list
        seatingReady ? 'Allocated' : 'Pending',
        emailReady ? 'Ready' : 'Pending',
        (hardwareReady && emailReady && seatingReady) ? 'Yes' : 'No'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="onboarding_pipeline_${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    });
  } catch (error) {
    console.error('Joiners export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
