import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await prisma.workspace.findMany({
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

    return NextResponse.json(workspaces);
  } catch (error: any) {
    console.error("API Error [GET /api/workspaces]:", error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}
