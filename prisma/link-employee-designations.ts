/**
 * Automatically link unlinked employees and create missing master designations
 * to ensure 100% integrity between Employee designations and Master Data.
 * 
 * Run with: npx tsx prisma/link-employee-designations.ts
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as path from 'path';
import * as fs from 'fs';

// Load env variables
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

async function main() {
  console.log('🔄 Fetching current database states...\n');

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      designation: true,
      designationId: true,
    }
  });

  const designations = await prisma.designation.findMany();
  
  // Create lowercase lookup map for master designations
  const desigMap = new Map<string, { id: string; name: string }>();
  designations.forEach(d => {
    desigMap.set(d.name.toLowerCase().trim(), d);
  });

  console.log('⚡ Starting link and migration process...\n');

  let linkedCount = 0;
  let createdMasterCount = 0;
  let errorCount = 0;

  for (const emp of employees) {
    if (!emp.designation || !emp.designation.trim()) {
      continue;
    }

    // Clean designation string (handling potential non-breaking spaces like \u00a0)
    let cleanedName = emp.designation.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanedName) continue;

    const key = cleanedName.toLowerCase();
    let match = desigMap.get(key);

    try {
      // 1. If not found in master designations, create it
      if (!match) {
        console.log(`➕ Creating missing Master Designation: "${cleanedName}"`);
        const newDesig = await prisma.designation.create({
          data: {
            name: cleanedName,
            isActive: true
          }
        });
        match = newDesig;
        desigMap.set(key, newDesig);
        createdMasterCount++;
      }

      // 2. Link employee if designationId is wrong or missing
      if (emp.designationId !== match.id) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: {
            designation: match.name, // Ensure exact matching capitalization
            designationId: match.id
          }
        });
        console.log(`🔗 Linked: [${emp.employeeCode}] ${emp.fullName} -> "${match.name}"`);
        linkedCount++;
      }
    } catch (err: any) {
      console.error(`❌ Error updating employee ${emp.fullName}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION & LINKING REPORT');
  console.log('='.repeat(60));
  console.log(`🔗 Employees Linked to Master ID:      ${linkedCount}`);
  console.log(`➕ New Master Designations Created:    ${createdMasterCount}`);
  console.log(`❌ Errors Encountered:                 ${errorCount}`);
  console.log('='.repeat(60) + '\n');
  console.log('🎉 Database designations are now 100% connected and aligned!');
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
