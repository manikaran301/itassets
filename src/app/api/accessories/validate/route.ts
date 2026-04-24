import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await request.json();
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Fetch existing identifiers and employees
    const [existingTags, existingSerials, existingEmployees] = await Promise.all([
      prisma.accessory.findMany({ select: { assetTag: true } }),
      prisma.accessory.findMany({ 
        where: { NOT: { serialNumber: null } },
        select: { serialNumber: true } 
      }),
      prisma.employee.findMany({ select: { employeeCode: true } })
    ]);

    const tagSet = new Set(existingTags.map(t => t.assetTag.toLowerCase()));
    const serialSet = new Set(existingSerials.map(s => s.serialNumber?.toLowerCase()));
    const employeeSet = new Set(existingEmployees.map(e => e.employeeCode.toLowerCase()));

    // Track internal duplicates within the uploaded sheet
    const seenTags = new Set();
    const seenSerials = new Set();

    const validatedItems = items.map((item: any) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const tag = item.assetTag?.toString().trim().toLowerCase();
      const serial = item.serialNumber?.toString().trim().toLowerCase();

      // Check DB Conflicts
      if (tag && tagSet.has(tag)) {
        errors.push(`Asset Tag "${item.assetTag}" already exists in system`);
      }
      if (serial && serialSet.has(serial)) {
        errors.push(`Serial Number "${item.serialNumber}" already exists in system`);
      }

      // Check Internal Duplicates (within the CSV)
      if (tag) {
        if (seenTags.has(tag)) {
          errors.push(`Duplicate Asset Tag "${item.assetTag}" found within the upload sheet`);
        }
        seenTags.add(tag);
      }
      if (serial) {
        if (seenSerials.has(serial)) {
          errors.push(`Duplicate Serial Number "${item.serialNumber}" found within the upload sheet`);
        }
        seenSerials.add(serial);
      }

      // Basic Validation
      if (!item.assetTag) errors.push("Asset Tag is required");
      if (!item.type) errors.push("Accessory Type is required");

      // Employee Validation (Optional)
      const empCode = item.employeeCode?.toString().trim().toLowerCase();
      if (empCode && !employeeSet.has(empCode)) {
        errors.push(`Employee Code "${item.employeeCode}" not found in registry`);
      }

      return {
        ...item,
        isValid: errors.length === 0,
        errors,
        warnings
      };
    });

    return NextResponse.json({
      items: validatedItems,
      summary: {
        total: validatedItems.length,
        valid: validatedItems.filter(i => i.isValid).length,
        invalid: validatedItems.filter(i => !i.isValid).length
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
  }
}
