import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { records } = await request.json();

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    let count = 0;
    const errors = [];

    for (const record of records) {
      try {
        // Validate required fields
        if (!record.fullName || !record.joiningDate) {
          errors.push(`Skipped: Missing full name or joining date`);
          continue;
        }

        // Parse joining date
        let joiningDate: Date;
        try {
          joiningDate = new Date(record.joiningDate);
          if (isNaN(joiningDate.getTime())) {
            errors.push(`Invalid date format: ${record.joiningDate}`);
            continue;
          }
        } catch {
          errors.push(`Failed to parse date: ${record.joiningDate}`);
          continue;
        }

        // Create upcoming joining record
        await prisma.upcomingJoining.create({
          data: {
            fullName: record.fullName,
            designation: record.designation || '',
            department: record.department || null,
            companyName: record.companyName || '',
            reportingManager: record.reportingManager || '',
            joiningDate,
            experience: record.experience || null,
            placeOfPosting: record.placeOfPosting || '',
            joiningLocation: record.joiningLocation || '',
            status: record.status || 'upcoming',
            statusReason: record.statusReason || null,
          },
        });

        count++;
      } catch (error) {
        console.error('Record creation error:', error);
        errors.push(`Failed to create record for ${record.fullName}`);
      }
    }

    return NextResponse.json({
      success: true,
      count,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${count} upcoming joiners`,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import records' }, { status: 500 });
  }
}
