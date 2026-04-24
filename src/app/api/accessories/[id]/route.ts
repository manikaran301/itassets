import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const accessory = await prisma.accessory.findUnique({
      where: { id },
      include: {
        currentEmployee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            photoPath: true,
          },
        },
      },
    });

    if (!accessory) {
      return NextResponse.json(
        { error: 'Accessory not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(accessory);
  } catch (error) {
    console.error('Accessory fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessory' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Status enum mapping
    const statusMap: Record<string, string> = {
      'available': 'available',
      'assigned': 'assigned',
      'in_repair': 'in_repair',
      'retired': 'retired',
    };

    // Condition enum mapping
    const conditionMap: Record<string, string> = {
      'excellent': 'excellent',
      'good': 'good',
      'fair': 'fair',
    };

    const updateData: any = {};
    if (body.model !== undefined) updateData.model = body.model || null;
    if (body.status) updateData.status = statusMap[body.status] || body.status;
    if (body.condition) updateData.condition = conditionMap[body.condition] || body.condition;

    const accessory = await prisma.accessory.update({
      where: { id },
      data: updateData,
      include: {
        currentEmployee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    return NextResponse.json(accessory);
  } catch (error) {
    console.error('Accessory update error:', error);
    return NextResponse.json(
      { error: 'Failed to update accessory' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.accessory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Accessory delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete accessory' },
      { status: 500 }
    );
  }
}
