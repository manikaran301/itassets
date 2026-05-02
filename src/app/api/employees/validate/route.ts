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

    const employeeCodes = records.map(r => r.employeeCode?.trim()).filter(Boolean);
    const personalEmails = records.map(r => r.personalEmail?.trim()).filter(Boolean);
    const managerCodes = records.map(r => r.managerCode?.trim()).filter(Boolean);
    const deskNumbers = records.map(r => r.deskNumber?.trim()).filter(Boolean);

    // 1. Find existing employees, managers and workspaces
    const [existingEmployees, existingEmails, managers, workspaces] = await Promise.all([
      prisma.employee.findMany({
        where: { employeeCode: { in: employeeCodes } },
        select: { employeeCode: true }
      }),
      prisma.employee.findMany({
        where: { personalEmail: { in: personalEmails } },
        select: { personalEmail: true }
      }),
      prisma.employee.findMany({
        where: { employeeCode: { in: managerCodes } },
        select: { id: true, employeeCode: true, fullName: true }
      }),
      prisma.workspace.findMany({
        where: { code: { in: deskNumbers } },
        select: { id: true, code: true }
      })
    ]);

    const existingCodeSet = new Set(existingEmployees.map(e => e.employeeCode));
    const existingEmailSet = new Set(existingEmails.map(e => e.personalEmail).filter(Boolean) as string[]);
    const managerMap = new Map(managers.map(m => [m.employeeCode, m]));
    const workspaceMap = new Map(workspaces.map(w => [w.code, w]));

    const seenCodes = new Set<string>();
    const seenEmails = new Set<string>();

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

      const code = getVal(['employeeCode', 'employee_code', 'Emp Code', 'Code'])?.trim();
      const fullName = getVal(['fullName', 'full_name', 'Name'])?.trim();
      const email = getVal(['personalEmail', 'personal_email', 'Email'])?.trim();
      const managerCode = getVal(['managerCode', 'manager_code', 'Reporting Manager', 'Manager Code'])?.trim();
      const department = getVal(['department', 'Dept'])?.trim();
      const designation = getVal(['designation', 'Designation'])?.trim();
      const companyName = getVal(['companyName', 'Company'])?.trim();
      const locationJoining = getVal(['locationJoining', 'location_joining', 'Location'])?.trim();
      const startDate = getVal(['startDate', 'start_date', 'Joining Date'])?.trim();

      const deskNumber = getVal(['deskNumber', 'desk_number', 'Workspace Code', 'Seat Number'])?.trim();

      const normalizedRecord = {
        ...record,
        employeeCode: code,
        fullName,
        personalEmail: email,
        managerCode,
        department,
        designation,
        companyName,
        locationJoining,
        startDate,
        deskNumber
      };

      let error = '';

      if (!code) error = 'Employee Code is required';
      else if (!fullName) error = 'Full Name is required';
      else if (seenCodes.has(code)) error = 'Duplicate Code in this sheet';
      else if (existingCodeSet.has(code)) error = 'Employee Code already exists';
      else if (email && seenEmails.has(email)) error = 'Duplicate Email in this sheet';
      else if (email && existingEmailSet.has(email)) error = 'Personal Email already exists';
      else if (managerCode && !managerMap.has(managerCode)) error = 'Reporting Manager not found';

      if (code) seenCodes.add(code);
      if (email) seenEmails.add(email);

      return {
        id: record.id || index.toString(),
        isValid: !error,
        error: error || undefined,
        data: {
          ...normalizedRecord,
          reportingManagerId: managerCode ? managerMap.get(managerCode)?.id : undefined,
          workspaceId: deskNumber ? workspaceMap.get(deskNumber)?.id : undefined
        }
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Employee validation error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
