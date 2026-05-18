import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from "@/lib/auth";
import { enforcePermission } from '@/lib/permissions';
import { getDataScope } from '@/lib/scoping';

export async function GET() {
  try {
    // Session check (defense in depth - middleware also checks)
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;
    const userId = user?.id;
    const userRole = user?.role;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'ASSETS', 'canView', userRole);

    const scope = await getDataScope();
    
    // Map the scope for Asset (which filters via Workspace)
    const assetScope: any = {};
    if (scope.locationId) assetScope.workspace = { ...assetScope.workspace, locationId: scope.locationId };
    
    if (scope.companyId) {
      const companyIds = typeof scope.companyId === 'string' 
        ? [scope.companyId] 
        : (scope.companyId as any).in || [];

      if (companyIds.length > 0) {
        const companies = await prisma.company.findMany({
          where: { id: { in: companyIds } },
          select: { name: true }
        });

        const enumValues: string[] = [];
        companies.forEach(company => {
          if (company.name === "50Hertz Limited" || company.name === "50-Hertz" || company.name === "50Hertz") {
            enumValues.push("FIFTY_HERTZ");
          } else if (company.name === "MPL" || company.name.includes("Power Limited")) {
            enumValues.push("MPL");
          } else if (company.name === "MAL" || company.name.includes("Analytics Limited")) {
            enumValues.push("MAL");
          } else {
            enumValues.push("OTHER");
          }
        });

        if (enumValues.length > 0) {
          assetScope.workspace = { 
            ...assetScope.workspace, 
            company: { in: [...new Set(enumValues)] } 
          };
        }
      }
    }
    // Also include assets with NO workspace (global assets) if the user has broad access
    // This part depends on business logic, but for now we keep it strict to the workspace scope

    const assets = await prisma.asset.findMany({
      where: assetScope,
      include: {
        currentEmployee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            deskNumber: true,
            department: true,
            reportingManagerId: true,
            manager: {
              select: {
                fullName: true
              }
            },
            photoPath: true,
            workspace: {
              select: {
                code: true
              }
            }
          },
        },
        workspace: {
          select: {
            code: true,
            floor: true
          }
        },
        creator: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        assetTag: 'asc',
      },
    });

    // Handle Decimal serialization for cost
    const serializedAssets = assets.map(asset => ({
      ...asset,
      cost: asset.cost ? Number(asset.cost) : null,
    }));

    return NextResponse.json(serializedAssets);
  } catch (error: any) {
    console.error("API Error [GET /api/assets]:", error);
    return NextResponse.json({ error: 'Failed to fetch assets', details: error.message }, { status: 500 });
  }
}

import { z } from 'zod';

const AssetSchema = z.object({
  assetTag: z.string().min(1, "Asset Tag is required").trim(),
  type: z.enum(['laptop', 'desktop', 'zero_client', 'n_computing', 'nuc', 'server', 'printer', 'switch', 'access_point', 'tv', 'nvr', 'dvr', 'other']),
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
  graphicCard: z.string().trim().nullable().optional(),
  monitorSize: z.string().trim().nullable().optional(),
  lanPorts: z.number().int().nonnegative().nullable().optional(),
  screenSize: z.string().trim().nullable().optional(),
  channel: z.string().trim().nullable().optional(),
  rackNumber: z.string().trim().nullable().optional(),
  allottedArea: z.string().trim().nullable().optional(),
  installedCameras: z.number().int().nonnegative().nullable().optional(),
  connectionType: z.string().trim().nullable().optional(),
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
  workspaceId: z.string().uuid().nullable().optional().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    // Session check (defense in depth - middleware also checks)
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;
    const userId = user?.id;
    const userRole = user?.role;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'ASSETS', 'canCreate', userRole);

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
        graphicCard: data.graphicCard || null,
        monitorSize: data.monitorSize || null,
        lanPorts: data.lanPorts || null,
        screenSize: data.screenSize || null,
        channel: data.channel || null,
        rackNumber: data.rackNumber || null,
        allottedArea: data.allottedArea || null,
        installedCameras: data.installedCameras || null,
        connectionType: data.connectionType || null,
        os: data.os || null,
        osVersion: data.osVersion || null,
        antivirusStatus: data.antivirusStatus,
        antivirusName: data.antivirusName || null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        cost: data.cost || null,
        status: data.status,
        notes: data.notes || null,
        createdBy: data.changedBy || null,
        workspaceId: data.workspaceId || null,
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
