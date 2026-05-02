import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { enforcePermission } from '@/lib/permissions';

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'EMAILS', 'canImport');

    // Get current user
    const currentUser = await prisma.systemUser.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let records: Record<string, string>[] = [];

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      const content = await file.text();
      records = parseCSV(content);
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      records = body.records || [];
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'No valid records found' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const results: any[] = [];
    const seenEmails = new Set<string>();

    for (const row of records) {
      try {
        const emailAddress = row.emailAddress?.trim().toLowerCase();
        
        // 1. Basic validation
        if (!emailAddress) {
          skipped++;
          results.push({ email: 'N/A', status: 'skipped', reason: 'Missing emailAddress' });
          continue;
        }

        // 2. Format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailAddress)) {
          errors++;
          results.push({ email: emailAddress, status: 'error', reason: 'Invalid email format' });
          continue;
        }

        // 3. Check for duplicates within the CSV itself
        if (seenEmails.has(emailAddress)) {
          skipped++;
          results.push({ email: emailAddress, status: 'skipped', reason: 'Duplicate in CSV' });
          continue;
        }
        seenEmails.add(emailAddress);

        // 4. Check if email already exists in Database
        const existing = await prisma.emailAccount.findUnique({
          where: { emailAddress },
        });

        if (existing) {
          skipped++;
          results.push({ email: emailAddress, status: 'skipped', reason: 'Email already exists in system' });
          continue;
        }

        // 5. Look up employee by employeeCode if provided
        let employeeId: string | null = null;
        let importNote = '';
        if (row.employeeCode && row.employeeCode.trim()) {
          const employee = await prisma.employee.findFirst({
            where: { employeeCode: row.employeeCode.trim() },
          });
          if (employee) {
            employeeId = employee.id;
          } else {
            importNote = `Note: Employee code ${row.employeeCode} not found. Account imported as unassigned.`;
          }
        }

        // 6. Map platform (Enforce Enums)
        let platform: 'google_workspace' | 'microsoft_365' | 'zoho' | 'other' = 'other';
        const csvPlatform = row.platform?.toLowerCase() || '';
        if (csvPlatform.includes('google')) platform = 'google_workspace';
        else if (csvPlatform.includes('microsoft') || csvPlatform.includes('365')) platform = 'microsoft_365';
        else if (csvPlatform.includes('zoho')) platform = 'zoho';

        // 7. Map account type (Enforce Enums)
        let accountType: 'personal' | 'shared' | 'alias' | 'distribution' | 'service' = 'personal';
        const csvType = row.accountType?.toLowerCase() || '';
        if (csvType === 'shared') accountType = 'shared';
        else if (csvType === 'alias') accountType = 'alias';
        else if (csvType === 'distribution') accountType = 'distribution';
        else if (csvType === 'service') accountType = 'service';

        // 8. Map status (Enforce Enums)
        let status: 'active' | 'suspended' | 'deactivated' | 'deleted' = 'active';
        const csvStatus = row.status?.toLowerCase() || '';
        if (csvStatus === 'suspended') status = 'suspended';
        else if (csvStatus === 'deactivated' || csvStatus === 'inactive') status = 'deactivated';
        else if (csvStatus === 'deleted') status = 'deleted';

        // Create email account
        const emailAccount = await prisma.emailAccount.create({
          data: {
            emailAddress,
            displayName: row.displayName?.trim() || emailAddress.split('@')[0],
            employeeId: employeeId as any,
            accountType,
            platform,
            status,
            password: row.passwordHash?.trim() || null,
            forwardingEnabled: !!row.forwardingAddresses?.trim(),
            createdBy: currentUser.id,
          },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            entityType: 'email_account',
            entityId: emailAccount.id,
            action: 'created',
            changedBy: currentUser.id,
            newValue: JSON.parse(JSON.stringify(emailAccount)),
          }
        });

        // Handle forwarding addresses
        if (row.forwardingAddresses && row.forwardingAddresses.trim()) {
          const addresses = row.forwardingAddresses.split(';').map(a => a.trim()).filter(a => a);
          if (addresses.length > 0) {
            await prisma.emailForwarding.createMany({
              data: addresses.map(addr => ({
                emailAccountId: emailAccount.id,
                forwardToAddress: addr,
                forwardType: 'copy',
                isActive: true,
                createdBy: currentUser.id,
              })),
            });
          }
        }

        imported++;
        results.push({ email: emailAddress, status: 'imported', id: emailAccount.id });
      } catch (error: any) {
        errors++;
        console.error(`Error importing ${row.emailAddress}:`, error.message);
        results.push({ email: row.emailAddress || 'Unknown', status: 'error', reason: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      summary: { total: records.length, imported, skipped, errors },
      results,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed', details: error.message }, { status: 500 });
  }
}
