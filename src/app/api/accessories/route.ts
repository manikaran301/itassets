import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessories = await prisma.accessory.findMany({
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
      orderBy: {
        assetTag: 'asc',
      },
    });

    return NextResponse.json(accessories);
  } catch (error) {
    console.error('Accessories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Convert type from display name to enum (Monitor -> monitor, Docking Station -> docking_station)
    const typeMap: Record<string, string> = {
      'Monitor': 'monitor',
      'Keyboard': 'keyboard',
      'Mouse': 'mouse',
      'Webcam': 'webcam',
      'Headset': 'headset',
      'Docking Station': 'docking_station',
    };

    // Convert condition from display name to enum (Excellent -> excellent, Good -> good, Fair -> fair)
    const conditionMap: Record<string, string> = {
      'Excellent': 'excellent',
      'Good': 'good',
      'Fair': 'fair',
    };

    // Convert status from form values to database enum values
    const statusMap: Record<string, string> = {
      'available': 'available',
      'in_use': 'assigned',
      'in_repair': 'in_repair',
      'retired': 'retired',
    };

    const accessory = await prisma.accessory.create({
      data: {
        assetTag: body.assetTag,
        type: (typeMap[body.type] || 'other') as any,
        model: body.model || null,
        serialNumber: body.serialNumber || null,
        status: (statusMap[body.status] || 'available') as any,
        condition: (conditionMap[body.condition] || 'good') as any,
        currentEmployeeId: body.currentEmployeeId || null,
      },
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

    return NextResponse.json(accessory);
  } catch (error) {
    console.error('Accessory creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create accessory', details: (error as any).message },
      { status: 500 }
    );
  }
}
