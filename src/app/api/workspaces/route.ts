import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDataScope } from '@/lib/scoping';
import { enforcePermission } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;
    const userId = user?.id;
    const userRole = user?.role;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'WORKSPACES', 'canView', userRole);

    const scope = await getDataScope();
    
    // Map scope for Workspace (which uses Enum 'company' and 'locationId')
    const workspaceScope: any = {};
    if (scope.locationId) workspaceScope.locationId = scope.locationId;
    
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
          workspaceScope.company = { in: [...new Set(enumValues)] };
        }
      }
    }

    // Fetch workspaces with employee, assets, and accessories
    let safeWorkspaces;
    try {
      const workspaces = await prisma.workspace.findMany({
        where: workspaceScope,
        include: {
          employee: {
            select: { id: true, fullName: true, employeeCode: true, photoPath: true }
          },
          assets: {
            select: { id: true, assetTag: true, type: true }
          },
          accessories: {
            select: { id: true, assetTag: true, type: true }
          }
        },
        orderBy: { code: 'asc' }
      });
      safeWorkspaces = workspaces;
    } catch (e: any) {
      if (e.message.includes("not found in enum 'CompanyBranch'")) {
        console.warn("Prisma Enum mapping lag detected, falling back to raw query");
        // Fallback to raw query if enum mapping is failing
        const rawWorkspaces: any[] = await prisma.$queryRawUnsafe(`
          SELECT w.*, 
            e.id as "empId", e."fullName", e."employeeCode", e."photoPath"
          FROM workspaces w
          LEFT JOIN employees e ON w."employeeId" = e.id
          ORDER BY w.code ASC
        `);
        safeWorkspaces = rawWorkspaces.map(w => ({
          ...w,
          employee: w.empId ? {
            id: w.empId,
            fullName: w.fullName,
            employeeCode: w.employeeCode,
            photoPath: w.photoPath
          } : null,
          assets: [], // Hardware will be fetched by the aggregation logic below
          accessories: []
        }));
      } else {
        throw e;
      }
    }

    // Fetch all employees with desk numbers for occupancy fallback (regardless of status)
    const allEmployees = await prisma.employee.findMany({
      where: { 
        deskNumber: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        photoPath: true,
        deskNumber: true,
        companyId: true
      }
    });

    // Fetch ALL assigned hardware (both employee-linked and workspace-linked)
    const [allAssets, allAccessories] = await Promise.all([
      prisma.asset.findMany({
        select: { id: true, assetTag: true, type: true, currentEmployeeId: true, workspaceId: true }
      }),
      prisma.accessory.findMany({
        select: { id: true, assetTag: true, type: true, currentEmployeeId: true, workspaceId: true }
      })
    ]);

    const resultWorkspaces = safeWorkspaces.map((ws: any) => {
      let occupant = ws.employee;
      
      // Fallback: Check if any employee has this seat code in their deskNumber
      if (!occupant) {
        occupant = allEmployees.find(e => e.deskNumber === ws.code) || null;
      }

      // Aggregate assets: those formally at this desk + those assigned to the occupant
      const seatAssets = allAssets.filter(a => 
        a.workspaceId === ws.id || (occupant && a.currentEmployeeId === occupant.id)
      );
      
      const seatAccessories = allAccessories.filter(a => 
        a.workspaceId === ws.id || (occupant && a.currentEmployeeId === occupant.id)
      );

      // Deduplicate by ID in case hardware is linked both ways
      const uniqueAssets = Array.from(new Map(seatAssets.map(a => [a.id, a])).values());
      const uniqueAccessories = Array.from(new Map(seatAccessories.map(a => [a.id, a])).values());

      return {
        ...ws,
        employee: occupant,
        assets: uniqueAssets,
        accessories: uniqueAccessories
      };
    });

    return NextResponse.json(resultWorkspaces);
  } catch (error: any) {
    console.error("API Error [GET /api/workspaces]:", error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;
    const userId = user?.id;
    const userRole = user?.role;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'WORKSPACES', 'canCreate', userRole);

    const body = await request.json();
    const { code, company, type, floor, capacity, locationId } = body;

    if (!code) {
      return NextResponse.json({ error: "Seat code is required" }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.workspace.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'A seat with this code already exists' }, { status: 409 });
    }

    const workspace = await prisma.workspace.create({
      data: {
        code,
        company: company || "MPL",
        type: type || "workstation",
        floor: floor || "03",
        capacity: capacity || 1,
        locationId: locationId || null,
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error: any) {
    console.error("API Error [POST /api/workspaces]:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;
    const userId = user?.id;
    const userRole = user?.role;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await enforcePermission(userId, "IT", "WORKSPACES", "canEdit", userRole);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const body = await request.json();
    const { code, company, type, floor, capacity, locationId } = body;

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        code,
        company,
        type,
        floor,
        capacity,
        locationId: locationId || null,
      },
    });

    return NextResponse.json(workspace);
  } catch (error: any) {
    console.error("API Error [PUT /api/workspaces]:", error);
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}
