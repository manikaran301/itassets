/**
 * Bulk Import Designations from Excel file
 * File: public/Designation.xlsx
 * 
 * - Skips/Checks designations that already exist
 * - Ensures active status (updates isActive to true if it was false)
 * - Adds new designations if they are not present
 * 
 * Run with: npx tsx prisma/import-designations.ts
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Load .env manually to ensure database connection details are set properly
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

function readExcel(): string[] {
  const pyScript = path.join(__dirname, 'read-designations-excel.py');
  const result = execSync(`python "${pyScript}"`, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(result.trim());
}

async function main() {
  console.log('📊 Reading Excel file: public/Designation.xlsx\n');

  // Read Excel data via Python
  const excelDesignations = readExcel();
  console.log(`📋 Found ${excelDesignations.length} unique designations in Excel file.\n`);

  // Get existing designations from DB
  const existingDesignations = await prisma.designation.findMany();
  
  // Map by name (lowercase for case-insensitive checking)
  const dbMap = new Map<string, { id: string; name: string; isActive: boolean }>();
  existingDesignations.forEach(d => {
    dbMap.set(d.name.toLowerCase().trim(), d);
  });

  console.log(`🗄️  ${existingDesignations.length} designations already in database.\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const logs: string[] = [];

  for (const name of excelDesignations) {
    const key = name.toLowerCase().trim();
    const existing = dbMap.get(key);

    try {
      if (existing) {
        // If the designation exists, check if it needs to be updated (e.g. reactivated if inactive)
        if (!existing.isActive) {
          await prisma.designation.update({
            where: { id: existing.id },
            data: { isActive: true },
          });
          updated++;
          logs.push(`  🔄 Updated (Reactivated): "${existing.name}" (was inactive)`);
        } else {
          skipped++;
          logs.push(`  ⏭️  Skipped: "${existing.name}" (already exists and active)`);
        }
      } else {
        // Create new designation
        const newDesig = await prisma.designation.create({
          data: {
            name: name,
            isActive: true,
          },
        });
        created++;
        logs.push(`  ✨ Created: "${newDesig.name}"`);
      }
    } catch (err: any) {
      errors++;
      logs.push(`  ❌ Error processing "${name}": ${err.message?.slice(0, 100)}`);
    }
  }

  // Print execution log details
  console.log('📝 DETAIL LOGS:');
  logs.forEach(log => console.log(log));

  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 DESIGNATION IMPORT REPORT');
  console.log('='.repeat(60));
  console.log(`✨ Created (New):     ${created}`);
  console.log(`🔄 Updated (Active):  ${updated}`);
  console.log(`⏭️  Skipped (Existing): ${skipped}`);
  console.log(`❌ Errors:             ${errors}`);
  console.log(`📋 Total in Excel:     ${excelDesignations.length}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Fatal Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
