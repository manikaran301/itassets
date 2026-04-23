import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';

interface AssetRow {
  assetTag?: string;
  type?: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  macAddress?: string;
  ipAddress?: string;
  cpu?: string;
  ramGb?: string;
  ramType?: string;
  ssdGb?: string;
  ssdType?: string;
  hddGb?: string;
  hddType?: string;
  os?: string;
  osVersion?: string;
  antivirusStatus?: string;
  antivirusName?: string;
  warrantyExpiry?: string;
  purchaseDate?: string;
  cost?: string;
  status?: string;
  employeeCode?: string;
  seatNumber?: string;
  notes?: string;
  [key: string]: string | undefined;
}

function parseCSV(content: string): AssetRow[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const records: AssetRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    let values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

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

    const record: AssetRow = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || undefined;
    });

    if (Object.values(record).some((v) => v?.trim())) {
      records.push(record);
    }
  }

  return records;
}

async function importAssets() {
  try {
    console.log('🚀 Starting Zero Client Assets Bulk Import\n');

    const csvPath = path.join(process.cwd(), 'public/Zero_Client_Ready_Import.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    console.log(`📁 CSV File: ${csvPath}\n`);

    const content = fs.readFileSync(csvPath, 'utf-8');
    const records = parseCSV(content);

    console.log(`📊 Found ${records.length} records to import\n`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Get a default system user for createdBy
    const defaultUser = await prisma.systemUser.findFirst({
      where: { email: 'admin@mams.local' },
    });

    if (!defaultUser) {
      console.warn('⚠️  Warning: No default user found for createdBy. Using first admin user.');
    }

    for (const row of records) {
      try {
        // Skip if no asset tag
        if (!row.assetTag || !row.assetTag.trim()) {
          skipped++;
          console.log(`⏭️  Skipped: Missing assetTag`);
          continue;
        }

        // Check if asset already exists
        const existing = await prisma.asset.findUnique({
          where: { assetTag: row.assetTag },
        });

        if (existing) {
          skipped++;
          console.log(`⏭️  ${row.assetTag}: Already exists`);
          continue;
        }

        // Look up employee by employeeCode
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

        // Parse numeric fields
        const ssdGb = row.ssdGb ? parseInt(row.ssdGb, 10) : undefined;
        const hddGb = row.hddGb ? parseInt(row.hddGb, 10) : undefined;
        const cost = row.cost ? parseFloat(row.cost) : undefined;

        // Parse dates
        const warrantyExpiry = row.warrantyExpiry ? new Date(row.warrantyExpiry) : undefined;
        const purchaseDate = row.purchaseDate ? new Date(row.purchaseDate) : undefined;

        // Determine status
        let finalStatus: 'available' | 'assigned' | 'in_repair' | 'retired' | 'lost' = 
          (row.status as any) || 'available';

        if (employeeId && finalStatus === 'available') {
          finalStatus = 'assigned';
        }

        // Create asset
        const asset = await prisma.asset.create({
          data: {
            assetTag: row.assetTag.trim(),
            type: (row.type || 'other') as any,
            make: row.make ? row.make.trim() : undefined,
            model: row.model ? row.model.trim() : undefined,
            serialNumber: row.serialNumber ? row.serialNumber.trim() : undefined,
            macAddress: row.macAddress ? row.macAddress.trim() : undefined,
            ipAddress: row.ipAddress ? row.ipAddress.trim() : undefined,
            cpu: row.cpu ? row.cpu.trim() : undefined,
            ramGb: row.ramGb ? row.ramGb.trim() : undefined,
            ramType: row.ramType ? row.ramType.trim() : undefined,
            ssdGb: !isNaN(ssdGb || 0) && ssdGb ? ssdGb : undefined,
            ssdType: row.ssdType ? row.ssdType.trim() : undefined,
            hddGb: !isNaN(hddGb || 0) && hddGb ? hddGb : undefined,
            hddType: row.hddType ? row.hddType.trim() : undefined,
            os: row.os ? row.os.trim() : undefined,
            osVersion: row.osVersion ? row.osVersion.trim() : undefined,
            antivirusStatus: (row.antivirusStatus as any) || 'no',
            antivirusName: row.antivirusName ? row.antivirusName.trim() : undefined,
            warrantyExpiry: warrantyExpiry && !isNaN(warrantyExpiry.getTime()) ? warrantyExpiry : undefined,
            purchaseDate: purchaseDate && !isNaN(purchaseDate.getTime()) ? purchaseDate : undefined,
            cost: cost && !isNaN(cost) ? cost : undefined,
            status: finalStatus,
            currentEmployeeId: employeeId,
            notes: row.notes ? row.notes.trim() : undefined,
            createdBy: defaultUser?.id,
          },
        });

        imported++;
        if (employeeId) {
          console.log(
            `✅ ${row.assetTag} (${row.type}) → ${employeeName}`
          );
        } else {
          console.log(
            `✅ ${row.assetTag} (${row.type}) → Available`
          );
        }
      } catch (error: any) {
        errors++;
        console.error(
          `❌ ${row.assetTag || 'Unknown'}: ${error.message}`
        );
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 Import Summary:');
    console.log(`   Total:    ${records.length}`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped:  ${skipped}`);
    console.log(`   Errors:   ${errors}`);
    console.log(`${'='.repeat(60)}`);

    process.exit(errors > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importAssets();
