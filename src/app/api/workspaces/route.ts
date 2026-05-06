import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDataScope } from '@/lib/scoping';
import { enforcePermission } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'WORKSPACES', 'canView');

    const scope = await getDataScope();
    
    // Map scope for Workspace (which uses Enum 'company' and 'locationId')
    const workspaceScope: any = {};
    if (scope.locationId) workspaceScope.locationId = scope.locationId;
    if (scope.companyId) workspaceScope.company = scope.companyId as any; // Map ID to Enum

    // Fetch workspaces with employee, assets, and accessories
    const workspaces = await prisma.workspace.findMany({
      where: workspaceScope,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            photoPath: true
          }
        },
        assets: {
          select: {
            id: true,
            assetTag: true,
            type: true
          }
        },
        accessories: {
          select: {
            id: true,
            assetTag: true,
            type: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Fetch all employees with desk numbers for occupancy fallback (regardless of status)
    const allEmployees = await prisma.employee.findMany({
      where: { 
        ...scope,
        deskNumber: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        photoPath: true,
        deskNumber: true
      }
    });

    // Fetch ALL assigned hardware (both employee-linked and workspace-linked)
    const [allAssets, allAccessories] = await Promise.all([
      prisma.asset.findMany({
        where: { 
          workspace: workspaceScope,
          OR: [{ currentEmployeeId: { not: null } }, { workspaceId: { not: null } }] 
        },
        select: { id: true, assetTag: true, type: true, currentEmployeeId: true, workspaceId: true }
      }),
      prisma.accessory.findMany({
        where: { OR: [{ currentEmployeeId: { not: null } }, { workspaceId: { not: null } }] },
        select: { id: true, assetTag: true, type: true, currentEmployeeId: true, workspaceId: true }
      })
    ]);

    const safeWorkspaces = workspaces.map((ws: any) => {
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

    return NextResponse.json(safeWorkspaces);
  } catch (error: any) {
    console.error("API Error [GET /api/workspaces]:", error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await enforcePermission(userId, 'IT', 'WORKSPACES', 'canCreate');

    const body = await request.json();
    const { code, company, type, floor, capacity } = body;

    if (!code) {
      return NextResponse.json({ error: 'Seat code is required' }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.workspace.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'A seat with this code already exists' }, { status: 409 });
    }

    const workspace = await prisma.workspace.create({
      data: {
        code,
        company: company || 'MPL',
        type: type || 'workstation',
        floor: floor || '03',
        capacity: capacity || 1,
      }
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error: any) {
    console.error("API Error [POST /api/workspaces]:", error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
