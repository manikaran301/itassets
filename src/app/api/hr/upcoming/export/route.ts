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

    const data = await prisma.upcomingJoining.findMany({
      orderBy: { joiningDate: 'asc' }
    });

    const headers = [
      'Full Name',
      'Designation',
      'Department',
      'Email',
      'Phone Number',
      'Company Name',
      'Reporting Manager',
      'Joining Date',
      'Experience',
      'Place of Posting',
      'Joining Location',
      'Status',
      'Status Reason'
    ];

    const rows = data.map(item => [
      item.fullName,
      item.designation,
      item.department || '',
      item.email || '',
      item.phoneNumber || '',
      item.companyName,
      item.reportingManager,
      item.joiningDate ? format(new Date(item.joiningDate), 'yyyy-MM-dd') : '',
      item.experience || '',
      item.placeOfPosting,
      item.joiningLocation,
      item.status,
      item.statusReason || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="upcoming_joinings_${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
