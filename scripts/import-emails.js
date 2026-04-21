const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Initialize Prisma with the same setup as the app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@1221@172.16.0.115:5432/itasset',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Simple CSV parser
function parseCSV(content) {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || undefined;
    });
    if (record.emailAddress) {
      records.push(record);
    }
  }

  return records;
}

async function importEmails() {
  try {
    console.log('📧 Starting email import...\n');

    // Read CSV
    const csvPath = path.join(__dirname, '../public/Email.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parseCSV(fileContent);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of records) {
      try {
        // Skip empty email addresses
        if (!row.emailAddress) {
          skipped++;
          continue;
        }

        // Extract employee code: EMP-1915 → 1915
        let employeeId = undefined;
        let empCode = '';
        if (row.employeeCode && row.employeeCode !== 'EMP-') {
          empCode = row.employeeCode.replace('EMP-', '').trim();
          if (empCode) {
            // Find employee by employeeCode
            const employee = await prisma.employee.findFirst({
              where: { employeeCode: empCode },
            });
            if (employee) {
              employeeId = employee.id;
            }
          }
        }

        // Parse forwarding addresses (semicolon separated)
        const forwardingArray = row.forwardingAddresses
          ? row.forwardingAddresses
            .split(';')
            .map((e) => e.trim())
            .filter((e) => e.length > 0)
          : [];

        // Create email account
        const emailAccount = await prisma.emailAccount.create({
          data: {
            emailAddress: row.emailAddress.toLowerCase(),
            displayName: row.displayName || row.emailAddress,
            employeeId: employeeId || undefined,
            accountType: row.accountType || 'personal',
            password: row.passwordHash || null,
            status: row.status || 'active',
            platform: 'microsoft_365',  // Microsoft 365 / Office 365
            forwardingEnabled: forwardingArray.length > 0,
          },
        });

        // Create forwarding entries
        if (forwardingArray.length > 0) {
          for (const forwardTo of forwardingArray) {
            await prisma.emailForwarding.create({
              data: {
                emailAccountId: emailAccount.id,
                forwardToAddress: forwardTo,
                forwardType: 'copy',
                isActive: true,
              },
            });
          }
        }

        imported++;
        if (employeeId) {
          const forwarding = forwardingArray.length > 0 ? ` + ${forwardingArray.length} forward(s)` : '';
          console.log(`✅ ${row.emailAddress} → ${row.displayName || 'N/A'} (Employee: ${empCode})${forwarding}`);
        } else if (row.accountType === 'distribution' || row.accountType === 'shared') {
          const forwarding = forwardingArray.length > 0 ? ` + ${forwardingArray.length} forward(s)` : '';
          console.log(`✅ ${row.emailAddress} → ${row.accountType}${forwarding}`);
        } else {
          console.log(`⚠️  ${row.emailAddress} → No employee found (Code: ${row.employeeCode})`);
        }
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⏭️  ${row.emailAddress} already exists`);
          skipped++;
        } else {
          console.error(`❌ Error importing ${row.emailAddress}:`, error.message);
          errors++;
        }
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importEmails();
