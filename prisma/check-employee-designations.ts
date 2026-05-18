/**
 * Verify and analyze employee designations mapping
 * 
 * Run with: npx tsx prisma/check-employee-designations.ts
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
  console.log('🔍 Fetching all employee and master designation records...\n');

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

  const unlinkedEmployees: any[] = [];
  const unmatchedDesignations = new Set<string>();
  const unmatchedEmployees: any[] = [];
  let fullyConnectedCount = 0;
  let emptyDesignationCount = 0;

  for (const emp of employees) {
    if (!emp.designation || !emp.designation.trim()) {
      emptyDesignationCount++;
      continue;
    }

    const cleanedName = emp.designation.trim();
    const key = cleanedName.toLowerCase();
    const match = desigMap.get(key);

    if (!match) {
      // The text designation doesn't match any master data
      unmatchedDesignations.add(cleanedName);
      unmatchedEmployees.push(emp);
    } else {
      // It matches, but is designationId correctly linked?
      if (emp.designationId !== match.id) {
        unlinkedEmployees.push({
          ...emp,
          matchedMasterName: match.name,
          matchedMasterId: match.id
        });
      } else {
        fullyConnectedCount++;
      }
    }
  }

  // --- REPORT ---
  console.log('='.repeat(60));
  console.log('📊 EMPLOYEE DESIGNATION ANALYSIS REPORT');
  console.log('='.repeat(60));
  console.log(`👥 Total Employees:                     ${employees.length}`);
  console.log(`⚪ Employees with No Designation Text:   ${emptyDesignationCount}`);
  console.log(`✅ Fully Connected & Linked properly:    ${fullyConnectedCount}`);
  console.log(`🔗 Unlinked (Text matches, but ID null): ${unlinkedEmployees.length}`);
  console.log(`⚠️  Unmatched (Text not in Master Data):  ${unmatchedEmployees.length}`);
  console.log('='.repeat(60) + '\n');

  if (unmatchedDesignations.size > 0) {
    console.log('⚠️  DESIGNATIONS IN EMPLOYEE RECORDS NOT FOUND IN MASTER DATA:');
    console.log('-'.repeat(60));
    Array.from(unmatchedDesignations).sort().forEach(d => {
      const count = unmatchedEmployees.filter(e => e.designation?.trim().toLowerCase() === d.toLowerCase()).length;
      console.log(`   • "${d}" (${count} employee(s))`);
    });
    console.log('-'.repeat(60) + '\n');

    console.log('👥 EMPLOYEES WITH UNMATCHED DESIGNATIONS (SAMPLES):');
    console.log('-'.repeat(60));
    unmatchedEmployees.slice(0, 15).forEach(e => {
      console.log(`   • [${e.employeeCode}] ${e.fullName} - Text: "${e.designation}"`);
    });
    if (unmatchedEmployees.length > 15) {
      console.log(`     ... and ${unmatchedEmployees.length - 15} more employees.`);
    }
    console.log('-'.repeat(60) + '\n');
  } else {
    console.log('🎉 Excellent! Every single employee designation text matches an entry in Master Data.\n');
  }

  if (unlinkedEmployees.length > 0) {
    console.log('🔗 UNLINKED EMPLOYEES (Text matches Master Data, but designationId is missing or wrong):');
    console.log('-'.repeat(60));
    unlinkedEmployees.slice(0, 15).forEach(e => {
      console.log(`   • [${e.employeeCode}] ${e.fullName} - Text: "${e.designation}" | ID: ${e.designationId || 'NULL'} -> Should be: ${e.matchedMasterId}`);
    });
    if (unlinkedEmployees.length > 15) {
      console.log(`     ... and ${unlinkedEmployees.length - 15} more employees.`);
    }
    console.log('-'.repeat(60) + '\n');
    
    console.log('💡 TIP: We can run a quick migration script to update these database links!');
  } else {
    console.log('🎉 Awesome! There are no unlinked employees.');
  }
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
