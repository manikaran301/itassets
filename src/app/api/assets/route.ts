import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        currentEmployee: true,
      },
      orderBy: {
        assetTag: 'asc',
      },
    });
    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

import { z } from 'zod';

const AssetSchema = z.object({
  assetTag: z.string().min(1, "Asset Tag is required").trim(),
  type: z.enum(['laptop', 'desktop', 'n_computing', 'nuc', 'server', 'other']),
  make: z.string().trim().nullable().optional(),
  model: z.string().trim().nullable().optional(),
  serialNumber: z.string().trim().nullable().optional(),
  macAddress: z.string().trim().nullable().optional(),
  ipAddress: z.string().trim().nullable().optional(),
  cpu: z.string().trim().nullable().optional(),
  ramGb: z.string().trim().nullable().optional(),
  ssdGb: z.number().int().positive().nullable().optional(),
  hddGb: z.number().int().positive().nullable().optional(),
  os: z.string().trim().nullable().optional(),
  osVersion: z.string().trim().nullable().optional(),
  antivirusStatus: z.enum(['yes', 'no', 'expired']).default('no'),
  warrantyExpiry: z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  cost: z.number().nonnegative().nullable().optional(),
  status: z.enum(['available', 'assigned', 'in_repair', 'retired', 'lost']).default('available'),
  notes: z.string().trim().nullable().optional(),
  createdBy: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const rawData = await request.json();
    
    // Validate and Sanitize
    const validatedResult = AssetSchema.safeParse(rawData);
    if (!validatedResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validatedResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const data = validatedResult.data;

    const asset = await prisma.asset.create({
      data: {
        assetTag: data.assetTag,
        type: data.type,
        make: data.make || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        macAddress: data.macAddress || null,
        ipAddress: data.ipAddress || null,
        cpu: data.cpu || null,
        ramGb: data.ramGb || null,
        ssdGb: data.ssdGb || null,
        hddGb: data.hddGb || null,
        os: data.os || null,
        osVersion: data.osVersion || null,
        antivirusStatus: data.antivirusStatus,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        cost: data.cost || null,
        status: data.status,
        notes: data.notes || null,
      },
    });

    // Create audit log entry (changedBy is optional since auth may not be set up)
    await prisma.auditLog.create({
      data: {
        entityType: 'asset',
        entityId: asset.id,
        action: 'created',
        changedBy: data.createdBy || null,
        newValue: asset as any,
      }
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error: any) {
    console.error(error);
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An asset with this Tag, Serial Number, or MAC Address already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}

