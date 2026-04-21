import * as fs from 'fs';
import * as path from 'path';
import prisma from '../src/lib/prisma';

interface EmailRow {
  emailAddress?: string;
  displayName?: string;
  employeeCode?: string;
  accountType?: string;
  platform?: string;
  status?: string;
  passwordHash?: string;
  forwardingAddresses?: string;
  notes?: string;
  [key: string]: string | undefined;
}

// Simple CSV parser without external dependency
function parseCSV(content: string): EmailRow[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const records: EmailRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const record: EmailRow = {};
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
        let employeeId: string | undefined = undefined;
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
            accountType: (row.accountType || 'personal') as any,
            password: row.passwordHash || null,
            status: (row.status || 'active') as any,
            platform: (row.platform || 'office365') as any,
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
                forwardType: 'copy' as any,
                isActive: true,
              },
            });
          }
        }

        imported++;
        if (employeeId) {
          const forwarding =
            forwardingArray.length > 0 ? ` + ${forwardingArray.length} forward(s)` : '';
          console.log(
            `✅ ${row.emailAddress} → ${row.displayName || 'N/A'} (Employee: ${empCode})${forwarding}`
          );
        } else if (row.accountType === 'distribution' || row.accountType === 'shared') {
          const forwarding =
            forwardingArray.length > 0 ? ` + ${forwardingArray.length} forward(s)` : '';
          console.log(
            `✅ ${row.emailAddress} → ${row.accountType}${forwarding}`
          );
        } else {
          console.log(
            `⚠️  ${row.emailAddress} → No employee found (Code: ${row.employeeCode})`
          );
        }
      } catch (error: any) {
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
