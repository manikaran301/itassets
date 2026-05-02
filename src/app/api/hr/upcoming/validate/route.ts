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
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Check for existing records to prevent duplicates (same name and joining date)
    const names = records.map(r => r.fullName?.trim()).filter(Boolean);
    const existingRecords = await prisma.upcomingJoining.findMany({
      where: {
        fullName: { in: names },
      },
      select: {
        fullName: true,
        joiningDate: true,
      }
    });

    const results = records.map((record, index) => {
      // Normalization helper
      const getVal = (keys: string[]) => {
        for (const key of keys) {
          if (record[key] !== undefined) return record[key];
          const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
          for (const rKey in record) {
            if (rKey.toLowerCase().replace(/[\s_]/g, '') === normalizedKey) return record[rKey];
          }
        }
        return undefined;
      };

      const rawJoiningDate = getVal(['joiningDate', 'joining_date', 'dateOfJoining', 'date_of_joining'])?.trim();
      let joiningDateStr = '';
      let dateError = '';
      
      if (rawJoiningDate) {
        // Handle various formats
        const date = new Date(rawJoiningDate);
        if (!isNaN(date.getTime())) {
          joiningDateStr = date.toISOString().split('T')[0];
        } else {
          const parts = rawJoiningDate.split(/[-/]/);
          if (parts.length === 3) {
            const d1 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (!isNaN(d1.getTime())) {
              joiningDateStr = d1.toISOString().split('T')[0];
            }
          }
        }
      }

      if (rawJoiningDate && !joiningDateStr) {
        dateError = 'Invalid Joining Date format';
      }

      const fullName = getVal(['fullName', 'full_name', 'Name'])?.trim();
      const companyName = getVal(['companyName', 'company_name', 'Company'])?.trim();
      const reportingManager = getVal(['reportingManager', 'reporting_manager', 'Manager'])?.trim();
      const placeOfPosting = getVal(['placeOfPosting', 'place_of_posting', 'Posting Location'])?.trim();
      const joiningLocation = getVal(['joiningLocation', 'joining_location', 'Location'])?.trim();

      const normalizedRecord = {
        ...record,
        fullName,
        joiningDate: joiningDateStr || rawJoiningDate, // Fallback to raw if unparseable
        companyName,
        reportingManager,
        placeOfPosting,
        joiningLocation
      };

      let error = dateError;

      if (!fullName) error = 'Full Name is required';
      else if (!rawJoiningDate) error = 'Joining Date is required';
      else if (!error) {
        // Double check parsed date
        const date = new Date(joiningDateStr);
        if (isNaN(date.getTime())) {
          error = 'Invalid Joining Date format';
        } else {
          // Duplicate check in system
          const isDuplicate = existingRecords.some(r => 
            r.fullName === fullName && 
            new Date(r.joiningDate).toDateString() === date.toDateString()
          );
          if (isDuplicate) {
            error = 'Candidate already exists for this date';
          }
        }
      }

      // Internal duplicate check (same name and date in the same sheet)
      if (!error) {
        const internalDup = records.slice(0, index).some(r => 
          r.fullName?.trim() === fullName && 
          r.joiningDate?.trim() === joiningDateStr
        );
        if (internalDup) {
          error = 'Duplicate candidate in this sheet';
        }
      }

      return {
        id: record.id || index.toString(),
        isValid: !error,
        error: error || undefined,
        data: normalizedRecord // Return the normalized data for preview
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Upcoming joining validation error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
