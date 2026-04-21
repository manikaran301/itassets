/**
 * Bulk Import Employees from Excel file
 * File: public/CURRENT EMPLOYEES.xlsx
 * 
 * Columns: SI NO | EMP ID | NAME OF EMPLOYEES | COMPANY | LOCATION
 * 
 * - Skips employees that already exist (by employeeCode)
 * - Status defaults to 'active'
 * 
 * Run with: npx tsx prisma/import-employees.ts
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Load .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ExcelRow {
  empId: string;
  fullName: string;
  company: string;
  location: string;
}

function readExcel(): ExcelRow[] {
  const pyScript = path.join(__dirname, 'read-excel.py');
  const result = execSync(`python "${pyScript}"`, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(result.trim());
}

async function main() {
  console.log('📊 Reading Excel file: public/CURRENT EMPLOYEES.xlsx\n');

  // Read Excel data via Python
  const rows = await readExcel();
  console.log(`📋 Found ${rows.length} employees in Excel\n`);

  // Get existing employee codes from DB
  const existingEmployees = await prisma.employee.findMany({
    select: { employeeCode: true },
  });
  const existingCodes = new Set(existingEmployees.map(e => e.employeeCode));
  console.log(`🗄️  ${existingCodes.size} employees already in database\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const skippedList: string[] = [];
  const errorList: string[] = [];

  for (const row of rows) {
    // Skip if employee already exists
    if (existingCodes.has(row.empId)) {
      skipped++;
      skippedList.push(`  ⏭️  ${row.empId} - ${row.fullName} (already exists)`);
      continue;
    }

    try {
      await prisma.employee.create({
        data: {
          employeeCode: row.empId,
          fullName: row.fullName,
          companyName: row.company || null,
          locationJoining: row.location || null,
          status: 'active',
        },
      });
      imported++;
      if (imported % 50 === 0) {
        console.log(`  ✅ Imported ${imported} employees so far...`);
      }
    } catch (err: any) {
      errors++;
      errorList.push(`  ❌ ${row.empId} - ${row.fullName}: ${err.message?.slice(0, 80)}`);
    }
  }

  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT REPORT');
  console.log('='.repeat(60));
  console.log(`✅ Imported:  ${imported}`);
  console.log(`⏭️  Skipped:   ${skipped} (already existed)`);
  console.log(`❌ Errors:    ${errors}`);
  console.log(`📋 Total:     ${rows.length}`);
  console.log('='.repeat(60));

  if (skippedList.length > 0 && skippedList.length <= 20) {
    console.log('\nSkipped employees:');
    skippedList.forEach(s => console.log(s));
  } else if (skippedList.length > 20) {
    console.log(`\nSkipped employees: ${skippedList.length} (too many to list)`);
  }

  if (errorList.length > 0) {
    console.log('\nErrors:');
    errorList.forEach(e => console.log(e));
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
