import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Session check (defense in depth - middleware also checks)
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assets = await prisma.asset.findMany({
      include: {
        currentEmployee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            deskNumber: true,
          },
        },
      },
      orderBy: {
        assetTag: 'asc',
      },
    });
    return NextResponse.json(assets);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

import { z } from 'zod';

const AssetSchema = z.object({
  assetTag: z.string().min(1, "Asset Tag is required").trim(),
  type: z.enum(['laptop', 'desktop', 'zero_client', 'n_computing', 'nuc', 'server', 'other']),
  make: z.string().trim().nullable().optional(),
  model: z.string().trim().nullable().optional(),
  serialNumber: z.string().trim().nullable().optional(),
  macAddress: z.string().trim().nullable().optional(),
  ipAddress: z.string().trim().nullable().optional(),
  cpu: z.string().trim().nullable().optional(),
  ramGb: z.string().trim().nullable().optional(),
  ramType: z.string().trim().nullable().optional(),
  ssdGb: z.number().int().nonnegative().nullable().optional(),
  ssdType: z.string().trim().nullable().optional(),
  hddGb: z.number().int().nonnegative().nullable().optional(),
  hddType: z.string().trim().nullable().optional(),
  os: z.string().trim().nullable().optional(),
  osVersion: z.string().trim().nullable().optional(),
  antivirusStatus: z.enum(['yes', 'no', 'expired']).default('no'),
  antivirusName: z.string().trim().nullable().optional(),
  warrantyExpiry: z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  cost: z.number().nonnegative().nullable().optional(),
  status: z.enum(['available', 'assigned', 'in_repair', 'retired', 'lost']).default('available'),
  notes: z.string().trim().nullable().optional(),
  changedBy: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    // Session check (defense in depth - middleware also checks)
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const normalizedType = data.type === 'zero_client' ? 'n_computing' : data.type;

    const asset = await prisma.asset.create({
      data: {
        assetTag: data.assetTag,
        type: normalizedType,
        make: data.make || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        macAddress: data.macAddress || null,
        ipAddress: data.ipAddress || null,
        cpu: data.cpu || null,
        ramGb: data.ramGb || null,
        ramType: data.ramType || null,
        ssdGb: data.ssdGb || null,
        ssdType: data.ssdType || null,
        hddGb: data.hddGb || null,
        hddType: data.hddType || null,
        os: data.os || null,
        osVersion: data.osVersion || null,
        antivirusStatus: data.antivirusStatus,
        antivirusName: data.antivirusName || null,
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
        changedBy: data.changedBy || null,
        newValue: JSON.parse(JSON.stringify(asset)),
      }
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    // Handle Prisma unique constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'An asset with this Tag, Serial Number, or MAC Address already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}

