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

    const assetTags = records.map(r => r.assetTag?.trim()).filter(Boolean);
    const serialNumbers = records.map(r => r.serialNumber?.trim()).filter(Boolean);
    const macAddresses = records.map(r => r.macAddress?.trim()).filter(Boolean);
    const employeeCodes = records.map(r => r.employeeCode?.trim()).filter(Boolean);

    // 1. Find existing asset tags
    const existingAssets = await prisma.asset.findMany({
      where: { assetTag: { in: assetTags } },
      select: { assetTag: true }
    });
    const existingTagSet = new Set(existingAssets.map(a => a.assetTag));

    // 2. Find existing serial numbers
    const existingSerials = await prisma.asset.findMany({
      where: { serialNumber: { in: serialNumbers } },
      select: { serialNumber: true }
    });
    const existingSerialSet = new Set(existingSerials.map(a => a.serialNumber).filter(Boolean) as string[]);

    // 3. Find existing MAC addresses
    const existingMacs = await prisma.asset.findMany({
      where: { macAddress: { in: macAddresses } },
      select: { macAddress: true }
    });
    const existingMacSet = new Set(existingMacs.map(a => a.macAddress).filter(Boolean) as string[]);

    // 4. Find valid employees
    const validEmployees = await prisma.employee.findMany({
      where: { employeeCode: { in: employeeCodes } },
      select: { employeeCode: true }
    });
    const validEmployeeSet = new Set(validEmployees.map(e => e.employeeCode));

    // 5. Construct results and check for internal duplicates
    const seenTags = new Set<string>();
    const seenSerials = new Set<string>();
    const seenMacs = new Set<string>();

    const results = records.map(record => {
      const tag = record.assetTag?.trim();
      const serial = record.serialNumber?.trim();
      const mac = record.macAddress?.trim();
      const ip = record.ipAddress?.trim();
      const empCode = record.employeeCode?.trim();
      
      let error = '';
      
      // Length Checks
      if (tag && tag.length > 30) error = 'Tag too long (max 30)';
      else if (mac && mac.length > 17) error = 'MAC Address too long (max 17)';
      else if (ip && ip.length > 15) error = 'IP Address too long (max 15)';
      else if (serial && serial.length > 60) error = 'Serial too long (max 60)';
      
      // Requirement & Uniqueness Checks
      else if (!tag) {
        error = 'Asset Tag is required';
      } else if (seenTags.has(tag)) {
        error = 'Duplicate Tag in this sheet';
      } else if (existingTagSet.has(tag)) {
        error = 'Asset Tag already exists in system';
      } else if (serial && seenSerials.has(serial)) {
        error = 'Duplicate Serial in this sheet';
      } else if (serial && existingSerialSet.has(serial)) {
        error = 'Serial Number already exists in system';
      } else if (mac && seenMacs.has(mac)) {
        error = 'Duplicate MAC in this sheet';
      } else if (mac && existingMacSet.has(mac)) {
        error = 'MAC Address already exists in system';
      } else if (empCode && !validEmployeeSet.has(empCode)) {
        error = 'Employee code not found';
      }

      if (tag) seenTags.add(tag);
      if (serial) seenSerials.add(serial);
      if (mac) seenMacs.add(mac);

      return {
        id: record.id,
        isValid: !error,
        error: error || undefined
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Asset validation error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
