import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Parse CSV content
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    let values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    // Handle CSV with quoted fields
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    // Only add non-empty rows
    if (Object.values(record).some((v) => v.trim())) {
      records.push(record);
    }
  }

  return records;
}

// Asset import schema
const AssetImportSchema = z.object({
  assetTag: z.string().min(1, 'Asset Tag is required'),
  type: z.enum(['laptop', 'desktop', 'zero_client', 'n_computing', 'nuc', 'server', 'printer', 'switch', 'access_point', 'tv', 'nvr', 'dvr', 'other']),
  make: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  macAddress: z.string().optional(),
  ipAddress: z.string().optional(),
  cpu: z.string().optional(),
  ramGb: z.string().optional(),
  ramType: z.string().optional(),
  ssdGb: z.string().optional(),
  ssdType: z.string().optional(),
  hddGb: z.string().optional(),
  hddType: z.string().optional(),
  os: z.string().optional(),
  osVersion: z.string().optional(),
  antivirusStatus: z.enum(['yes', 'no', 'expired']).default('no'),
  antivirusName: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  purchaseDate: z.string().optional(),
  cost: z.string().optional(),
  status: z.enum(['available', 'assigned', 'in_repair', 'retired', 'lost']).default('available'),
  employeeCode: z.string().optional(),
  seatNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.systemUser.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const content = await file.text();
    const records = parseCSV(content);

    if (records.length === 0) {
      return NextResponse.json({ error: 'No valid records in CSV' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const results: any[] = [];

    for (const row of records) {
      try {
        // Parse optional numeric fields
        const ssdGb = row.ssdGb ? parseInt(row.ssdGb, 10) : undefined;
        const hddGb = row.hddGb ? parseInt(row.hddGb, 10) : undefined;
        const cost = row.cost ? parseFloat(row.cost) : undefined;

        // Validate required fields
        if (!row.assetTag) {
          skipped++;
          results.push({
            assetTag: 'N/A',
            status: 'skipped',
            reason: 'Missing assetTag',
          });
          continue;
        }

        // Check if asset already exists
        const existing = await prisma.asset.findUnique({
          where: { assetTag: row.assetTag },
        });

        if (existing) {
          skipped++;
          results.push({
            assetTag: row.assetTag,
            status: 'skipped',
            reason: 'Asset tag already exists',
          });
          continue;
        }

        // Look up employee by employeeCode if provided
        let employeeId: string | undefined = undefined;
        let employeeName = '';

        if (row.employeeCode && row.employeeCode.trim()) {
          const employee = await prisma.employee.findFirst({
            where: { employeeCode: row.employeeCode.trim() },
          });

          if (employee) {
            employeeId = employee.id;
            employeeName = employee.fullName;
          }
        }

        // Parse dates
        const warrantyExpiry = row.warrantyExpiry ? new Date(row.warrantyExpiry) : undefined;
        const purchaseDate = row.purchaseDate ? new Date(row.purchaseDate) : undefined;

        // Determine status based on employee assignment
        let finalStatus: 'available' | 'assigned' | 'in_repair' | 'retired' | 'lost' = (row.status as any) || 'available';
        if (employeeId && finalStatus === 'available') {
          finalStatus = 'assigned';
        }

        // Create asset
        const asset = await prisma.asset.create({
          data: {
            assetTag: row.assetTag.trim(),
            type: row.type as any,
            make: row.make ? row.make.trim() : undefined,
            model: row.model ? row.model.trim() : undefined,
            serialNumber: row.serialNumber ? row.serialNumber.trim() : undefined,
            macAddress: row.macAddress ? row.macAddress.trim() : undefined,
            ipAddress: row.ipAddress ? row.ipAddress.trim() : undefined,
            cpu: row.cpu ? row.cpu.trim() : undefined,
            ramGb: row.ramGb ? row.ramGb.trim() : undefined,
            ramType: row.ramType ? row.ramType.trim() : undefined,
            ssdGb: isNaN(ssdGb || 0) ? undefined : ssdGb,
            ssdType: row.ssdType ? row.ssdType.trim() : undefined,
            hddGb: isNaN(hddGb || 0) ? undefined : hddGb,
            hddType: row.hddType ? row.hddType.trim() : undefined,
            os: row.os ? row.os.trim() : undefined,
            osVersion: row.osVersion ? row.osVersion.trim() : undefined,
            antivirusStatus: row.antivirusStatus as any,
            antivirusName: row.antivirusName ? row.antivirusName.trim() : undefined,
            warrantyExpiry: isNaN(warrantyExpiry?.getTime() || 0) ? undefined : warrantyExpiry,
            purchaseDate: isNaN(purchaseDate?.getTime() || 0) ? undefined : purchaseDate,
            cost: isNaN(cost || 0) ? undefined : cost ? Math.round(cost * 100) / 100 : undefined,
            status: finalStatus,
            currentEmployeeId: employeeId,
            notes: row.notes ? row.notes.trim() : undefined,
            createdBy: currentUser.id,
          },
        });

        imported++;
        results.push({
          assetTag: row.assetTag,
          type: row.type,
          status: 'imported',
          assignedTo: employeeName || 'Unassigned',
          id: asset.id,
        });
      } catch (error: any) {
        errors++;
        console.error(`Error importing ${row.assetTag}:`, error.message);
        results.push({
          assetTag: row.assetTag || 'Unknown',
          status: 'error',
          reason: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: records.length,
        imported,
        skipped,
        errors,
      },
      results,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: error.message },
      { status: 500 }
    );
  }
}
