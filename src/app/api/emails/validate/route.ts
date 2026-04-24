import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { records } = await request.json();
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const emailAddresses = records.map(r => r.emailAddress?.toLowerCase().trim()).filter(Boolean);
    const employeeCodes = records.map(r => r.employeeCode?.trim()).filter(Boolean);

    // 1. Find existing emails
    const existingEmails = await prisma.emailAccount.findMany({
      where: { emailAddress: { in: emailAddresses } },
      select: { emailAddress: true }
    });
    const existingEmailSet = new Set(existingEmails.map(e => e.emailAddress.toLowerCase()));

    // 2. Find valid employees
    const validEmployees = await prisma.employee.findMany({
      where: { employeeCode: { in: employeeCodes } },
      select: { employeeCode: true }
    });
    const validEmployeeSet = new Set(validEmployees.map(e => e.employeeCode));

    // 3. Construct results and check for internal duplicates
    const seenEmailsInSheet = new Set<string>();

    const results = records.map(record => {
      const email = record.emailAddress?.toLowerCase().trim();
      const empCode = record.employeeCode?.trim();
      
      let error = '';
      if (!email) {
        error = 'Email is required';
      } else if (seenEmailsInSheet.has(email)) {
        error = 'Duplicate Email in this sheet';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        error = 'Invalid email format';
      } else if (existingEmailSet.has(email)) {
        error = 'Email already exists in system';
      } else if (record.accountType === 'personal' && empCode && !validEmployeeSet.has(empCode)) {
        error = 'Employee code not found';
      }

      if (email) seenEmailsInSheet.add(email);

      return {
        id: record.id,
        isValid: !error,
        error: error || undefined
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
